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

describe('createSupabaseClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
    mockCreateClient.mockReturnValue({ fake: 'client' })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns anonymous client when no session token is provided', () => {
    const client = createSupabaseClient()

    expect(client).toEqual({ fake: 'client' })
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      {},
    )
  })

  it('returns authenticated client with Authorization header when session token is provided', () => {
    const client = createSupabaseClient('auth-token-123')

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

  it('returns null when Supabase credentials are missing', () => {
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

    const client = createSupabaseClient()

    expect(client).toBeNull()
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('returns null and logs error when createClient throws', () => {
    mockCreateClient.mockImplementation(() => {
      throw new Error('Invalid URL')
    })

    const client = createSupabaseClient()

    expect(client).toBeNull()
  })
})
