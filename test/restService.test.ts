import { describe, it, expect } from 'vitest'
import { createBlankCharacter } from '@/domain'
import {
  applyLongRest,
  applyShortRest,
  describeLongRest,
  describeShortRest,
  hitDiceRegainedOnLongRest,
  pactSlotsToRestore,
  rollHitDiceHealing,
  type RestContext,
} from '@/domain/restService'
import type { CharacterData, CharacterFeature } from '@/types/character'

const ctx: RestContext = { maxHp: 40, level: 5, hitDie: 8, hitDiceAverage: 5, conMod: 2 }

function feature(title: string, reset: string, used = 1): CharacterFeature {
  return {
    title,
    desc: '',
    used,
    resource: { resourceType: 'static', value: 2, reset },
  } as CharacterFeature
}

function makeChar(overrides: Partial<CharacterData['combat']> = {}): CharacterData {
  const c = createBlankCharacter()
  c.features = []
  c.combat = { ...c.combat, hp_max: 40, hp_current: 10, hp_temp: 3, hit_dice_used: 3, ...overrides }
  return c
}

describe('hitDiceRegainedOnLongRest', () => {
  it.each([
    [1, 1],
    [2, 1],
    [5, 2],
    [20, 10],
  ])('level %i regains %i', (total, expected) => {
    expect(hitDiceRegainedOnLongRest(total)).toBe(expected)
  })
})

describe('rollHitDiceHealing', () => {
  it('uses average + CON per die', () => {
    expect(rollHitDiceHealing(2, ctx, true)).toBe(14)
  })
  it('uses the injected rng for rolled dice', () => {
    expect(rollHitDiceHealing(1, ctx, false, () => 0.999)).toBe(10) // d8 -> 8 + 2
    expect(rollHitDiceHealing(1, ctx, false, () => 0)).toBe(3) // 1 + 2
  })
  it('heals at least 1 per die despite a negative CON modifier', () => {
    expect(rollHitDiceHealing(2, { ...ctx, conMod: -5 }, true)).toBe(2)
  })
})

describe('short rest', () => {
  it('spends dice, heals, and caps at max HP', () => {
    const next = applyShortRest(makeChar({ hp_current: 35 }), ctx, { hitDiceSpent: 2, useAverage: true })
    expect(next.combat.hp_current).toBe(40)
    expect(next.combat.hit_dice_used).toBe(5)
  })
  it('caps spending at the remaining dice', () => {
    const next = applyShortRest(makeChar({ hit_dice_used: 4 }), ctx, { hitDiceSpent: 9, useAverage: true })
    expect(next.combat.hit_dice_used).toBe(5)
  })
  it('does not mutate the input', () => {
    const c = makeChar()
    applyShortRest(c, ctx, { hitDiceSpent: 1, useAverage: true })
    expect(c.combat.hp_current).toBe(10)
  })
  it('resets only Short Rest features', () => {
    const c = makeChar()
    c.features = [feature('A', 'Short Rest'), feature('B', 'Long Rest'), feature('C', 'Turn')]
    const next = applyShortRest(c, ctx, { hitDiceSpent: 0, useAverage: true })
    expect(next.features.map((f) => f.used)).toEqual([0, 1, 1])
  })
  it('clears death saves when healed from 0', () => {
    const next = applyShortRest(
      makeChar({ hp_current: 0, death_saves: { successes: 1, failures: 2 } }),
      ctx,
      { hitDiceSpent: 1, useAverage: true },
    )
    expect(next.combat.death_saves).toEqual({ successes: 0, failures: 0 })
  })
  it('restores pact slots but not other slots', () => {
    const pact = { title: 'Pact', desc: '', casterType: 'pact' } as CharacterFeature
    expect(pactSlotsToRestore([pact], 5, { level3: 2, level1: 1 })).toEqual({ level3: 2 })
    const full = { title: 'Full', desc: '', casterType: 'full' } as CharacterFeature
    expect(pactSlotsToRestore([full], 5, { level1: 2 })).toEqual({})
  })
  it('reports nothing to do when full and nothing spent', () => {
    const c = makeChar({ hp_current: 40, hit_dice_used: 0 })
    expect(describeShortRest(c, ctx).hasAnything).toBe(false)
  })
  it('is available when hurt with dice remaining', () => {
    expect(describeShortRest(makeChar(), ctx).hasAnything).toBe(true)
  })
})

describe('long rest', () => {
  it('restores everything', () => {
    const c = makeChar({ death_saves: { successes: 2, failures: 1 } })
    c.spellcasting = { slotsSpent: { level1: 2 } }
    c.features = [
      feature('S', 'Short Rest'),
      feature('L', 'Long Rest'),
      feature('D', 'Dawn'),
      feature('Day', 'Day'),
      feature('T', 'Turn'),
      feature('X', 'Special'),
    ]
    const next = applyLongRest(c, ctx)
    expect(next.combat.hp_current).toBe(40)
    expect(next.combat.hp_temp).toBe(0)
    expect(next.combat.hit_dice_used).toBe(1) // 3 - floor(5/2)
    expect(next.combat.death_saves).toEqual({ successes: 0, failures: 0 })
    expect(next.spellcasting?.slotsSpent).toEqual({})
    expect(next.features.map((f) => f.used)).toEqual([0, 0, 0, 0, 1, 1])
  })
  it('never lets used hit dice go negative', () => {
    expect(applyLongRest(makeChar({ hit_dice_used: 1 }), ctx).combat.hit_dice_used).toBe(0)
  })
  it('reports nothing to do when fully rested', () => {
    const c = makeChar({ hp_current: 40, hp_temp: 0, hit_dice_used: 0 })
    expect(describeLongRest(c, ctx).hasAnything).toBe(false)
  })
})
