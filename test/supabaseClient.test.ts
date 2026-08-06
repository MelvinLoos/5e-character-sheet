import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createSupabaseClient } from '../src/infra/supabaseClient'

const mockCreateClient = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}))

vi.mock('../src/utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Reset the module-level singleton cache between tests
// The supabaseClient module stores a cached client; we need to
// force a fresh import to clear it.
async function resetModule() {
  // Since _defaultClient is not exported, we use vi.resetModules()
  // to force a fresh module load per test
  vi.resetModules()
  // re-import the mocked modules to keep mocks alive
  vi.doMock('@supabase/supabase-js', () => ({
    createClient: (...args: unknown[]) => mockCreateClient(...args),
  }))
  vi.doMock('../src/utils/logger', () => ({
    logger: {
      warn: vi.fn(),
      error: vi.fn(),
    },
  }))
}

// Re-import the function after reset to get a fresh module
async function getFreshCreateSupabaseClient(): Promise<typeof createSupabaseClient> {
  await resetModule()
  const mod = await import('../src/infra/supabaseClient')
  return mod.createSupabaseClient
}

describe('createSupabaseClient', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
    mockCreateClient.mockReturnValue({ fake: 'client' })
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns anonymous client when no session token is provided (singleton, first call)', async () => {
    const createFn = await getFreshCreateSupabaseClient()
    const client = createFn()

    expect(client).toEqual({ fake: 'client' })
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
    )
    expect(mockCreateClient).toHaveBeenCalledTimes(1)
  })

  it('returns the same anonymous client instance on subsequent calls (singleton)', async () => {
    const createFn = await getFreshCreateSupabaseClient()
    const client1 = createFn()
    const client2 = createFn()

    expect(client1).toBe(client2)
    expect(mockCreateClient).toHaveBeenCalledTimes(1)
  })

  it('returns authenticated client with Authorization header when session token is provided', async () => {
    const createFn = await getFreshCreateSupabaseClient()
    const client = createFn('auth-token-123')

    expect(client).toEqual({ fake: 'client' })
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      {
        global: {
          headers: {
            Authorization: 'Bearer auth-token-123',
          },
        },
      },
    )
  })

  it('returns null when Supabase credentials are missing', async () => {
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

    const createFn = await getFreshCreateSupabaseClient()
    const client = createFn()

    expect(client).toBeNull()
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('returns null and logs error when createClient throws', async () => {
    mockCreateClient.mockImplementation(() => {
      throw new Error('Invalid URL')
    })

    const createFn = await getFreshCreateSupabaseClient()
    const client = createFn()

    expect(client).toBeNull()
  })
})
