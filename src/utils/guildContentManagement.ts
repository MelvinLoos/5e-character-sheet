/**
 * Supabase CRUD wrappers for guild-scoped homebrew content.
 *
 * Each function:
 * - Uses authStore.userId for `created_by` on inserts.
 * - Returns the created/updated row for optimistic UI updates.
 * - Throws on error so the UI can display error messages.
 * - Uses app-level upsert (check-then-insert-or-update) to prevent
 *   duplicate-named items per guild.
 */

import { getSupabaseClient } from '../infra/sharingService'
import { useAuthStore } from '../stores/authStore'
import type { GuildSpell, GuildFeat } from '../types/supabase'

/**
 * Maximum number of items to send in a single Supabase insert call.
 * Prevents hitting PostgREST payload size limits.
 */
const BULK_INSERT_CHUNK_SIZE = 50

/**
 * Shared helper to obtain the Supabase client and current user ID.
 * Throws if the client is unavailable or the user is not authenticated.
 */
function assertClientAndUser(): { client: NonNullable<ReturnType<typeof getSupabaseClient>>; userId: string } {
  const client = getSupabaseClient()
  const authStore = useAuthStore()

  if (!client) {
    throw new Error('Supabase client is not available')
  }

  if (!authStore.userId) {
    throw new Error('User is not authenticated')
  }

  return { client, userId: authStore.userId }
}

/**
 * Split an array into chunks of at most `size` elements.
 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

// =============================================================================
// Internal helpers — lookup existing by guild_id + name/title
// =============================================================================

/**
 * Look up an existing guild spell by guild_id and spell name (JSONB data->>'name').
 * Returns the row or null if not found.
 */
async function findExistingSpell(
  client: NonNullable<ReturnType<typeof getSupabaseClient>>,
  guildId: string,
  name: string,
): Promise<GuildSpell | null> {
  const { data, error } = await client
    .from('guild_spells')
    .select('*')
    .eq('guild_id', guildId)
    .eq('data->>name', name)
    .maybeSingle()

  if (error) throw error
  return (data as GuildSpell) ?? null
}

/**
 * Look up an existing guild feat by guild_id and feat title (JSONB data->>'title').
 * Returns the row or null if not found.
 */
async function findExistingFeat(
  client: NonNullable<ReturnType<typeof getSupabaseClient>>,
  guildId: string,
  title: string,
): Promise<GuildFeat | null> {
  const { data, error } = await client
    .from('guild_feats')
    .select('*')
    .eq('guild_id', guildId)
    .eq('data->>title', title)
    .maybeSingle()

  if (error) throw error
  return (data as GuildFeat) ?? null
}

// =============================================================================
// Guild Spells CRUD (single-item) — with upsert
// =============================================================================

/**
 * Insert or update a homebrew spell for a guild.
 *
 * Upsert strategy: matches on guild_id + data->>'name'.
 * - If a spell with the same name already exists for this guild, the existing
 *   row's `data` payload is updated (preserving id, created_by, created_at).
 * - Otherwise a new row is inserted.
 */
