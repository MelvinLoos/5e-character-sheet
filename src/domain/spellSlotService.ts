import { SPELL_SLOT_PROGRESSION } from '@/data/rules'
import type { CharacterFeature } from '@/types/character'
import type { CasterType } from '@/types/enums'

/**
 * Spell Slot Service — the single source of truth for computing a character's
 * spell slots.
 *
 * A character can receive spell slots from two independent systems:
 *
 * 1. **Class-based spellcasting** — a feature carrying a `casterType`
 *    (`full`, `half`, `third`, or `pact`) that maps to a level-keyed
 *    progression table (D&D 5.5e / 2024 rules only).
 * 2. **Feat/trait-granted spells** — features with `grantsSpells: true` that
 *    contribute specific castings per level (e.g. Magic Initiate, Fey Touched).
 *
 * These two systems are combined **additively** per spell level so a Wizard
 * with Magic Initiate gets their class slots PLUS the free casts from the feat.
 */

/**
 * Resolve class-based spell slots for the given effective level.
 *
 * Finds the first feature whose `casterType` is a recognized non-'none'
 * progression type and returns the corresponding slot record from
 * `SPELL_SLOT_PROGRESSION`. Returns `{}` when the character has no class-based
 * spellcasting.
 *
 * @param features - The character's feature list.
 * @param effectiveLevel - The effective caster level (see `getEffectiveLevel`).
 */
export function computeClassSpellSlots(
  features: CharacterFeature[],
  effectiveLevel: number,
): Record<string, number> {
  const spellcastingFeature = features.find(
    (f): f is CharacterFeature & { casterType: CasterType } =>
      typeof f.casterType === 'string' &&
      f.casterType !== 'none' &&
      f.casterType in SPELL_SLOT_PROGRESSION,
  )

  if (!spellcastingFeature?.casterType) return {}

  const progression = SPELL_SLOT_PROGRESSION[spellcastingFeature.casterType]
  return { ...(progression?.[effectiveLevel] ?? {}) }
}

/**
 * Aggregate feat/trait-granted spell slots across all features.
 *
 * Every feature with `grantsSpells: true` contributes one slot for each entry
 * in its `grantedSpellLevels` array. Cantrips (level 0) are excluded because
 * they are at-will and do not consume slots.
 *
 * @param features - The character's feature list.
 */
export function computeGrantedSpellSlots(
  features: CharacterFeature[],
): Record<string, number> {
  const slots: Record<string, number> = {}

  for (const feature of features) {
    if (!feature.grantsSpells || !Array.isArray(feature.grantedSpellLevels)) continue

    for (const level of feature.grantedSpellLevels) {
      if (typeof level !== 'number' || level < 1 || level > 9) continue
      const key = `level${level}`
      slots[key] = (slots[key] ?? 0) + 1
    }
  }

  return slots
}

/**
 * Compute the character's total spell slots by additively merging class-based
 * and feat-granted spells for each level.
 *
 * @param features - The character's feature list.
 * @param effectiveLevel - The effective caster level.
 */
export function computeSpellSlots(
  features: CharacterFeature[],
  effectiveLevel: number,
): Record<string, number> {
  const classSlots = computeClassSpellSlots(features, effectiveLevel)
  const grantedSlots = computeGrantedSpellSlots(features)

  const merged: Record<string, number> = { ...classSlots }

  for (const [key, count] of Object.entries(grantedSlots)) {
    merged[key] = (merged[key] ?? 0) + count
  }

  return merged
}