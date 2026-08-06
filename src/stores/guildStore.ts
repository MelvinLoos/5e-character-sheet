import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { get, set } from 'idb-keyval'
import { useAuthStore } from './authStore'
import { STORAGE_KEYS } from '../constants/storage-keys'
import { logger } from '../utils/logger'
import { hasAdminPermission } from '../utils/guildPermissions'
import { getSupabaseClient } from '../infra/sharingService'
import type { DiscordGuild } from '../types/discord'
import type { RegisteredGuild } from '../types/supabase'

const GUILD_CACHE_KEY = 'guild_cache'

export const useGuildStore = defineStore('guild', () => {
  const authStore = useAuthStore()

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const guilds = ref<DiscordGuild[]>([])
  const activeGuildId = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const registeredGuildIds = ref<Set<string> | null>(null)

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  const activeGuild = computed<DiscordGuild | null>(() => {
    return guilds.value.find((guild) => guild.id === activeGuildId.value) ?? null
  })

  const isActiveGuildSet = computed(() => activeGuildId.value !== null)

  /**
   * Whether the current user has admin rights (ADMINISTRATOR or MANAGE_GUILD)
   * for the currently active guild. Used to gate admin-only UI.
   */
  const isActiveGuildAdmin = computed(() => {
    if (!authStore.isAuthenticated) return false
    if (!activeGuildId.value || !activeGuild.value) return false
    return hasAdminPermission(activeGuild.value.permissions)
  })

  /**
   * Guilds that should be visible to the user.
   * Filters the Discord API guild list to only show:
   *   a) Guilds present in the `registered_guilds` table, OR
   *   b) Guilds where the user has ADMINISTRATOR or MANAGE_GUILD permissions.
   *
   * Falls back to showing all guilds if Supabase is unavailable (graceful degradation).
   */
  const visibleGuilds = computed<DiscordGuild[]>(() => {
    const ids = registeredGuildIds.value

    // If Supabase has never been reached, fail-open and show everything
    if (ids === null) {
      return guilds.value
    }

    return guilds.value.filter(
      (guild) =>
        ids.has(guild.id) ||
        hasAdminPermission(guild.permissions),
    )
  })

  // ---------------------------------------------------------------------------
  // Persistence: active guild selection
  // ---------------------------------------------------------------------------

  function loadActiveGuildIdFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_GUILD_ID)
      activeGuildId.value = stored ?? null
    } catch (e) {
      logger.warn('Unable to read active guild id from localStorage:', (e as Error).message)
      activeGuildId.value = null
    }
  }

  function saveActiveGuildIdToStorage(guildId: string | null): void {
    try {
      if (guildId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_GUILD_ID, guildId)
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_GUILD_ID)
      }
    } catch (e) {
      logger.warn('Unable to persist active guild id to localStorage:', (e as Error).message)
    }
  }

  // ---------------------------------------------------------------------------
  // IndexedDB cache
  // ---------------------------------------------------------------------------

  async function loadGuildsFromCache(): Promise<DiscordGuild[]> {
    try {
      const cached = await get<DiscordGuild[]>(GUILD_CACHE_KEY)
      return cached ?? []
    } catch (e) {
      logger.warn('Unable to read guild cache from IndexedDB:', (e as Error).message)
      return []
    }
  }

  async function saveGuildsToCache(guildList: DiscordGuild[]): Promise<void> {
    try {
      await set(GUILD_CACHE_KEY, guildList)
    } catch (e) {
      logger.warn('Unable to save guild cache to IndexedDB:', (e as Error).message)
    }
  }

  // ---------------------------------------------------------------------------
  // Watchers
  // ---------------------------------------------------------------------------

  /**
   * If the active guild is no longer present in the user's guild list, clear it.
   * This can happen when a user leaves a server.
   */
  watch(
    () => guilds.value.map((g) => g.id),
    (guildIds) => {
      if (activeGuildId.value && !guildIds.includes(activeGuildId.value)) {
        setActiveGuild(null)
      }
    },
  )

  /**
   * When the user signs out, reset guild state entirely.
   */
  watch(
    () => authStore.status,
    (status) => {
      if (status === 'loggedOut') {
        guilds.value = []
        registeredGuildIds.value = null
        setActiveGuild(null)
        error.value = null
      }
    },
  )

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Query the Supabase `registered_guilds` table to determine which Discord
   * servers have opted into the app.
   *
   * Results are stored as a Set<string> for O(1) lookup in the `visibleGuilds` getter.
   * On error or unavailable Supabase client, falls back to an empty set (shows all guilds).
   */
  async function fetchRegisteredGuilds(): Promise<void> {
    const client = getSupabaseClient()

    if (!client) {
      // Supabase unavailable — keep null so visibleGuilds shows everything
      registeredGuildIds.value = null
      return
    }

    try {
      const { data, error: queryError } = await client
        .from('registered_guilds')
        .select('guild_id')

      if (queryError || !data) {
        logger.warn('Failed to fetch registered guilds:', queryError?.message)
        // Fails open: null → show all guilds
        registeredGuildIds.value = null
        return
      }

      const guilds = data as Pick<RegisteredGuild, 'guild_id'>[]
      registeredGuildIds.value = new Set(guilds.map((g) => g.guild_id))
    } catch (e) {
      logger.warn('Error fetching registered guilds:', (e as Error).message)
      registeredGuildIds.value = null
    }
  }

  /**
   * Fetch the user's Discord guilds using the OAuth provider token from the
   * current Supabase session. On success, the list is cached in IndexedDB
   * and registered guild IDs are refreshed from Supabase.
   * On failure, stale cache is served if available.
   */
  async function fetchGuilds(): Promise<void> {
    const token = authStore.providerToken

    if (!token) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status} ${response.statusText}`)
      }

      const data = (await response.json()) as DiscordGuild[]
      guilds.value = data

      await saveGuildsToCache(data)

      // After successfully fetching guilds, refresh registered guild IDs
      await fetchRegisteredGuilds()
    } catch (e) {
      error.value = (e as Error).message
      logger.error('Failed to fetch Discord guilds:', e)

      const cached = await loadGuildsFromCache()
      if (cached.length > 0) {
        guilds.value = cached
      }
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Switch the active guild scope. Passing `null` clears the selection.
   */
  function setActiveGuild(guildId: string | null): void {
    activeGuildId.value = guildId
    saveActiveGuildIdToStorage(guildId)
  }

  /**
   * Initialize the store from localStorage/IndexedDB and trigger a fetch when
   * the user is authenticated.
   */
  async function initialize(): Promise<void> {
    loadActiveGuildIdFromStorage()

    if (authStore.providerToken) {
      await fetchGuilds()
      return
    }

    const cached = await loadGuildsFromCache()
    if (cached.length > 0) {
      guilds.value = cached
    }
  }

  /**
   * Register the currently active guild in the `registered_guilds` Supabase table.
   *
   * Prerequisites:
   * - User must be authenticated (throws if not).
   * - An active guild must be selected (throws if not).
   * - The active guild must exist in the loaded guild list (throws if not).
   *
   * On success, optimistically adds the guild ID to `registeredGuildIds`.
   */
  async function registerActiveGuild(): Promise<void> {
    const client = getSupabaseClient()

    if (!authStore.isAuthenticated) {
      throw new Error('User is not authenticated')
    }

    if (!activeGuildId.value) {
      throw new Error('No active guild selected')
    }

    if (!activeGuild.value) {
      throw new Error('Active guild not found')
    }

    const { error: insertError } = await client!
      .from('registered_guilds')
      .insert({
        guild_id: activeGuildId.value,
        guild_name: activeGuild.value.name,
        created_by: authStore.userId,
      })

    if (insertError) {
      throw insertError
    }

    // Optimistic update: add to local registered set
    if (registeredGuildIds.value === null) {
      registeredGuildIds.value = new Set()
    }
    registeredGuildIds.value.add(activeGuildId.value)
  }

  return {
    // State
    guilds,
    activeGuildId,
    isLoading,
    error,
    // State (expose registeredGuildIds for testing)
    registeredGuildIds,
    // Getters
    activeGuild,
    isActiveGuildSet,
    isActiveGuildAdmin,
    visibleGuilds,
    // Actions
    fetchGuilds,
    fetchRegisteredGuilds,
    setActiveGuild,
    registerActiveGuild,
    initialize,
  }
})