export async function createGuildSpell(input: {
  guild_id: string
  data: Record<string, unknown>
}): Promise<GuildSpell> {
  const { client, userId } = assertClientAndUser()

  const spellName = typeof input.data.name === 'string' ? input.data.name.trim() : ''
  if (!spellName) {
    throw new Error('Spell name is required')
  }

  // Check if a spell with this name already exists for the guild
  const existing = await findExistingSpell(client, input.guild_id, spellName)

  if (existing) {
    // Update the existing row — preserve created_by and created_at
    const { data: updated, error: updateError } = await client
      .from('guild_spells')
      .update({
        data: input.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (updateError) throw updateError
    return updated as GuildSpell
  }

  // No existing spell — insert a new row
  const { data, error } = await client
    .from('guild_spells')
    .insert({
      guild_id: input.guild_id,
      data: input.data,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data as GuildSpell
}

/**
 * Update an existing homebrew spell's data payload.
 */
export async function updateGuildSpell(
  id: string,
  data: Record<string, unknown>,
): Promise<GuildSpell> {
  const { client } = assertClientAndUser()

  const { data: updated, error } = await client
    .from('guild_spells')
    .update({
      data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return updated as GuildSpell
}

/**
 * Delete a homebrew spell by its UUID.
 */
export async function deleteGuildSpell(id: string): Promise<void> {
  const { client } = assertClientAndUser()

  const { error } = await client
    .from('guild_spells')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =============================================================================
// Guild Feats CRUD (single-item) — with upsert
// =============================================================================

/**
 * Insert or update a homebrew feat for a guild.
 *
 * Upsert strategy: matches on guild_id + data->>'title'.
 * - If a feat with the same title already exists for this guild, the existing
 *   row's `data` payload is updated (preserving id, created_by, created_at).
 * - Otherwise a new row is inserted.
 */
export async function createGuildFeat(input: {
  guild_id: string
  data: Record<string, unknown>
}): Promise<GuildFeat> {
  const { client, userId } = assertClientAndUser()

  const featTitle = typeof input.data.title === 'string' ? input.data.title.trim() : ''
  if (!featTitle) {
    throw new Error('Feat title is required')
  }

  // Check if a feat with this title already exists for the guild
  const existing = await findExistingFeat(client, input.guild_id, featTitle)

  if (existing) {
    // Update the existing row — preserve created_by and created_at
    const { data: updated, error: updateError } = await client
      .from('guild_feats')
      .update({
        data: input.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (updateError) throw updateError
    return updated as GuildFeat
  }

  // No existing feat — insert a new row
  const { data, error } = await client
    .from('guild_feats')
    .insert({
      guild_id: input.guild_id,
      data: input.data,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data as GuildFeat
}

/**
 * Update an existing homebrew feat's data payload.
 */
export async function updateGuildFeat(
  id: string,
  data: Record<string, unknown>,
): Promise<GuildFeat> {
  const { client } = assertClientAndUser()

  const { data: updated, error } = await client
    .from('guild_feats')
    .update({
      data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return updated as GuildFeat
}

/**
 * Delete a homebrew feat by its UUID.
 */
export async function deleteGuildFeat(id: string): Promise<void> {
  const { client } = assertClientAndUser()

  const { error } = await client
    .from('guild_feats')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// =============================================================================
// Bulk Create — Guild Spells (with per-item upsert)
// =============================================================================

/**
 * Insert or update multiple homebrew spells for a guild.
 *
 * Each spell is individually checked for an existing entry matching
 * guild_id + data->>'name'. Existing spells are updated; new spells are
 * batch-inserted in chunks of BULK_INSERT_CHUNK_SIZE.
 *
 * @returns The array of created/updated rows.
 * @throws If any chunk insert fails.
 */
export async function bulkCreateGuildSpells(input: {
  guild_id: string
  spells: Record<string, unknown>[]
}): Promise<GuildSpell[]> {
  const { client, userId } = assertClientAndUser()

  if (input.spells.length === 0) {
    return []
  }

  const rowsToInsert: { guild_id: string; data: Record<string, unknown>; created_by: string }[] = []
  const allResults: GuildSpell[] = []

  // Check each spell for existing duplicates
  for (const spell of input.spells) {
    const name = typeof spell.name === 'string' ? spell.name.trim() : ''
    if (!name) continue // skip unnamed items

    const existing = await findExistingSpell(client, input.guild_id, name)

    if (existing) {
      // Update existing
      const { data: updated, error: updateError } = await client
        .from('guild_spells')
        .update({
          data: spell,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) throw updateError
      allResults.push(updated as GuildSpell)
    } else {
      rowsToInsert.push({
        guild_id: input.guild_id,
        data: spell,
        created_by: userId,
      })
    }
  }

  // Batch insert new spells in chunks
  const chunks = chunkArray(rowsToInsert, BULK_INSERT_CHUNK_SIZE)

  for (const chunk of chunks) {
    if (chunk.length === 0) continue

    const { data, error } = await client
      .from('guild_spells')
      .insert(chunk)
      .select()

    if (error) throw error

    if (data) {
      allResults.push(...(data as GuildSpell[]))
    }
  }

  return allResults
}

// =============================================================================
// Bulk Create — Guild Feats (with per-item upsert)
// =============================================================================

/**
 * Insert or update multiple homebrew feats for a guild.
 *
 * Each feat is individually checked for an existing entry matching
 * guild_id + data->>'title'. Existing feats are updated; new feats are
 * batch-inserted in chunks of BULK_INSERT_CHUNK_SIZE.
 *
 * @returns The array of created/updated rows.
 * @throws If any chunk insert fails.
 */
export async function bulkCreateGuildFeats(input: {
  guild_id: string
  feats: Record<string, unknown>[]
}): Promise<GuildFeat[]> {
  const { client, userId } = assertClientAndUser()

  if (input.feats.length === 0) {
    return []
  }

  const rowsToInsert: { guild_id: string; data: Record<string, unknown>; created_by: string }[] = []
  const allResults: GuildFeat[] = []

  // Check each feat for existing duplicates
  for (const feat of input.feats) {
    const title = typeof feat.title === 'string' ? feat.title.trim() : ''
    if (!title) continue // skip unnamed items

    const existing = await findExistingFeat(client, input.guild_id, title)

    if (existing) {
      // Update existing
      const { data: updated, error: updateError } = await client
        .from('guild_feats')
        .update({
          data: feat,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) throw updateError
      allResults.push(updated as GuildFeat)
    } else {
      rowsToInsert.push({
        guild_id: input.guild_id,
        data: feat,
        created_by: userId,
      })
    }
  }

  // Batch insert new feats in chunks
  const chunks = chunkArray(rowsToInsert, BULK_INSERT_CHUNK_SIZE)

  for (const chunk of chunks) {
    if (chunk.length === 0) continue

    const { data, error } = await client
      .from('guild_feats')
      .insert(chunk)
      .select()

    if (error) throw error

    if (data) {
      allResults.push(...(data as GuildFeat[]))
    }
  }

  return allResults
}