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
 * Shared helper to obtain the Supabase client and current user ID.
 * Throws if the client is unavailable or the user is not authenticated.
 */
function assertClientAndUser(): { client: ReturnType<typeof getSupabaseClient>; userId: string } {
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

// =============================================================================
// Guild Spells CRUD
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