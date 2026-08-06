import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import 'fake-indexeddb/auto'
import { useGuildStore } from '../src/stores/guildStore'
import { useAuthStore } from '../src/stores/authStore'
import type { DiscordGuild } from '../src/types/discord'

const mockGuilds: DiscordGuild[] = [
  { id: 'guild-1', name: 'Heroes Guild', icon: 'icon-1', owner: false, permissions: '0', features: [] },
  { id: 'guild-2', name: 'Mages Tower', icon: null, owner: true, permissions: '8', features: ['COMMUNITY'] },
  { id: 'guild-3', name: 'Unregistered Guild', icon: null, owner: false, permissions: '0', features: [] },
  { id: 'guild-4', name: 'Mod Guild', icon: null, owner: false, permissions: '32', features: [] },
]

const mockGet = vi.fn()
const mockSet = vi.fn()
const mockDel = vi.fn()

vi.mock('idb-keyval', () => ({
  get: (...args: unknown[]) => mockGet(...args),
  set: (...args: unknown[]) => mockSet(...args),
  del: (...args: unknown[]) => mockDel(...args),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch as unknown as typeof fetch

// Mock Supabase client for registered_guilds queries
const mockFromSelectEqMaybeSingle = vi.fn()
const mockFromSelectSingle = vi.fn()
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: mockFromSelectEqMaybeSingle,
      })),
      single: mockFromSelectSingle,
    })),
  })),
}

vi.mock('../src/infra/sharingService', () => ({
  getSupabaseClient: vi.fn(() => mockSupabaseClient),
}))

function createMockAuthStore(overrides: { providerToken?: string | null; isAuthenticated?: boolean } = {}) {
  const store = useAuthStore()
  store.$patch({
    providerToken: overrides.providerToken ?? null,
    status: overrides.isAuthenticated ? 'authenticated' : 'loggedOut',
  })
  return store
}

