import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger'
import type { CharacterData } from './characterService'

let supabaseClient: SupabaseClient | null = null

export function initSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    } catch (e) {
      logger.error('Error initializing Supabase client:', (e as Error).message)
    }
  } else {
    logger.warn('Supabase credentials not found. Online sharing will be disabled.')
  }
  
  return supabaseClient
}

export function getSupabaseClient(): SupabaseClient | null {
  return supabaseClient
}

export async function fetchCharacterFromUrl(client: SupabaseClient | null, urlParams: URLSearchParams): Promise<{ data: CharacterData, id: string } | null> {
  const characterId = urlParams.get('id')
  
  if (!characterId) return null
  if (!client) throw new Error('Supabase client not initialized')
  
  const { data, error } = await client
    .from('characters')
    .select('character_data, id')
    .eq('id', characterId)
    .single()
    
  if (error) throw error
  if (!data) throw new Error('Character not found.')
  
  return { data: data.character_data as CharacterData, id: data.id }
}

export async function shareCharacterToSupabase(client: SupabaseClient | null, characterData: CharacterData, sourceCharacterId: string | null): Promise<string> {
  if (!client) throw new Error('Supabase client not initialized')
  
  const { data, error } = await client
    .from('characters')
    .insert([
      {
        name: characterData.name,
        character_data: characterData,
        source_character_id: sourceCharacterId,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data.id
}
