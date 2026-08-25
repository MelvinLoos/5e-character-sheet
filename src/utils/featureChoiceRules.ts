import * as DND_RULES from '@/data/rules'
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
 * class and current Renown Tier. A choice is eligible when its `minTier` (if
 * any) is satisfied.
 */
export function eligibleFeatureChoices(
  charClass: string | null | undefined,
  renownTier: number | null | undefined,
): FeatureChoice[] {
  if (!charClass) return []
  const tier = renownTier || 1
  return (DND_RULES.CLASSES[charClass]?.featureChoices || []).filter(
    (fc) => !fc.minTier || fc.minTier <= tier,
  )
}

/**
 * Resolves the maximum number of options for a feature choice at the current
 * tier. Handles fixed counts, tier scaling (`scalesPerTier`), and level-keyed
 * records (`count: Record<number, number>`).
 */
export function effectiveMaxCountForChoice(
  fc: FeatureChoice,
  renownTier: number | null | undefined,
): number {
  const tier = renownTier || 1

  if (typeof fc.count === 'number') {
    return fc.scalesPerTier ? fc.count + (tier - 1) : fc.count
  }

  const level = DND_RULES.getEffectiveLevel(tier)
  const levels = Object.keys(fc.count).map(Number).sort((a, b) => a - b)
  let max = levels[0] !== undefined ? (fc.count[levels[0]] ?? 0) : 0
  for (const lvl of levels) {
    if (lvl <= level) max = fc.count[lvl] ?? max
  }
  return max
}