describe('guildStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockGet.mockResolvedValue(undefined)
    mockSet.mockResolvedValue(undefined)
    mockDel.mockResolvedValue(undefined)
    localStorage.clear()
  })

  it('initializes with empty guilds and no active guild', () => {
    const store = useGuildStore()

    expect(store.guilds).toEqual([])
    expect(store.activeGuildId).toBeNull()
    expect(store.activeGuild).toBeNull()
    expect(store.isActiveGuildSet).toBe(false)
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('fetches guilds from Discord API when provider token is available', async () => {
    createMockAuthStore({ providerToken: 'discord-token', isAuthenticated: true })
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockGuilds,
    })

    const store = useGuildStore()
    await store.fetchGuilds()

    expect(mockFetch).toHaveBeenCalledWith('https://discord.com/api/users/@me/guilds', {
      headers: { Authorization: 'Bearer discord-token' },
    })
    expect(store.guilds).toEqual(mockGuilds)
    expect(store.error).toBeNull()
    expect(mockSet).toHaveBeenCalledWith('guild_cache', mockGuilds)
  })

  it('does not fetch guilds when provider token is missing', async () => {
    createMockAuthStore({ providerToken: null, isAuthenticated: false })

    const store = useGuildStore()
    await store.fetchGuilds()

    expect(mockFetch).not.toHaveBeenCalled()
    expect(store.guilds).toEqual([])
  })

  it('handles Discord API error gracefully and preserves empty guilds', async () => {
    createMockAuthStore({ providerToken: 'discord-token', isAuthenticated: true })
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    })

    const store = useGuildStore()
    await store.fetchGuilds()

    expect(store.guilds).toEqual([])
    expect(store.error).toContain('401')
  })

  it('serves stale cache when Discord API network request fails', async () => {
    createMockAuthStore({ providerToken: 'discord-token', isAuthenticated: true })
    mockGet.mockResolvedValue(mockGuilds)
    mockFetch.mockRejectedValue(new Error('Network error'))

    const store = useGuildStore()
    await store.fetchGuilds()

    expect(mockGet).toHaveBeenCalledWith('guild_cache')
    expect(store.guilds).toEqual(mockGuilds)
    expect(store.error).not.toBeNull()
  })

  it('serves stale cache when Discord API returns an HTTP error', async () => {
    createMockAuthStore({ providerToken: 'discord-token', isAuthenticated: true })
    mockGet.mockResolvedValue(mockGuilds)
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    })

    const store = useGuildStore()
    await store.fetchGuilds()

    expect(store.guilds).toEqual(mockGuilds)
  })

  it('sets active guild and persists to localStorage', () => {
    createMockAuthStore({ providerToken: 'discord-token', isAuthenticated: true })

    const store = useGuildStore()
    store.$patch({ guilds: mockGuilds })

    store.setActiveGuild('guild-1')

    expect(store.activeGuildId).toBe('guild-1')
    expect(store.activeGuild).toEqual(mockGuilds[0])
    expect(store.isActiveGuildSet).toBe(true)
    expect(localStorage.getItem('dnd_active_guild_id')).toBe('guild-1')
  })

  it('clears active guild when setActiveGuild is called with null', () => {
    createMockAuthStore({ providerToken: 'discord-token', isAuthenticated: true })

    const store = useGuildStore()
    store.$patch({ guilds: mockGuilds })
    store.setActiveGuild('guild-1')

    store.setActiveGuild(null)

    expect(store.activeGuildId).toBeNull()
    expect(store.activeGuild).toBeNull()
    expect(localStorage.getItem('dnd_active_guild_id')).toBeNull()
  })

  it('restores active guild id from localStorage on initialize', () => {
    createMockAuthStore({ providerToken: 'discord-token', isAuthenticated: true })
    localStorage.setItem('dnd_active_guild_id', 'guild-2')

    const store = useGuildStore()
    store.initialize()

    expect(store.activeGuildId).toBe('guild-2')
  })

  it('loads guilds from IndexedDB cache when offline and no provider token', async () => {
    createMockAuthStore({ providerToken: null, isAuthenticated: false })
    mockGet.mockResolvedValue(mockGuilds)

    const store = useGuildStore()
    await store.initialize()

    expect(mockFetch).not.toHaveBeenCalled()
    expect(store.guilds).toEqual(mockGuilds)
  })

  it('does not fetch guilds when offline but cache is empty', async () => {
    createMockAuthStore({ providerToken: null, isAuthenticated: false })
    mockGet.mockResolvedValue(undefined)

    const store = useGuildStore()
    await store.initialize()

    expect(store.guilds).toEqual([])
  })

  it('fetches guilds on initialize when authenticated', async () => {
    createMockAuthStore({ providerToken: 'discord-token', isAuthenticated: true })
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockGuilds,
    })

    const store = useGuildStore()
    await store.initialize()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(store.guilds).toEqual(mockGuilds)
  })

  it('reactively updates activeGuild when guilds change', () => {
    createMockAuthStore({ providerToken: 'discord-token', isAuthenticated: true })

    const store = useGuildStore()
    store.setActiveGuild('guild-1')
    expect(store.activeGuild).toBeNull()

    store.$patch({ guilds: mockGuilds })

    expect(store.activeGuild).toEqual(mockGuilds[0])
  })

  it('clears active guild if selected guild is no longer in guild list', async () => {
    createMockAuthStore({ providerToken: 'discord-token', isAuthenticated: true })

    const store = useGuildStore()
    store.$patch({ guilds: mockGuilds })
    store.setActiveGuild('guild-1')

    store.$patch({ guilds: [mockGuilds[1]] })
    await nextTick()

    expect(store.activeGuildId).toBeNull()
    expect(localStorage.getItem('dnd_active_guild_id')).toBeNull()
  })

  it('is safe to initialize when auth store is not authenticated', async () => {
    createMockAuthStore({ providerToken: null, isAuthenticated: false })

    const store = useGuildStore()
    await expect(store.initialize()).resolves.not.toThrow()
    expect(store.guilds).toEqual([])
  })

  // ---------------------------------------------------------------------------
  // Guild filtering: registered_guilds + admin/moderator permissions (TDD)
  // ---------------------------------------------------------------------------

  it('registeredGuildIds starts as null before any query', () => {
    createMockAuthStore({ providerToken: 'discord-token', isAuthenticated: true })

    const store = useGuildStore()
    expect(store.registeredGuildIds).toBeNull()
  })

  it('fetchRegisteredGuilds populates registered guild IDs from Supabase', async () => {
    createMockAuthStore({ providerToken: 'discord-token', isAuthenticated: true })
    const mockSelect = vi.fn().mockResolvedValue({
      data: [
        { guild_id: 'guild-1' },
        { guild_id: 'guild-2' },
      ],
      error: null,
    })
    mockSupabaseClient.from.mockReturnValue({ select: mockSelect })

    const store = useGuildStore()
    await store.fetchRegisteredGuilds()

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('registered_guilds')
    expect(store.registeredGuildIds).toBeInstanceOf(Set)
    expect(store.registeredGuildIds!.size).toBe(2)
  })

  it('visibleGuilds filters out unregistered guilds without admin permissions', async () => {
    createMockAuthStore({ providerToken: 'discord-token', isAuthenticated: true })
    // guild-1 and guild-2 are registered
    const mockSelect = vi.fn().mockResolvedValue({
      data: [
        { guild_id: 'guild-1' },
        { guild_id: 'guild-2' },
      ],
      error: null,
    })
    mockSupabaseClient.from.mockReturnValue({ select: mockSelect })

    const store = useGuildStore()
    await store.fetchRegisteredGuilds()
    store.$patch({ guilds: mockGuilds })

    // guild-1: registered, guild-2: admin (perms=8), guild-3: neither, guild-4: mod (perms=32)
    const visible = store.visibleGuilds
    const visibleIds = visible.map((g) => g.id)

    expect(visibleIds).toContain('guild-1') // registered
    expect(visibleIds).toContain('guild-2') // ADMINISTRATOR permission
    expect(visibleIds).toContain('guild-4') // MANAGE_GUILD permission
    expect(visibleIds).not.toContain('guild-3') // neither registered nor admin
    expect(visible).toHaveLength(3)
  })

  it('filters out unregistered non-admin guilds when Supabase returns zero registered guilds (empty Set)', async () => {
    createMockAuthStore({ providerToken: 'discord-token', isAuthenticated: true })
    // Supabase is reachable but NO guilds have registered — returns empty array
    const mockSelect = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    })
    mockSupabaseClient.from.mockReturnValue({ select: mockSelect })

    const store = useGuildStore()
    await store.fetchRegisteredGuilds()

    // registeredGuildIds should be an empty Set (not null!)
    expect(store.registeredGuildIds).toBeInstanceOf(Set)
    expect(store.registeredGuildIds!.size).toBe(0)

    store.$patch({ guilds: mockGuilds })

    // Only admin/mod guilds should be visible — unregistered non-admin guilds (guild-1, guild-3) are hidden
    const visible = store.visibleGuilds
    const visibleIds = visible.map((g) => g.id)

    expect(visibleIds).toContain('guild-2') // ADMINISTRATOR permission (8)
    expect(visibleIds).toContain('guild-4') // MANAGE_GUILD permission (32)
    expect(visibleIds).not.toContain('guild-1') // not registered (empty set), no admin perms → LEAK FIXED
    expect(visibleIds).not.toContain('guild-3') // not registered, no admin perms
    expect(visible).toHaveLength(2)
  })

  it('visibleGuilds includes all guilds when Supabase client is unavailable (null state)', async () => {
    const { getSupabaseClient } = await import('../src/infra/sharingService')
    const original = vi.mocked(getSupabaseClient)
    original.mockReturnValue(null)

    createMockAuthStore({ providerToken: 'discord-token', isAuthenticated: true })

    const store = useGuildStore()
    await store.fetchRegisteredGuilds()

    // When Supabase is down, registeredGuildIds stays null
    expect(store.registeredGuildIds).toBeNull()

    store.$patch({ guilds: mockGuilds })

    // All guilds should be visible when Supabase is down (graceful degradation)
    expect(store.visibleGuilds).toEqual(mockGuilds)
    expect(store.visibleGuilds).toHaveLength(4)

    // Restore mock
    original.mockReturnValue(mockSupabaseClient)
  })

  it('fetchRegisteredGuilds handles Supabase errors gracefully and keeps null state', async () => {
    createMockAuthStore({ providerToken: 'discord-token', isAuthenticated: true })
    const mockSelect = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('Database error'),
    })
    mockSupabaseClient.from.mockReturnValue({ select: mockSelect })

    const store = useGuildStore()
    await store.fetchRegisteredGuilds()

    // On error, stays null → fails open
    expect(store.registeredGuildIds).toBeNull()

    store.$patch({ guilds: mockGuilds })

    // When Supabase errors, all guilds should be visible (fails open for UX)
    expect(store.visibleGuilds).toEqual(mockGuilds)
    expect(store.visibleGuilds).toHaveLength(4)
  })

  it('visibleGuilds updates reactively when guilds change', async () => {
    createMockAuthStore({ providerToken: 'discord-token', isAuthenticated: true })
    const mockSelect = vi.fn().mockResolvedValue({
      data: [{ guild_id: 'guild-1' }],
      error: null,
    })
    mockSupabaseClient.from.mockReturnValue({ select: mockSelect })

    const store = useGuildStore()
    await store.fetchRegisteredGuilds()

    // Before guilds are loaded
    expect(store.visibleGuilds).toEqual([])

    // After guilds load
    store.$patch({ guilds: mockGuilds })
    expect(store.visibleGuilds).toHaveLength(3) // guild-1, guild-2 (admin), guild-4 (mod)
  })
})
