import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { get, set } from 'idb-keyval'
import { useAuthStore } from './authStore'
import { STORAGE_KEYS } from '../constants/storage-keys'
import { logger } from '../utils/logger'
import type { DiscordGuild } from '../types/discord'

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

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------

  const activeGuild = computed<DiscordGuild | null>(() => {
    return guilds.value.find((guild) => guild.id === activeGuildId.value) ?? null
  })

  const isActiveGuildSet = computed(() => activeGuildId.value !== null)

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
        setActiveGuild(null)
        error.value = null
      }
    },
  )

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Fetch the user's Discord guilds using the OAuth provider token from the
   * current Supabase session. On success, the list is cached in IndexedDB.
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

  return {
    // State
    guilds,
    activeGuildId,
    isLoading,
    error,
    // Getters
    activeGuild,
    isActiveGuildSet,
    // Actions
    fetchGuilds,
    setActiveGuild,
    initialize,
  }
})
