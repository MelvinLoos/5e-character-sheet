import type { CharacterSpell } from '@/types/character'

/** Generate a short unique ID for spells and other entities. */
export function generateSpellId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

/**
 * Format a spell level as a human-readable label.
 *
 * @example
 * formatLevel(0) // 'Cantrip'
 * formatLevel(2) // '2nd'
 */
export function formatLevel(level: number): string {
  if (level === 0) return 'Cantrip'
  if (level === 1) return '1st'
  if (level === 2) return '2nd'
  if (level === 3) return '3rd'
  return `${level}th`
}

/** Copy a library spell for the spellbook: fresh id, unprepared. */
export function createSpellFromLibrary(spell: CharacterSpell): CharacterSpell {
  return { ...spell, id: generateSpellId(), prepared: false }
}

/** Default spell for manual entry. */
export function createBlankSpell(): CharacterSpell {
  return {
    id: generateSpellId(),
    name: 'New Spell',
    level: 1,
    desc: 'Enter spell description...',
    prepared: false,
  }
}

/** Remove a spell by id in place (keeps reactivity). Returns whether it was found. */
export function removeSpellById(spells: CharacterSpell[], id: string): boolean {
  const idx = spells.findIndex((s) => s.id === id)
  if (idx === -1) return false
  spells.splice(idx, 1)
  return true
}
