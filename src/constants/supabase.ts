/**
 * Supabase client configuration constants.
 *
 * These values are read from Vite environment variables at runtime.
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
export const SUPABASE_REDIRECT_URL = import.meta.env.VITE_SUPABASE_REDIRECT_URL ?? window.location.origin

export function hasSupabaseCredentials(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}
