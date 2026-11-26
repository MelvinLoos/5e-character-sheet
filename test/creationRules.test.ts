import { describe, it, expect } from 'vitest'
import {
  validatePointBuy,
  validateBackgroundBonuses,
  validateClassSkillChoices,
  validateSubChoice,
  validateFeatureChoices,
  validateCreationRules,
  pointBuyCostTotal,
} from '@/domain/creationRules'
import * as DND_RULES from '@/data/rules'
import { createBlankCharacter } from '@/domain/characterService'

const legal = { str: 8, dex: 15, con: 14, int: 8, wis: 12, cha: 10 } // 0+9+7+0+4+2 = 22

describe('point buy', () => {
  it('costs a legal array', () => expect(pointBuyCostTotal(legal)).toBe(22))
  it('accepts legal scores', () => expect(validatePointBuy(legal)).toEqual([]))
  it('rejects over budget', () =>
    expect(validatePointBuy({ str: 15, dex: 15, con: 15, int: 15, wis: 8, cha: 8 })[0]).toMatch(/budget/))
  it('rejects out of range', () =>
    expect(validatePointBuy({ ...legal, str: 16 })[0]).toMatch(/Base str/))
})

describe('background bonuses', () => {
  const bgName = Object.keys(DND_RULES.BACKGROUNDS)[0]!
  const opts = DND_RULES.BACKGROUNDS[bgName]!.abilityScoreIncrease
  it('accepts two distinct allowed abilities', () =>
    expect(validateBackgroundBonuses(bgName, { plusTwo: opts[0], plusOne: opts[1] })).toEqual([]))
  it('rejects duplicates', () =>
    expect(validateBackgroundBonuses(bgName, { plusTwo: opts[0], plusOne: opts[0] }).join()).toMatch(/different/))
  it('rejects abilities outside the background', () => {
    const outside = ['str', 'dex', 'con', 'int', 'wis', 'cha'].find((a) => !opts.includes(a))!
    expect(validateBackgroundBonuses(bgName, { plusTwo: outside, plusOne: opts[0] }).join()).toMatch(/does not offer/)
  })
})

describe('class skills', () => {
  it('rejects too many chosen skills', () => {
    const c = createBlankCharacter()
    c.proficiencies.skills = Object.keys(DND_RULES.SKILLS)
    expect(validateClassSkillChoices(c).length).toBeGreaterThan(0)
  })
  it('accepts a blank character', () =>
    expect(validateClassSkillChoices(createBlankCharacter())).toEqual([]))
})

describe('sub-choice', () => {
  const withSub = Object.entries(DND_RULES.SPECIES).find(([, s]) => s.subChoices)!
  it('requires a sub-choice when the species has them', () =>
    expect(validateSubChoice(withSub[0], null)[0]).toMatch(/requires/))
  it('rejects unknown sub-choice', () =>
    expect(validateSubChoice(withSub[0], 'nope')[0]).toMatch(/Unknown/))
  it('accepts a valid sub-choice', () =>
    expect(validateSubChoice(withSub[0], withSub[1].subChoices![0]!.id)).toEqual([]))
})

describe('feature choices', () => {
  it('rejects unknown choice id', () =>
    expect(validateFeatureChoices({ class: 'Fighter', renownTier: 1, featureChoices: { bogus: ['x'] } })[0]).toMatch(/not available/))
})

describe('validateCreationRules', () => {
  it('passes for a character with legal base scores', () => {
    const c = createBlankCharacter()
    c.pointBuyBaseScores = { ...legal }
    const errs = validateCreationRules(c)
    expect(errs.filter((e) => /point|Base/i.test(e))).toEqual([])
  })
})

describe('pointBuyNextCost / backgroundBonusFor', () => {
  it('reports the marginal cost of the next point', async () => {
    const { pointBuyNextCost } = await import('@/domain/creationRules')
    expect(pointBuyNextCost(8)).toBe(1)
    expect(pointBuyNextCost(13)).toBe(2)
    expect(pointBuyNextCost(14)).toBe(2)
    expect(pointBuyNextCost(15)).toBeNull()
  })

  it('maps background selections to per-ability bonuses', async () => {
    const { backgroundBonusFor } = await import('@/domain/creationRules')
    const sel = { plusTwo: 'int', plusOne: 'wis' }
    expect(backgroundBonusFor('int', sel)).toBe(2)
    expect(backgroundBonusFor('wis', sel)).toBe(1)
    expect(backgroundBonusFor('str', sel)).toBe(0)
    expect(backgroundBonusFor('str', null)).toBe(0)
  })
})

describe('featureGroup', () => {
  it('uses an explicit featureType first', async () => {
    const { featureGroup } = await import('@/domain/creationRules')
    expect(featureGroup({ title: 'x', featureType: 'Species Trait' })).toBe('species')
    expect(featureGroup({ title: 'x', featureType: 'Feat' })).toBe('feat')
  })
  it('classifies auto-granted features from the rules catalog', async () => {
    const { featureGroup } = await import('@/domain/creationRules')
    expect(featureGroup({ title: 'Rage' })).toBe('class')
    expect(featureGroup({ title: 'Darkvision' })).toBe('species')
    expect(featureGroup({ title: 'Some Homebrew Feat' })).toBe('feat')
  })
})
