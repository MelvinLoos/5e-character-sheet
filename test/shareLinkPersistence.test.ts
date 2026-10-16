import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '@/stores/character'
import { createBlankCharacter } from '@/domain'
import { STORAGE_KEYS } from '@/constants/storage-keys'
import { saveShareLink, getShareLink } from '@/domain/characterRepository'
import type { CharacterData } from '@/types/character'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeChar(overrides: Partial<CharacterData> = {}): CharacterData {
  return {
    ...createBlankCharacter(),
    name: 'Test Character',
    ...overrides,
  } as CharacterData
}

function setLibraryEntry(
  session: string,
  name: string,
  data: CharacterData,
  store?: ReturnType<typeof useCharacterStore>,
): void {
  const key = STORAGE_KEYS.CHARACTER_LIBRARY
  const existing = JSON.parse(localStorage.getItem(key) || '{}')
  if (!existing[session]) existing[session] = []
  existing[session].push(data)
  localStorage.setItem(key, JSON.stringify(existing))

  if (store) {
    store.characterLibrary = { ...existing }
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Share link persistence', () => {
  let store: ReturnType<typeof useCharacterStore>

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    store = useCharacterStore()
    store.currentCharacterData = makeChar()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('saveShareLink() / getShareLink()', () => {
    it('round-trips a share id keyed by character name', () => {
      saveShareLink('Aragorn', 'archived-1')

      expect(getShareLink('Aragorn')).toBe('archived-1')
    })

    it('returns null for a character that was never shared', () => {
      expect(getShareLink('Unknown Hero')).toBeNull()
    })

    it('returns null for an empty character name', () => {
      expect(getShareLink('')).toBeNull()
    })

    it('ignores empty character names or share ids', () => {
      saveShareLink('', 'archived-1')
      saveShareLink('Boromir', '')

      expect(getShareLink('')).toBeNull()
      expect(getShareLink('Boromir')).toBeNull()
    })

    it('keeps separate links per character name', () => {
      saveShareLink('Aragorn', 'archived-1')
      saveShareLink('Legolas', 'archived-2')

      expect(getShareLink('Aragorn')).toBe('archived-1')
      expect(getShareLink('Legolas')).toBe('archived-2')
    })
  })

  describe('store.shareUrl', () => {
    it('is empty for a character that has never been shared', () => {
      expect(store.shareUrl).toBe('')
    })

    it('is populated when a previously shared character is reopened from the library', () => {
      saveShareLink('Aragorn', 'archived-1')
      setLibraryEntry('Heroes', 'Aragorn', makeChar({ name: 'Aragorn' }), store)

      store.loadCharacterFromLibrary('Heroes|Aragorn')

      expect(store.sourceCharacterId).toBe('archived-1')
      expect(store.shareUrl).toContain('?id=archived-1')
      expect(store.shareUrl.startsWith(window.location.origin)).toBe(true)
    })

    it('is cleared when switching to a brand new character', () => {
      saveShareLink('Aragorn', 'archived-1')
      setLibraryEntry('Heroes', 'Aragorn', makeChar({ name: 'Aragorn' }), store)
      store.loadCharacterFromLibrary('Heroes|Aragorn')
      expect(store.shareUrl).toContain('?id=archived-1')

      store.handleNewCharacter()

      expect(store.shareUrl).toBe('')
    })
  })
})
