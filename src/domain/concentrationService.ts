import type { CharacterSpell, Concentration } from '@/types/character'

/**
 * Concentration Service — pure 5e (2024) concentration rules.
 *
 * Mirrors `initiativeService` / `restService`: no store and no reactivity, so
 * every rule can be unit-tested in isolation. `spellStore` owns the live state.
 */

/**
 * CON save DC to keep concentrating after taking `damage` HP of damage:
 * `max(10, floor(damage / 2))`.
 */
export function concentrationSaveDC(damage: number): number {
  return Math.max(10, Math.floor(Math.max(0, damage) / 2))
}

/** Spellbook spells that require concentration (the eligible picker entries). */
export function concentrationCandidates(spells: CharacterSpell[] | undefined): CharacterSpell[] {
  return (spells ?? []).filter((spell) => spell.concentration === true)
}

/** Build the persisted concentration marker for a spell. */
export function concentrationFromSpell(spell: CharacterSpell): Concentration {
  return {
    spellId: spell.id,
    spellName: spell.name,
    level: spell.level,
    source: spell.source,
  }
}
