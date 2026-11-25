/**
 * Account-scoped reads for signed-in agents. The MCP client authenticates via
 * Supabase Auth's OAuth 2.1 server; we verify the bearer token with Supabase
 * and run every query with that same token, so row level security applies as
 * the player's own account.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import {
  isValidGuildFeat,
  isValidGuildSpell,
  normalizeGuildFeat,
  normalizeGuildSpell,
} from '@/utils/guildContentValidator'

export const ACCOUNT_TOOLS = ['list_guilds', 'search_guild_spells', 'search_guild_feats'] as const

export interface SearchOpts {
  guildId?: string
  query?: string
  level?: number
  /** Spells only: keep spells whose class list includes this class. */
  className?: string
  limit?: number
}

export interface AccountApi {
  listGuilds(): Promise<Array<{ id: string; name: string }>>
  searchSpells(opts: SearchOpts): Promise<Array<Record<string, unknown>>>
  searchFeats(opts: SearchOpts): Promise<Array<Record<string, unknown>>>
}

export interface AccountVerifier {
  /** Resolves to the account API for a valid Supabase access token, otherwise null. */
  verify(token: string): Promise<AccountApi | null>
}

const MAX_ROWS = 2000
const clampLimit = (n?: number) => Math.min(Math.max(Math.trunc(n ?? 15), 1), 25)
const clip = (s: unknown, n = 500) =>
  typeof s === 'string' && s.length > n ? `${s.slice(0, n - 1)}…` : s
const matches = (q: string | undefined, ...fields: unknown[]) =>
  !q || fields.some((f) => typeof f === 'string' && f.toLowerCase().includes(q.toLowerCase()))

async function rows(
  client: SupabaseClient,
  table: 'guild_spells' | 'guild_feats',
  guildId?: string,
) {
  let q = client.from(table).select('id,guild_id,data').limit(MAX_ROWS)
  if (guildId) q = q.eq('guild_id', guildId)
  const { data, error } = await q
  if (error) throw new Error(`Could not read ${table}: ${error.message}`)
  return (data ?? []) as Array<{ id: string; guild_id: string; data: Record<string, unknown> }>
}

export function accountApi(client: SupabaseClient): AccountApi {
  return {
    async listGuilds() {
      const { data, error } = await client.from('registered_guilds').select('guild_id,guild_name')
      if (error) throw new Error(`Could not read guilds: ${error.message}`)
      return (data ?? []).map((g) => ({ id: g.guild_id as string, name: g.guild_name as string }))
    },
    async searchSpells({ guildId, query, level, className, limit }) {
      const out: Array<Record<string, unknown>> = []
      for (const row of await rows(client, 'guild_spells', guildId)) {
        if (!isValidGuildSpell(row.data)) continue
        const s = normalizeGuildSpell(row.data)
        if (level !== undefined && s.level !== level) continue
        if (className && !s.classes?.some((c) => c.toLowerCase() === className.toLowerCase()))
          continue
        if (!matches(query, s.name, s.desc)) continue
        out.push({
          guildId: row.guild_id,
          name: s.name,
          level: s.level,
          school: s.school,
          classes: s.classes,
          castingTime: s.castingTime,
          range: s.range,
          duration: s.duration,
          concentration: s.concentration,
          desc: clip(s.desc),
        })
      }
      return out
        .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        .slice(0, clampLimit(limit))
    },
    async searchFeats({ guildId, query, limit }) {
      const out: Array<Record<string, unknown>> = []
      for (const row of await rows(client, 'guild_feats', guildId)) {
        if (!isValidGuildFeat(row.data)) continue
        const f = normalizeGuildFeat(row.data)
        if (!matches(query, f.title, f.desc)) continue
        out.push({ guildId: row.guild_id, title: f.title, desc: clip(f.desc) })
      }
      return out
        .sort((a, b) => String(a.title).localeCompare(String(b.title)))
        .slice(0, clampLimit(limit))
    },
  }
}

export function supabaseVerifier(url: string, anonKey: string): AccountVerifier {
  return {
    async verify(token) {
      const client = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      })
      const { data, error } = await client.auth.getUser(token)
      return error || !data.user ? null : accountApi(client)
    },
  }
}
