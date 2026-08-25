import { describe, it, expect } from 'vitest'
import {
  eligibleFeatureChoices,
  effectiveMaxCountForChoice,
} from '@/utils/featureChoiceRules'
import * as DND_RULES from '@/data/rules'
import type { FeatureChoice } from '@/types/rules'

describe('effectiveMaxCountForChoice', () => {
  it('returns the fixed count', () => {
    const fc: FeatureChoice = { id: 'x', label: 'X', count: 1 }
    expect(effectiveMaxCountForChoice(fc, 1)).toBe(1)
  })

  it('applies tier scaling when scalesPerTier is set', () => {
    const fc: FeatureChoice = { id: 'x', label: 'X', count: 2, scalesPerTier: true }
    expect(effectiveMaxCountForChoice(fc, 1)).toBe(2)
    expect(effectiveMaxCountForChoice(fc, 2)).toBe(3)
    expect(effectiveMaxCountForChoice(fc, 3)).toBe(4)
  })

  it('resolves level-keyed records against the effective level', () => {
    const fc: FeatureChoice = { id: 'x', label: 'X', count: { 1: 2, 5: 5 } }
    expect(effectiveMaxCountForChoice(fc, 1)).toBe(2) // level 3 → highest key 1
    expect(effectiveMaxCountForChoice(fc, 2)).toBe(5) // level 6 → highest key 5
    expect(effectiveMaxCountForChoice(fc, 3)).toBe(5) // level 10 → highest key 5
  })
})

describe('eligibleFeatureChoices', () => {
  it('returns an empty list when no class is selected', () => {
    expect(eligibleFeatureChoices(null, 1)).toEqual([])
  })

  it('returns only choices whose minTier is satisfied', () => {
    const fc = eligibleFeatureChoices('Warlock', 1)
    // Warlock has two tier-1 choices: Eldritch Invocations and Warlock Subclass.
    expect(fc.map((c) => c.id)).toEqual(['eldritch-invocations', 'warlock-subclass'])
    expect(fc.every((c) => !c.minTier || c.minTier <= 1)).toBe(true)
  })

  it('uses real rules data so the helper stays in sync with the catalog', () => {
    const classIds = Object.keys(DND_RULES.CLASSES)
    for (const id of classIds) {
      expect(() => eligibleFeatureChoices(id, 1)).not.toThrow()
    }
  })
})
