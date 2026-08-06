import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import 'fake-indexeddb/auto'

// ---------------------------------------------------------------------------
// Hoisted mock state — all variables used inside vi.mock() factories must be
// declared in vi.hoisted() because vi.mock is hoisted to the top of the file.
// ---------------------------------------------------------------------------

const hoisted = vi.hoisted(() => {
  const mockGet = vi.fn()
  const mockSet = vi.fn()
  const mockSupabaseEq = vi.fn()
  const mockSupabaseSelect = vi.fn(() => ({ eq: mockSupabaseEq }))
  const mockSupabaseFrom = vi.fn(() => ({ select: mockSupabaseSelect }))
  const mockGetSupabaseClient = vi.fn(() => ({ from: mockSupabaseFrom }))

  // Mock state for guildStore and authStore
  let mockActiveGuildId: string | null = null
  let mockAuthStatus: 'loggedOut' | 'loading' | 'authenticated' = 'authenticated'

  return {
    mockGet,
    mockSet,
    mockSupabaseEq,
    mockSupabaseSelect,
    mockSupabaseFrom,
    mockGetSupabaseClient,
    getMockActiveGuildId: () => mockActiveGuildId,
    setMockActiveGuildId: (v: string | null) => { mockActiveGuildId = v },
    getMockAuthStatus: () => mockAuthStatus,
    setMockAuthStatus: (v: 'loggedOut' | 'loading' | 'authenticated') => { mockAuthStatus = v },
  }
})

// ---------------------------------------------------------------------------
// Mocks (hoisted by vitest — must not reference non-hoisted variables)
// ---------------------------------------------------------------------------

vi.mock('idb-keyval', () => ({
  get: hoisted.mockGet,
  set: hoisted.mockSet,
}))

vi.mock('@/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/infra/sharingService', () => ({
  getSupabaseClient: hoisted.mockGetSupabaseClient,
}))

vi.mock('@/stores/guildStore', () => ({
  useGuildStore: vi.fn(() => ({
    get activeGuildId() { return hoisted.getMockActiveGuildId() },
    guilds: [],
    isLoading: false,
    error: null,
    setActiveGuild: vi.fn(),
  })),
}))

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    get status() { return hoisted.getMockAuthStatus() },
    providerToken: null,
  })),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks are registered)
// ---------------------------------------------------------------------------

import { logger } from '@/utils/logger'
import { useRulesStore } from '@/stores/rulesStore'
import { useGuildContentSyncStore } from '@/stores/guildContentSyncStore'
import type { CharacterSpell, CharacterFeature } from '@/types/character'
import type { GuildSpell, GuildFeat } from '@/types/supabase'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validGuildSpellData: CharacterSpell = {
  name: 'Guild Bolt',
  level: 1,
  desc: 'A bolt of guild energy.',
  school: 'Evocation' as any,
  castingTime: '1 action',
  range: '120 feet',
  duration: 'Instantaneous',
}

const validGuildFeatData: CharacterFeature = {
  title: 'Guild Training',
  desc: 'You are trained by your guild.',
  featureType: 'Guild Feat',
  source: 'Guild',
}

function makeGuildSpellRow(data: Record<string, unknown>): GuildSpell {
  return {
    id: 'spell-1',
    guild_id: 'guild-123',
    created_by: 'user-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    data,
  }
}

