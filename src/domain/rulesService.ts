import { TIER_TO_LEVEL } from '@/data/progressions'
import { CLASS_SPELLCASTING_ABILITY } from '@/data/classSpellcasting'
import type { AbilityKey } from '@/types/enums'

/**
 * Translates a character's Renown Tier (1-3) into an effective caster level
 * suitable for querying SPELL_SLOT_PROGRESSION, PROFICIENCY_BONUS_PROGRESSION,
 * and other level-keyed rule tables.
 *
 * Returns 3 for any out-of-bounds or unknown tier value.
 */
export function getEffectiveLevel(tier: number): number {
  return TIER_TO_LEVEL[tier] ?? 3
}

/**
 * Resolve the spellcasting ability for a given class name.
 *
 * Returns the mapped {@link AbilityKey} for known spellcaster classes;
 * falls back to `'int'` when the class is not a known spellcaster,
 * or when `className` is `null` / `undefined`.
 */
export function getSpellcastingAbility(
  className: string | null | undefined,
): AbilityKey {
  return (className && CLASS_SPELLCASTING_ABILITY[className]) || 'int'
}
