import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useGuildStore } from '@/stores/guildStore'
import { useAuthStore } from '@/stores/authStore'
import { useRulesStore } from '@/stores/rulesStore'
import { getSupabaseClient } from '@/infra/sharingService'
import { get, set } from 'idb-keyval'
import { logger } from '@/utils/logger'
import {
  isValidGuildSpell,
  normalizeGuildSpell,
  isValidGuildFeat,
  normalizeGuildFeat,
} from '@/utils/guildContentValidator'
import {
  GUILD_SPELLS_CACHE_PREFIX,
  GUILD_FEATS_CACHE_PREFIX,
} from '@/constants/storage-keys'
import type { GuildSpell, GuildFeat } from '@/types/supabase'

function makeCacheKey(prefix: string, guildId: string): string {
  return `${prefix}:${guildId}`
}

export const useGuildContentSyncStore = defineStore('guildContentSync', () => {
  const guildStore = useGuildStore()
  const authStore = useAuthStore()
  const rulesStore = useRulesStore()

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastSyncedGuildId = ref<string | null>(null)

  // ---------------------------------------------------------------------------
  // Core Actions
  // ---------------------------------------------------------------------------

  /**
   * Fetch guild spells from Supabase, validate, and normalize.
   * Falls back to IndexedDB cache on network failure.
   * Returns an empty array if no data is available.
   */
  async function fetchAndProcessGuildSpells(guildId: string): Promise<unknown[]> {
    const client = getSupabaseClient()

    if (!client) {
      logger.warn('Supabase client unavailable — cannot fetch guild spells')
      return loadFromCache(GUILD_SPELLS_CACHE_PREFIX, guildId)
    }

    try {
      const { data, error: queryError } = await client
        .from('guild_spells')
        .select('data,id,guild_id,created_by,created_at,updated_at')
        .eq('guild_id', guildId)

      if (queryError) {
        logger.error('Failed to fetch guild spells:', queryError.message)
        return loadFromCache(GUILD_SPELLS_CACHE_PREFIX, guildId)
      }

      const rows = (data || []) as GuildSpell[]
      const validated: unknown[] = []

      for (const row of rows) {
        if (isValidGuildSpell(row.data)) {
          const normalized = normalizeGuildSpell(row.data as Record<string, unknown>)
          validated.push({ ...normalized, _id: row.id, _guild_id: row.guild_id })
        }
      }

      // Cache the validated results
      await set(makeCacheKey(GUILD_SPELLS_CACHE_PREFIX, guildId), validated)

      return validated
    } catch (e) {
      logger.warn('Error fetching guild spells, falling back to cache:', (e as Error).message)
      return loadFromCache(GUILD_SPELLS_CACHE_PREFIX, guildId)
    }
  }

  /**
   * Fetch guild feats from Supabase, validate, and normalize.
   * Falls back to IndexedDB cache on network failure.
   * Returns an empty array if no data is available.
   */
  async function fetchAndProcessGuildFeats(guildId: string): Promise<unknown[]> {
    const client = getSupabaseClient()

    if (!client) {
      logger.warn('Supabase client unavailable — cannot fetch guild feats')
      return loadFromCache(GUILD_FEATS_CACHE_PREFIX, guildId)
    }

    try {
      const { data, error: queryError } = await client
        .from('guild_feats')
        .select('data,id,guild_id,created_by,created_at,updated_at')
        .eq('guild_id', guildId)

      if (queryError) {
        logger.error('Failed to fetch guild feats:', queryError.message)
        return loadFromCache(GUILD_FEATS_CACHE_PREFIX, guildId)
      }

      const rows = (data || []) as GuildFeat[]
      const validated: unknown[] = []

      for (const row of rows) {
        if (isValidGuildFeat(row.data)) {
          const normalized = normalizeGuildFeat(row.data as Record<string, unknown>)
          validated.push({ ...normalized, _id: row.id, _guild_id: row.guild_id })
        }
      }

      // Cache the validated results
      await set(makeCacheKey(GUILD_FEATS_CACHE_PREFIX, guildId), validated)

      return validated
    } catch (e) {
      logger.warn('Error fetching guild feats, falling back to cache:', (e as Error).message)
      return loadFromCache(GUILD_FEATS_CACHE_PREFIX, guildId)
    }
  }

  /**
   * Attempt to load guild content from IndexedDB cache.
   * Returns an empty array if nothing is cached.
   */
  async function loadFromCache(prefix: string, guildId: string): Promise<unknown[]> {
    try {
      const cached = await get<unknown[]>(makeCacheKey(prefix, guildId))
      if (cached && Array.isArray(cached)) {
        return cached
      }
    } catch (e) {
      logger.warn('Failed to load guild content from cache:', (e as Error).message)
    }
    return []
  }

  /**
   * Full sync: fetch spells and feats for the given guild, inject into rulesStore.
   * Handles both data fetching, validation, injection, and caching.
   */
  async function syncGuildContent(guildId: string): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const [spells, feats] = await Promise.all([
        fetchAndProcessGuildSpells(guildId),
        fetchAndProcessGuildFeats(guildId),
      ])

      rulesStore.injectGuildSpells(spells)
      rulesStore.injectGuildFeats(feats)

      lastSyncedGuildId.value = guildId
    } catch (e) {
      logger.error('Unexpected error during guild content sync:', (e as Error).message)
      // Don't set error state here — individual fetch functions handle fallback
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Remove all guild-scoped content from the rules store.
   * Called when guild is deselected or changed.
   */
  function stripGuildContent(): void {
    rulesStore.stripGuildContent()
    lastSyncedGuildId.value = null
  }

  /**
   * Syncs guild content if activeGuildId is set and differs from last synced.
   * This is called during initialization and by the watcher.
   */
  async function syncGuildContentIfNeeded(): Promise<void> {
    const guildId = guildStore.activeGuildId

    if (!guildId) {
      // No guild selected — strip any existing guild content
      if (lastSyncedGuildId.value !== null) {
        stripGuildContent()
      }
      return
    }

    // Already synced for this guild — skip
    if (lastSyncedGuildId.value === guildId) {
      return
    }

    await syncGuildContent(guildId)
  }

  // ---------------------------------------------------------------------------
  // Watchers
  // ---------------------------------------------------------------------------

  /**
   * When the active guild changes, re-sync content.
   */
  watch(
    () => guildStore.activeGuildId,
    (newId, oldId) => {
      if (oldId && oldId !== newId) {
        // Guild changed — strip old content first, then sync new
        stripGuildContent()
      }
      if (newId) {
        syncGuildContent(newId)
      } else {
        stripGuildContent()
      }
    },
  )

  /**
   * When the user logs out, strip all guild content.
   */
  watch(
    () => authStore.status,
    (status) => {
      if (status === 'loggedOut') {
        stripGuildContent()
      }
    },
  )

  return {
    // State
    isLoading,
    error,
    lastSyncedGuildId,
    // Actions
    syncGuildContent,
    syncGuildContentIfNeeded,
    stripGuildContent,
  }
})