/**
 * Supabase client configuration helpers.
 *
 * These values are read from Vite environment variables at runtime.
 * They are exposed as functions so tests can stub env vars between runs.
 */
export function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL ?? ''
}

export function getSupabaseAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
}

export function getSupabaseRedirectUrl(): string {
  return import.meta.env.VITE_SUPABASE_REDIRECT_URL ?? (typeof window !== 'undefined' ? window.location.origin : '')
}

export function hasSupabaseCredentials(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey())
}
