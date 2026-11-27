/**
 * Resolve the Supabase project URL from the environment. Shared by the Vite
 * build and the MCP Netlify function. SUPABASE_DATABASE_URL is injected by the
 * Netlify Supabase integration and is ignored unless it is an http(s) URL.
 */
export function resolveSupabaseUrl(env: Record<string, string | undefined>): string {
  const dbUrl = env.SUPABASE_DATABASE_URL?.startsWith('http') ? env.SUPABASE_DATABASE_URL : ''
  return env.SUPABASE_URL || dbUrl || env.VITE_SUPABASE_URL || ''
}
