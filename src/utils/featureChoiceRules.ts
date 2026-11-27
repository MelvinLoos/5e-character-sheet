import * as DND_RULES from '@/data/rules'
import { getCharacterLevel, getCharacterTier, meetsProgressionGate } from '@/domain'
import type { ProgressionState } from '@/domain'
import type { FeatureChoice } from '@/types/rules'

/**
 * Feature-choice rule helpers shared between the Feats page, the character
 * store, and the navigation completion badges.
 *
 * Keeping these in one place means the page, the store, and the badge logic
 * can never disagree about which choices are eligible or how many selections
 * are allowed.
 */

/**
 * Returns the feature choices the character is eligible to make, given their
 * class and progression (Renown Tier or level). A choice is eligible when its
 * `minTier` / `minLevel` (if any) is satisfied.
 */
export function eligibleFeatureChoices(
  charClass: string | null | undefined,
  progress: ProgressionState | null | undefined,
): FeatureChoice[] {
  if (!charClass) return []
  return (DND_RULES.CLASSES[charClass]?.featureChoices || []).filter((fc) =>
    meetsProgressionGate(fc, progress),
  )
}

/**
 * Resolves the maximum number of options for a feature choice at the current
 * tier. Handles fixed counts, tier scaling (`scalesPerTier`, never below tier 1), and level-keyed
 * records (`count: Record<number, number>`).
 */
export function effectiveMaxCountForChoice(
  fc: FeatureChoice,
  progress: ProgressionState | null | undefined,
): number {
  const tier = getCharacterTier(progress)

  if (typeof fc.count === 'number') {
    return fc.scalesPerTier ? fc.count + Math.max(0, tier - 1) : fc.count
  }

  const level = getCharacterLevel(progress)
  const levels = Object.keys(fc.count).map(Number).sort((a, b) => a - b)
  let max = levels[0] !== undefined ? (fc.count[levels[0]] ?? 0) : 0
  for (const lvl of levels) {
    if (lvl <= level) max = fc.count[lvl] ?? max
  }
  return max
}