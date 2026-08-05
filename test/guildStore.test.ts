import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref, nextTick } from 'vue'
import 'fake-indexeddb/auto'
import { useGuildStore } from '../src/stores/guildStore'
import { useAuthStore } from '../src/stores/authStore'
import type { DiscordGuild } from '../src/types/discord'

const mockGuilds: DiscordGuild[] = [
  { id: 'guild-1', name: 'Heroes Guild', icon: 'icon-1', owner: false, permissions: '0', features: [] },
  { id: 'guild-2', name: 'Mages Tower', icon: null, owner: true, permissions: '0', features: ['COMMUNITY'] },
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
})
