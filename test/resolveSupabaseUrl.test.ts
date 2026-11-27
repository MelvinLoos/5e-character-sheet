import { describe, it, expect } from 'vitest'
import { resolveSupabaseUrl } from '../resolve-supabase-url'

describe('resolveSupabaseUrl', () => {
  it('prefers SUPABASE_URL, then SUPABASE_DATABASE_URL, then VITE_SUPABASE_URL', () => {
    const all = {
      SUPABASE_URL: 'https://a.supabase.co',
      SUPABASE_DATABASE_URL: 'https://b.supabase.co',
      VITE_SUPABASE_URL: 'https://c.supabase.co',
    }
    expect(resolveSupabaseUrl(all)).toBe('https://a.supabase.co')
    expect(resolveSupabaseUrl({ ...all, SUPABASE_URL: '' })).toBe('https://b.supabase.co')
    expect(resolveSupabaseUrl({ VITE_SUPABASE_URL: 'https://c.supabase.co' })).toBe(
      'https://c.supabase.co',
    )
  })
  it('ignores a non-http SUPABASE_DATABASE_URL', () => {
    expect(
      resolveSupabaseUrl({
        SUPABASE_DATABASE_URL: 'postgresql://x',
        VITE_SUPABASE_URL: 'https://c.supabase.co',
      }),
    ).toBe('https://c.supabase.co')
    expect(resolveSupabaseUrl({})).toBe('')
  })
})
