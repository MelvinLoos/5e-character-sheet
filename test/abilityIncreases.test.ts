import { describe, it, expect } from 'vitest'
import {
  parseFiveToolsAbility,
  sanitizeAbilityIncrease,
  resolveAbilityIncrease,
  needsAbilityChoice,
  describeAbilityIncrease,
  applyCappedIncrease,
} from '../src/domain/abilityIncreases'
import { applyBackgroundBonuses } from '../src/utils/characterMutations'
import { mapFeat } from '../src/utils/fiveToolsAdapter'
import { normalizeGuildFeat } from '../src/utils/guildContentValidator'
import type { CharacterData, CharacterFeature } from '../src/types/character'

const ALL = ['str', 'dex', 'con', 'int', 'wis', 'cha']
const ASI_RAW = [
  { choose: { from: ALL, amount: 2 }, hidden: true },
  { choose: { from: ALL, count: 2 }, hidden: true },
]

describe('parseFiveToolsAbility', () => {
  it('maps the XPHB Ability Score Improvement alternatives', () => {
    expect(parseFiveToolsAbility(ASI_RAW)).toEqual([
      { choose: { from: ALL, count: 1, amount: 2 } },
      { choose: { from: ALL, count: 2, amount: 1 } },
    ])
  })
  it('maps fixed increases and ignores unknown keys', () => {
    expect(parseFiveToolsAbility([{ cha: 1, bogus: 3 }])).toEqual([{ fixed: { cha: 1 } }])
  })
  it('keeps max for epic boons', () => {
    const r = parseFiveToolsAbility([{ choose: { from: ALL }, max: 30 }])
    expect(r).toEqual([{ choose: { from: ALL, count: 1, amount: 1 }, max: 30 }])
  })
  it('returns undefined for junk', () => {
    expect(parseFiveToolsAbility(undefined)).toBeUndefined()
    expect(parseFiveToolsAbility([{ hidden: true }])).toBeUndefined()
  })
})

describe('resolve / needs / describe', () => {
  const asi = parseFiveToolsAbility(ASI_RAW)!
  it('needs a choice until picks are valid', () => {
    expect(needsAbilityChoice({ abilityIncrease: asi })).toBe(true)
    expect(needsAbilityChoice({ abilityIncrease: asi, abilityChoice: { option: 0, picks: ['str'] } })).toBe(false)
    expect(needsAbilityChoice({ abilityIncrease: asi, abilityChoice: { option: 1, picks: ['str'] } })).toBe(true)
    expect(needsAbilityChoice({ abilityIncrease: asi, abilityChoice: { option: 1, picks: ['str', 'str'] } })).toBe(true)
  })
  it('resolves +2 and +1/+1', () => {
    expect(resolveAbilityIncrease({ abilityIncrease: asi, abilityChoice: { option: 0, picks: ['str'] } })?.bonuses).toEqual({ str: 2 })
    const r = resolveAbilityIncrease({ abilityIncrease: asi, abilityChoice: { option: 1, picks: ['str', 'dex'] } })
    expect(r?.bonuses).toEqual({ str: 1, dex: 1 })
    expect(describeAbilityIncrease({ abilityIncrease: asi, abilityChoice: { option: 1, picks: ['str', 'dex'] } })).toBe('+1 STR, +1 DEX')
  })
  it('rejects picks outside `from`', () => {
    const ath = parseFiveToolsAbility([{ choose: { from: ['str', 'dex'] } }])!
    expect(resolveAbilityIncrease({ abilityIncrease: ath, abilityChoice: { option: 0, picks: ['con'] } })).toBeNull()
  })
  it('single fixed option needs no choice and applies immediately', () => {
    const f = { abilityIncrease: [{ fixed: { cha: 1 } }] }
    expect(needsAbilityChoice(f)).toBe(false)
    expect(resolveAbilityIncrease(f)?.bonuses).toEqual({ cha: 1 })
  })
})

describe('applyCappedIncrease', () => {
  it('caps at max and never lowers', () => {
    expect(applyCappedIncrease(19, 2, 20)).toBe(20)
    expect(applyCappedIncrease(22, 2, 20)).toBe(22)
    expect(applyCappedIncrease(28, 2, 30)).toBe(30)
  })
})

describe('applyBackgroundBonuses with feat increases', () => {
  const base = (features: CharacterFeature[], str = 15): CharacterData =>
    ({
      pointBuyBaseScores: { str, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      backgroundBonusSelections: { plusTwo: 'str', plusOne: null },
      features,
    }) as unknown as CharacterData
  const asi = (picks: string[], option = 0): CharacterFeature => ({
    title: 'ASI', desc: '',
    abilityIncrease: parseFiveToolsAbility(ASI_RAW),
    abilityChoice: { option, picks: picks as never },
  })

  it('adds the chosen increase', () => {
    expect(applyBackgroundBonuses(base([asi(['dex'])], 8)).abilityScores.dex).toBe(10)
  })
  it('stops at 20 (15 + 2 bg + 2 = 19, a second ASI -> 20, not 21)', () => {
    expect(applyBackgroundBonuses(base([asi(['str'])])).abilityScores.str).toBe(19)
    expect(applyBackgroundBonuses(base([asi(['str']), asi(['str'])])).abilityScores.str).toBe(20)
  })
  it('ignores unresolved choices', () => {
    const pending: CharacterFeature = { title: 'ASI', desc: '', abilityIncrease: parseFiveToolsAbility(ASI_RAW) }
    expect(applyBackgroundBonuses(base([pending])).abilityScores.str).toBe(17)
  })
  it('legacy abilityModifiers stay uncapped', () => {
    const f = { title: 'x', desc: '', abilityModifiers: { str: 5 } } as CharacterFeature
    expect(applyBackgroundBonuses(base([f])).abilityScores.str).toBe(22)
  })
})

describe('sources', () => {
  it('mapFeat carries ability', () => {
    const r = mapFeat({ name: 'Athlete', source: 'XPHB', entries: ['x'], ability: [{ choose: { from: ['str', 'dex'] } }] })
    expect(r?.abilityIncrease).toEqual([{ choose: { from: ['str', 'dex'], count: 1, amount: 1 } }])
  })
  it('mapFeat leaves abilityIncrease unset without ability', () => {
    expect(mapFeat({ name: 'Alert', entries: ['x'] })?.abilityIncrease).toBeUndefined()
  })
  it('normalizeGuildFeat keeps structured and raw 5e.tools forms', () => {
    const structured = [{ fixed: { str: 1 } }]
    expect(normalizeGuildFeat({ title: 'T', abilityIncrease: structured }).abilityIncrease).toEqual(structured)
    expect(normalizeGuildFeat({ title: 'T', ability: ASI_RAW }).abilityIncrease).toHaveLength(2)
    expect(normalizeGuildFeat({ title: 'T', abilityModifiers: { dex: 1, x: 'no' } }).abilityModifiers).toEqual({ dex: 1 })
  })
  it('sanitizeAbilityIncrease drops invalid entries', () => {
    expect(sanitizeAbilityIncrease([{ fixed: { zzz: 1 } }, 'junk'])).toBeUndefined()
  })
})
