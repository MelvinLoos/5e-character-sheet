/**
 * Owner-scoped guild reads for the MCP server. The server uses a service-role
 * client (which bypasses RLS), so every query is explicitly restricted to the
 * owner's guild ids and the server fails closed when that list is empty.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  isValidGuildFeat,
  isValidGuildSpell,
  normalizeGuildFeat,
  normalizeGuildSpell,
} from '@/utils/guildContentValidator'

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

const MAX_ROWS = 2000
const clampLimit = (n?: number) => Math.min(Math.max(Math.trunc(n ?? 15), 1), 25)
const clip = (s: unknown, n = 500) =>
  typeof s === 'string' && s.length > n ? `${s.slice(0, n - 1)}…` : s
const matches = (q: string | undefined, ...fields: unknown[]) =>
  !q || fields.some((f) => typeof f === 'string' && f.toLowerCase().includes(q.toLowerCase()))

/** Parse a comma-separated list of guild ids. */
export const parseGuildIds = (raw?: string): string[] =>
  (raw ?? '')
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean)

async function rows(
  client: SupabaseClient,
  table: 'guild_spells' | 'guild_feats',
  guildIds: string[],
  guildId?: string,
) {
  if (!guildIds.length || (guildId && !guildIds.includes(guildId))) return []
  let q = client.from(table).select('id,guild_id,data').in('guild_id', guildIds).limit(MAX_ROWS)
  if (guildId) q = q.eq('guild_id', guildId)
  const { data, error } = await q
  if (error) throw new Error(`Could not read ${table}: ${error.message}`)
  return (data ?? []) as Array<{ id: string; guild_id: string; data: Record<string, unknown> }>
}

export function accountApi(client: SupabaseClient, guildIds: string[]): AccountApi {
  return {
    async listGuilds() {
      if (!guildIds.length) return []
      const { data, error } = await client
        .from('registered_guilds')
        .select('guild_id,guild_name')
        .in('guild_id', guildIds)
      if (error) throw new Error(`Could not read guilds: ${error.message}`)
      return (data ?? []).map((g) => ({ id: g.guild_id as string, name: g.guild_name as string }))
    },
    async searchSpells({ guildId, query, level, className, limit }) {
      const out: Array<Record<string, unknown>> = []
      for (const row of await rows(client, 'guild_spells', guildIds, guildId)) {
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
      for (const row of await rows(client, 'guild_feats', guildIds, guildId)) {
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
