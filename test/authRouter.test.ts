import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../src/stores/authStore'
import type { RouteLocationNormalized } from 'vue-router'

const mockHandleAuthCallback = vi.fn()
const mockInitialize = vi.fn()

vi.mock('../src/infra/supabaseClient', () => ({
  createSupabaseClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      setSession: vi.fn(),
    },
  })),
}))

describe('auth router integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    const authStore = useAuthStore()
    authStore.handleAuthCallback = mockHandleAuthCallback
    authStore.initialize = mockInitialize
  })

  function createTestRouter() {
    return createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
        { path: '/identity', name: 'identity', component: { template: '<div>Identity</div>' } },
        {
          path: '/auth/callback',
          name: 'authCallback',
          component: { template: '<div>Callback</div>' },
          beforeEnter: async (to: RouteLocationNormalized) => {
            const authStore = useAuthStore()
            const accessToken = to.hash.match(/access_token=([^&]+)/)?.[1]
            const refreshToken = to.hash.match(/refresh_token=([^&]+)/)?.[1]

            if (accessToken && refreshToken) {
              await authStore.handleAuthCallback(accessToken, refreshToken)
              return { name: 'identity' }
            }

            return { name: 'home', query: { error: 'auth_callback_failed' } }
          },
        },
      ],
    })
  }

  it('calls handleAuthCallback when navigating to /auth/callback with tokens', async () => {
    const router = createTestRouter()
    await router.push('/auth/callback#access_token=abc&refresh_token=xyz')
    await router.isReady()

    expect(mockHandleAuthCallback).toHaveBeenCalledWith('abc', 'xyz')
  })

  it('redirects to /identity after successful auth callback', async () => {
    mockHandleAuthCallback.mockResolvedValue(undefined)

    const router = createTestRouter()
    await router.push('/auth/callback#access_token=abc&refresh_token=xyz')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('identity')
  })

  it('redirects to / with error query when tokens are missing', async () => {
    const router = createTestRouter()
    await router.push('/auth/callback')
    await router.isReady()

    expect(router.currentRoute.value.path).toBe('/')
    expect(router.currentRoute.value.query.error).toBe('auth_callback_failed')
    expect(mockHandleAuthCallback).not.toHaveBeenCalled()
  })

  it('initializes auth store on first navigation', async () => {
    const router = createTestRouter()

    let initialized = false
    mockInitialize.mockImplementation(async () => {
      initialized = true
    })

    router.beforeEach(async () => {
      if (!initialized) {
        const authStore = useAuthStore()
        await authStore.initialize()
      }
    })

    await router.push('/identity')
    await router.isReady()

    expect(mockInitialize).toHaveBeenCalled()
  })
})
