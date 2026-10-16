/**
 * characterRepository — Pure persistence adapter for character data.
 *
 * Handles all localStorage and Supabase operations. No Pinia, no Vue reactivity.
 * All functions are pure or have well-defined side-effects (storage, HTTP).
 *
 * This module consolidates persistence logic that was previously scattered
 * across the character store, providing a single seam for load/save/share.
 */
import { STORAGE_KEYS } from '@/constants/storage-keys'
import { logger } from '@/utils/logger'
import {
  getLibrary as getLocalLibrary,
  saveLibrary as saveLocalLibrary,
} from './characterService'
import type { CharacterData } from '@/types/character'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  fetchCharacterFromUrl as fetchFromSupabase,
  shareCharacterToSupabase as shareToSupabase,
} from '@/infra/sharingService'

// ---------------------------------------------------------------------------
// Library Persistence (wraps domain/characterService localStorage)
// ---------------------------------------------------------------------------

export function loadLibrary(): Record<string, CharacterData[]> {
  return getLocalLibrary()
}

export function saveLibrary(library: Record<string, CharacterData[]>): void {
  saveLocalLibrary(library)
}

// ---------------------------------------------------------------------------
// Draft Persistence (localStorage)
// ---------------------------------------------------------------------------

/** Save the current working character to a draft slot so edits aren't lost. */
export function saveDraft(data: CharacterData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_DRAFT, JSON.stringify(data))
  } catch (e) {
    logger.warn('Failed to save character draft to localStorage:', e)
  }
}

/** Restore a character draft, or null if none exists. */
export function restoreDraft(): CharacterData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_DRAFT)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data && typeof data === 'object') {
      return data as CharacterData
    }
  } catch (e) {
    logger.warn('Failed to restore character draft from localStorage:', e)
  }
  return null
}

/** Remove the current draft from localStorage. */
export function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_DRAFT)
  } catch (e) {
    logger.warn('Failed to clear character draft from localStorage:', e)
  }
}

// ---------------------------------------------------------------------------
// Current Character Tracking (localStorage)
// ---------------------------------------------------------------------------

/**
 * Parse the CURRENT_CHARACTER_ID key into session and character name.
 * Returns null when no tracking entry exists or the format is invalid.
 */
export function getCurrentCharacterId(): { session: string; name: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_CHARACTER_ID)
    if (!raw) return null
    const [session, charName] = raw.split('|')
    if (!session || !charName) return null
    return { session, name: charName }
  } catch {
    return null
  }
}

export function setCurrentCharacterId(session: string, name: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CHARACTER_ID, `${session}|${name}`)
  } catch (e) {
    logger.warn('Failed to set current character ID:', e)
  }
}

export function clearCurrentCharacterId(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_CHARACTER_ID)
  } catch (e) {
    logger.warn('Failed to clear current character ID:', e)
  }
}

/**
 * Restore the last loaded/saved character from the library.
 * Returns the character data and session name, or null if no tracking exists.
 */
export function restoreLastCharacter(): {
  data: CharacterData
  session: string
} | null {
  try {
    const id = getCurrentCharacterId()
    if (!id) return null

    const library = loadLibrary()
    const data = library[id.session]?.find((c: CharacterData) => c.name === id.name)
    if (data) {
      return { data, session: id.session }
    }
  } catch (e) {
    logger.warn('Failed to restore last character:', e)
  }
  return null
}

// ---------------------------------------------------------------------------
// Share Link Persistence (localStorage)
// ---------------------------------------------------------------------------

/**
 * Read the map of character name → public share id.
 * Returns an empty object when nothing is stored or the payload is corrupt.
 */
function loadShareLinks(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHARE_LINKS)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>
    }
  } catch (e) {
    logger.warn('Failed to read share links from localStorage:', e)
  }
  return {}
}

/**
 * Remember the public share id for a character so its printed QR code survives
 * a reload or a round-trip through the local library.
 */
export function saveShareLink(characterName: string, shareId: string): void {
  if (!characterName || !shareId) return
  try {
    const links = loadShareLinks()
    links[characterName] = shareId
    localStorage.setItem(STORAGE_KEYS.SHARE_LINKS, JSON.stringify(links))
  } catch (e) {
    logger.warn('Failed to save share link to localStorage:', e)
  }
}

/** Look up the previously persisted share id for a character, or null. */
export function getShareLink(characterName: string): string | null {
  if (!characterName) return null
  const links = loadShareLinks()
  return links[characterName] ?? null
}

// ---------------------------------------------------------------------------
// Supabase Operations (delegates to infra/sharingService)
// ---------------------------------------------------------------------------

export async function fetchCharacterFromUrl(
  client: SupabaseClient | null,
  urlParams: URLSearchParams,
): Promise<{ data: CharacterData; id: string } | null> {
  return fetchFromSupabase(client, urlParams)
}

export async function shareCharacterToSupabase(
  client: SupabaseClient | null,
  characterData: CharacterData,
  sourceCharacterId: string | null,
): Promise<string> {
  return shareToSupabase(client, characterData, sourceCharacterId)
}