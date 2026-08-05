import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../src/stores/authStore'
import 'fake-indexeddb/auto'

const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
    setSession: vi.fn(),
  },
}

vi.mock('../src/infra/supabaseClient', () => ({
  createSupabaseClient: vi.fn(() => mockSupabaseClient),
}))

function createMockSession(overrides: Record<string, unknown> = {}) {
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    user: {
      id: 'discord-user-123',
      user_metadata: {
        full_name: 'Test User',
        avatar_url: 'https://cdn.discordapp.com/avatars/123/abc.png',
        custom_claims: {
          provider_id: '987654321',
        },
      },
    },
    ...overrides,
  }
}

describe('authStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
  })

  it('initializes with loggedOut state when no session exists', async () => {
    const store = useAuthStore()

    await store.initialize()

    expect(store.status).toBe('loggedOut')
    expect(store.userId).toBeNull()
    expect(store.discordUsername).toBeNull()
    expect(store.discordAvatarUrl).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })

  it('initializes with authenticated state when a valid session exists', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: createMockSession() },
      error: null,
    })

    const store = useAuthStore()
    await store.initialize()

    expect(store.status).toBe('authenticated')
    expect(store.userId).toBe('discord-user-123')
    expect(store.discordUsername).toBe('Test User')
    expect(store.discordAvatarUrl).toBe('https://cdn.discordapp.com/avatars/123/abc.png')
    expect(store.isAuthenticated).toBe(true)
  })

  it('transitions loggedOut -> loading -> authenticated on signInWithDiscord()', async () => {
    mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null })

    const store = useAuthStore()
    expect(store.status).toBe('loggedOut')

    const promise = store.signInWithDiscord()
    expect(store.status).toBe('loading')

    await promise
    expect(store.status).toBe('authenticated')
    expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'discord',
      options: {
        redirectTo: expect.any(String),
      },
    })
  })

  it('transitions authenticated -> loggedOut on signOut()', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: createMockSession() },
      error: null,
    })
    mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null })

    const store = useAuthStore()
    await store.initialize()
    expect(store.status).toBe('authenticated')

    await store.signOut()

    expect(store.status).toBe('loggedOut')
    expect(store.userId).toBeNull()
    expect(store.discordUsername).toBeNull()
  })

  it('handles signInWithDiscord failure gracefully and stays loggedOut', async () => {
    mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
      data: {},
      error: new Error('OAuth failed'),
    })

    const store = useAuthStore()
    await store.signInWithDiscord()

    expect(store.status).toBe('loggedOut')
  })

  it('updates state reactively on SIGNED_IN auth state change event', async () => {
    let authCallback: ((event: string, session: unknown) => void) | null = null
    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback: (event: string, session: unknown) => void) => {
      authCallback = callback
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    const store = useAuthStore()
    await store.initialize()
    expect(store.status).toBe('loggedOut')

    authCallback?.('SIGNED_IN', createMockSession())

    expect(store.status).toBe('authenticated')
    expect(store.userId).toBe('discord-user-123')
  })

  it('updates state reactively on SIGNED_OUT auth state change event', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: createMockSession() },
      error: null,
    })

    let authCallback: ((event: string, session: unknown) => void) | null = null
    mockSupabaseClient.auth.onAuthStateChange.mockImplementation((callback: (event: string, session: unknown) => void) => {
      authCallback = callback
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })

    const store = useAuthStore()
    await store.initialize()
    expect(store.status).toBe('authenticated')

    authCallback?.('SIGNED_OUT', null)

    expect(store.status).toBe('loggedOut')
    expect(store.userId).toBeNull()
  })

  it('extracts Discord user metadata from session', async () => {
    const session = createMockSession({
      user: {
        id: 'user-456',
        user_metadata: {
          full_name: 'Dungeon Master',
          avatar_url: 'https://cdn.discordapp.com/avatars/456/def.png',
        },
      },
    })
    mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session }, error: null })

    const store = useAuthStore()
    await store.initialize()

    expect(store.userId).toBe('user-456')
    expect(store.discordUsername).toBe('Dungeon Master')
    expect(store.discordAvatarUrl).toBe('https://cdn.discordapp.com/avatars/456/def.png')
  })

  it('handles missing user metadata gracefully', async () => {
    const session = createMockSession({
      user: {
        id: 'user-789',
        user_metadata: {},
      },
    })
    mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session }, error: null })

    const store = useAuthStore()
    await store.initialize()

    expect(store.status).toBe('authenticated')
    expect(store.userId).toBe('user-789')
    expect(store.discordUsername).toBeNull()
    expect(store.discordAvatarUrl).toBeNull()
  })

  it('handleAuthCallback sets session and authenticates user', async () => {
    mockSupabaseClient.auth.setSession.mockResolvedValue({
      data: { session: createMockSession() },
      error: null,
    })

    const store = useAuthStore()
    await store.handleAuthCallback('access-token-abc', 'refresh-token-xyz')

    expect(mockSupabaseClient.auth.setSession).toHaveBeenCalledWith({
      access_token: 'access-token-abc',
      refresh_token: 'refresh-token-xyz',
    })
    expect(store.status).toBe('authenticated')
    expect(store.userId).toBe('discord-user-123')
  })

  it('handleAuthCallback resets to loggedOut on error', async () => {
    mockSupabaseClient.auth.setSession.mockResolvedValue({
      data: { session: null },
      error: new Error('Invalid token'),
    })

    const store = useAuthStore()
    await store.handleAuthCallback('bad-token', 'bad-refresh')

    expect(store.status).toBe('loggedOut')
    expect(store.userId).toBeNull()
  })
})
