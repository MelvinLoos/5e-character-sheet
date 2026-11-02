import { PREPARED_SPELL_PROGRESSION } from '@/data/progressions'
import type { CharacterSpell } from '@/types/character'

/**
 * Prepared-Spell Selection Service — the single source of truth for how many
 * leveled spells a character is allowed to prepare/select.
 *
 * A character's limit comes from the 2024 SRD "Prepared Spells" column for
 * their class (see {@link PREPARED_SPELL_PROGRESSION}). Cantrips are at-will and
 * are therefore never counted against this limit, matching the SRD's
 * "Prepared Spells of Level 1+" wording.
 *
 * This service is intentionally pure (no store access) so it can be reused by
 * the progression store, the spellcasting composable, and the completion badges.
 */

/**
 * Resolve the maximum number of level 1+ spells a class may prepare at the
 * given effective level.
 *
 * @param className - The character's class name (e.g. 'Wizard').
 * @param effectiveLevel - The effective caster level (see `getEffectiveLevel`).
 * @returns The limit, or `null` when the class is not a spellcaster (or the
 *          level is outside the supported 1–20 range).
 */
export function computePreparedSpellLimit(
  className: string | null | undefined,
  effectiveLevel: number,
): number | null {
  if (!className) return null
  const table = PREPARED_SPELL_PROGRESSION[className]
  if (!table) return null
  return table[effectiveLevel] ?? null
}

/**
 * Count the leveled spells (level ≥ 1) on a character's spell list.
 * Cantrips (level 0) are excluded because they do not consume prepared slots.
 */
export function countSelectedSpells(spells: CharacterSpell[] | undefined | null): number {
  if (!Array.isArray(spells)) return 0
  return spells.filter((spell) => (spell?.level ?? 0) >= 1).length
}

/**
 * Number of level 1+ spell selections a character still owes.
 *
 * Returns `0` when the class has no prepared-spell limit (non-casters) or when
 * the limit has been reached or exceeded.
 */
export function remainingSpellSelections(
  className: string | null | undefined,
  effectiveLevel: number,
  spells: CharacterSpell[] | undefined | null,
): number {
  const limit = computePreparedSpellLimit(className, effectiveLevel)
  if (limit === null) return 0
  return Math.max(0, limit - countSelectedSpells(spells))
}
