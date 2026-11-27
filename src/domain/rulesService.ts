import { TIER_TO_LEVEL } from '@/data/progressions'
import { CLASS_SPELLCASTING_ABILITY } from '@/data/classSpellcasting'
import type { AbilityKey } from '@/types/enums'

/**
 * Translates a character's Renown Tier (1-3) into an effective caster level
 * suitable for querying SPELL_SLOT_PROGRESSION, PROFICIENCY_BONUS_PROGRESSION,
 * and other level-keyed rule tables.
 *
 * Returns 3 for any out-of-bounds or unknown tier value. Prefer
 * {@link getCharacterLevel}, which also handles level-mode characters.
 */
export function getEffectiveLevel(tier: number): number {
  return TIER_TO_LEVEL[tier] ?? 3
}

/** The slice of a character that decides how it progresses. */
export interface ProgressionState {
  renownTier?: number | null
  progressionMode?: 'renown' | 'level' | null
  level?: number | null
}

export const MAX_CHARACTER_LEVEL = 20

export function usesLevels(c: ProgressionState | null | undefined): boolean {
  return c?.progressionMode === 'level'
}

/** Character level (1-20): the set level in level mode, else the Renown Tier's equivalent. */
export function getCharacterLevel(c: ProgressionState | null | undefined): number {
  if (usesLevels(c)) {
    const level = Math.round(Number(c?.level) || 1)
    return Math.min(MAX_CHARACTER_LEVEL, Math.max(1, level))
  }
  return getEffectiveLevel(c?.renownTier || 1)
}

/**
 * Tier used for tier-keyed rules. Level mode derives it from the level
 * (3→1, 6→2, 10→3, 14→4); levels 1-2 are tier 0.
 */
export function getCharacterTier(c: ProgressionState | null | undefined): number {
  if (!usesLevels(c)) return c?.renownTier || 1
  const level = getCharacterLevel(c)
  let tier = 0
  for (const [t, lvl] of Object.entries(TIER_TO_LEVEL)) {
    if (level >= lvl) tier = Math.max(tier, Number(t))
  }
  return tier
}

/**
 * Whether a choice or trait is unlocked. Level mode checks `minLevel`, falling
 * back to the level equivalent of `minTier`; Renown mode checks `minTier` only.
 */
export function meetsProgressionGate(
  gate: { minTier?: number; minLevel?: number },
  c: ProgressionState | null | undefined,
): boolean {
  if (usesLevels(c)) {
    const required =
      gate.minLevel ?? (gate.minTier ? TIER_TO_LEVEL[gate.minTier] : undefined)
    return required === undefined || getCharacterLevel(c) >= required
  }
  return !gate.minTier || gate.minTier <= getCharacterTier(c)
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