function makeGuildFeatRow(data: Record<string, unknown>): GuildFeat {
  return {
    id: 'feat-1',
    guild_id: 'guild-123',
    created_by: 'user-1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    data,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('guildContentSyncStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    hoisted.setMockActiveGuildId(null)
    hoisted.setMockAuthStatus('authenticated')
    hoisted.mockGetSupabaseClient.mockReturnValue({ from: hoisted.mockSupabaseFrom })
  })

  describe('initial state', () => {
    it('initializes with isLoading false and no error', () => {
      const store = useGuildContentSyncStore()
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
      expect(store.lastSyncedGuildId).toBeNull()
    })
  })

  describe('syncGuildContent', () => {
    it('fetches guild spells and feats from Supabase when guild is selected', async () => {
      const spellRow = makeGuildSpellRow(validGuildSpellData as unknown as Record<string, unknown>)
      const featRow = makeGuildFeatRow(validGuildFeatData as unknown as Record<string, unknown>)

      hoisted.mockSupabaseEq
        .mockResolvedValueOnce({ data: [spellRow], error: null })
        .mockResolvedValueOnce({ data: [featRow], error: null })

      const store = useGuildContentSyncStore()
      const rulesStore = useRulesStore()

      await store.syncGuildContent('guild-123')

      // Verify Supabase was queried
      expect(hoisted.mockSupabaseFrom).toHaveBeenCalledWith('guild_spells')
      expect(hoisted.mockSupabaseFrom).toHaveBeenCalledWith('guild_feats')

      // Verify guild spells injected
      expect(rulesStore.guildSpells).toHaveLength(1)
      expect(rulesStore.guildSpells[0]).toMatchObject({
        name: 'Guild Bolt', level: 1, desc: 'A bolt of guild energy.',
        _id: 'spell-1',
        _guild_id: 'guild-123',
      })
      expect(rulesStore.guildFeats).toHaveLength(1)
      expect(rulesStore.guildFeats[0]).toMatchObject({
        title: 'Guild Training', desc: 'You are trained by your guild.',
        _id: 'feat-1',
        _guild_id: 'guild-123',
      })

      // Verify allSpells getter merges base + guild
      rulesStore.baseSpells = [{ name: 'Fireball', level: 3, desc: 'Boom' }]
      expect(rulesStore.allSpells).toHaveLength(2)
      expect(rulesStore.allSpells[0].name).toBe('Fireball')
      expect(rulesStore.allSpells[1].name).toBe('Guild Bolt')

      // Verify cache was saved (normalizer adds source: 'Guild' etc.)
      const cachedSpells = hoisted.mockSet.mock.calls.find((c: unknown[]) => c[0] === 'guild_spells_cache:guild-123')?.[1]
      const cachedFeats = hoisted.mockSet.mock.calls.find((c: unknown[]) => c[0] === 'guild_feats_cache:guild-123')?.[1]
      expect(cachedSpells).toBeDefined()
      expect(cachedSpells[0]).toMatchObject({ name: 'Guild Bolt', level: 1 })
      expect(cachedFeats).toBeDefined()
      expect(cachedFeats[0]).toMatchObject({ title: 'Guild Training', source: 'Guild' })

      expect(store.lastSyncedGuildId).toBe('guild-123')
      expect(store.error).toBeNull()
    })

    it('handles empty results from Supabase gracefully', async () => {
      hoisted.mockSupabaseEq
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })

      const store = useGuildContentSyncStore()
      const rulesStore = useRulesStore()

      await store.syncGuildContent('guild-123')

      expect(rulesStore.guildSpells).toEqual([])
      expect(rulesStore.guildFeats).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('falls back to IndexedDB cache on network failure', async () => {
      hoisted.mockSupabaseEq.mockRejectedValue(new Error('Network error'))

      hoisted.mockGet
        .mockResolvedValueOnce([validGuildSpellData])
        .mockResolvedValueOnce([validGuildFeatData])

      const store = useGuildContentSyncStore()
      const rulesStore = useRulesStore()

      await store.syncGuildContent('guild-123')

      // Should inject from cache
      expect(rulesStore.guildSpells).toHaveLength(1)
      expect(rulesStore.guildSpells[0].name).toBe('Guild Bolt')
      expect(rulesStore.guildFeats).toHaveLength(1)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('handles missing IndexedDB cache on network failure gracefully', async () => {
      hoisted.mockSupabaseEq.mockRejectedValue(new Error('Network error'))
      hoisted.mockGet.mockResolvedValue(undefined)

      const store = useGuildContentSyncStore()
      const rulesStore = useRulesStore()

      await store.syncGuildContent('guild-123')

      expect(rulesStore.guildSpells).toEqual([])
      expect(rulesStore.guildFeats).toEqual([])
      expect(store.isLoading).toBe(false)
    })

    it('replaces previously synced guild content when switching guilds', async () => {
      const spellA = makeGuildSpellRow(validGuildSpellData as unknown as Record<string, unknown>)
      hoisted.mockSupabaseEq
        .mockResolvedValueOnce({ data: [spellA], error: null })
        .mockResolvedValueOnce({ data: [], error: null })

      const store = useGuildContentSyncStore()
      const rulesStore = useRulesStore()

      await store.syncGuildContent('guild-a')
      expect(store.lastSyncedGuildId).toBe('guild-a')
      expect(rulesStore.guildSpells).toHaveLength(1)

      vi.clearAllMocks()
      hoisted.mockSupabaseEq
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })

      await store.syncGuildContent('guild-b')
      expect(store.lastSyncedGuildId).toBe('guild-b')
      expect(rulesStore.guildSpells).toEqual([])
    })
  })

  describe('JSONB validation', () => {
    it('filters out spells with missing name field', async () => {
      const invalidSpell = makeGuildSpellRow({ level: 1, desc: 'No name' } as any)
      const validSpell = makeGuildSpellRow(validGuildSpellData as unknown as Record<string, unknown>)

      hoisted.mockSupabaseEq
        .mockResolvedValueOnce({ data: [invalidSpell, validSpell], error: null })
        .mockResolvedValueOnce({ data: [], error: null })

      const store = useGuildContentSyncStore()
      const rulesStore = useRulesStore()

      await store.syncGuildContent('guild-123')

      expect(rulesStore.guildSpells).toHaveLength(1)
      expect(rulesStore.guildSpells[0].name).toBe('Guild Bolt')
      expect(logger.warn).toHaveBeenCalled()
      expect(store.isLoading).toBe(false)
    })

    it('filters out feats with missing title field', async () => {
      const invalidFeat = makeGuildFeatRow({ desc: 'No title' } as any)
      const validFeat = makeGuildFeatRow(validGuildFeatData as unknown as Record<string, unknown>)

      hoisted.mockSupabaseEq
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [invalidFeat, validFeat], error: null })

      const store = useGuildContentSyncStore()
      const rulesStore = useRulesStore()

      await store.syncGuildContent('guild-123')

      expect(rulesStore.guildFeats).toHaveLength(1)
      expect(rulesStore.guildFeats[0].title).toBe('Guild Training')
      expect(logger.warn).toHaveBeenCalled()
      expect(store.isLoading).toBe(false)
    })

    it('handles rows with null data gracefully', async () => {
      const badRow = makeGuildSpellRow(null as any)
      const validSpell = makeGuildSpellRow(validGuildSpellData as unknown as Record<string, unknown>)

      hoisted.mockSupabaseEq
        .mockResolvedValueOnce({ data: [badRow, validSpell], error: null })
        .mockResolvedValueOnce({ data: [], error: null })

      const store = useGuildContentSyncStore()
      const rulesStore = useRulesStore()

      await store.syncGuildContent('guild-123')

      expect(rulesStore.guildSpells).toHaveLength(1)
      expect(logger.warn).toHaveBeenCalled()
      expect(store.isLoading).toBe(false)
    })

    it('handles rows with non-object data gracefully', async () => {
      const badRow = makeGuildSpellRow('not-an-object' as any)
      const validSpell = makeGuildSpellRow(validGuildSpellData as unknown as Record<string, unknown>)

      hoisted.mockSupabaseEq
        .mockResolvedValueOnce({ data: [badRow, validSpell], error: null })
        .mockResolvedValueOnce({ data: [], error: null })

      const store = useGuildContentSyncStore()
      const rulesStore = useRulesStore()

      await store.syncGuildContent('guild-123')

      expect(rulesStore.guildSpells).toHaveLength(1)
      expect(logger.warn).toHaveBeenCalled()
      expect(store.isLoading).toBe(false)
    })
  })

  describe('stripGuildContent', () => {
    it('clears guild content from rulesStore', () => {
      const rulesStore = useRulesStore()
      rulesStore.guildSpells = [{ name: 'Test', level: 1, desc: '' }]
      rulesStore.guildFeats = [{ title: 'Test', desc: '' }]

      const store = useGuildContentSyncStore()
      store.stripGuildContent()

      expect(rulesStore.guildSpells).toEqual([])
      expect(rulesStore.guildFeats).toEqual([])
      expect(store.lastSyncedGuildId).toBeNull()
    })
  })

  describe('syncGuildContentIfNeeded', () => {
    it('syncs when activeGuildId is already set', async () => {
      hoisted.setMockActiveGuildId('guild-123')
      hoisted.mockSupabaseEq
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })

      const store = useGuildContentSyncStore()
      await store.syncGuildContentIfNeeded()

      expect(hoisted.mockSupabaseFrom).toHaveBeenCalledWith('guild_spells')
      expect(store.lastSyncedGuildId).toBe('guild-123')
    })

    it('does not sync when activeGuildId is null', async () => {
      hoisted.setMockActiveGuildId(null)

      const store = useGuildContentSyncStore()
      await store.syncGuildContentIfNeeded()

      expect(hoisted.mockSupabaseFrom).not.toHaveBeenCalled()
    })

    it('does not re-sync for the same guild', async () => {
      hoisted.setMockActiveGuildId('guild-123')
      hoisted.mockSupabaseEq
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null })

      const store = useGuildContentSyncStore()
      await store.syncGuildContentIfNeeded()
      expect(store.lastSyncedGuildId).toBe('guild-123')

      vi.clearAllMocks()

      await store.syncGuildContentIfNeeded()
      expect(hoisted.mockSupabaseFrom).not.toHaveBeenCalled()
    })
  })
})