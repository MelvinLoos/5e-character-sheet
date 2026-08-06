/**
 * Supabase CRUD wrappers for guild-scoped homebrew content.
 *
 * Each function:
 * - Uses authStore.userId for `created_by` on inserts.
 * - Returns the created/updated row for optimistic UI updates.
 * - Throws on error so the UI can display error messages.
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
// Bulk Create — Guild Spells
// =============================================================================

/**
 * Insert multiple homebrew spells for a guild in chunked batches.
 *
 * Arrays larger than BULK_INSERT_CHUNK_SIZE (50) are automatically split
 * into multiple sequential Supabase insert calls to prevent PostgREST
 * payload limits from being exceeded.
 *
 * @returns The array of created rows (across all chunks).
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

  const rows = input.spells.map((spell) => ({
    guild_id: input.guild_id,
    data: spell,
    created_by: userId,
  }))

  const chunks = chunkArray(rows, BULK_INSERT_CHUNK_SIZE)
  const allResults: GuildSpell[] = []

  for (const chunk of chunks) {
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
// Bulk Create — Guild Feats
// =============================================================================

/**
 * Insert multiple homebrew feats for a guild in chunked batches.
 *
 * Arrays larger than BULK_INSERT_CHUNK_SIZE (50) are automatically split
 * into multiple sequential Supabase insert calls to prevent PostgREST
 * payload limits from being exceeded.
 *
 * @returns The array of created rows (across all chunks).
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

  const rows = input.feats.map((feat) => ({
    guild_id: input.guild_id,
    data: feat,
    created_by: userId,
  }))

  const chunks = chunkArray(rows, BULK_INSERT_CHUNK_SIZE)
  const allResults: GuildFeat[] = []

  for (const chunk of chunks) {
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

// =============================================================================
// Guild Spells CRUD (single-item)
// =============================================================================

/**
 * Insert a new homebrew spell for a guild.
 */
export async function createGuildSpell(input: {
  guild_id: string
  data: Record<string, unknown>
}): Promise<GuildSpell> {
  const { client, userId } = assertClientAndUser()

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
// Guild Feats CRUD
// =============================================================================

/**
 * Insert a new homebrew feat for a guild.
 */
export async function createGuildFeat(input: {
  guild_id: string
  data: Record<string, unknown>
}): Promise<GuildFeat> {
  const { client, userId } = assertClientAndUser()

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