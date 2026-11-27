import { describe, it, expect } from 'vitest'
import {
  getCharacterLevel,
  getCharacterTier,
  meetsProgressionGate,
  usesLevels,
} from '@/domain/rulesService'
import { eligibleFeatureChoices, effectiveMaxCountForChoice } from '@/utils/featureChoiceRules'
import { subclassChoiceFor } from '@/domain/creationRules'
import { applyAllChanges } from '@/utils/characterMutations'
import { migrateLevelToRenown } from '@/utils/migrations'
import { createBlankCharacter } from '@/domain/characterService'

const lvl = (level: number) => ({ progressionMode: 'level' as const, level })

describe('getCharacterLevel / getCharacterTier', () => {
  it('defaults to Renown mode', () => {
    expect(usesLevels({ renownTier: 2 })).toBe(false)
    expect(getCharacterLevel({ renownTier: 2 })).toBe(6)
    expect(getCharacterTier({ renownTier: 2 })).toBe(2)
    expect(getCharacterLevel({})).toBe(3)
  })

  it('uses the set level in level mode and clamps to 1-20', () => {
    expect(getCharacterLevel(lvl(7))).toBe(7)
    expect(getCharacterLevel(lvl(0))).toBe(1)
    expect(getCharacterLevel(lvl(99))).toBe(20)
    expect(getCharacterLevel({ progressionMode: 'level' })).toBe(1)
  })

  it('derives the tier from the level', () => {
    const tiers = [1, 2, 3, 5, 6, 9, 10, 13, 14, 20].map((l) => getCharacterTier(lvl(l)))
    expect(tiers).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4])
  })
})

describe('meetsProgressionGate', () => {
  it('prefers minLevel in level mode and falls back to the tier equivalent', () => {
    expect(meetsProgressionGate({ minTier: 1 }, lvl(2))).toBe(false)
    expect(meetsProgressionGate({ minTier: 1 }, lvl(3))).toBe(true)
    expect(meetsProgressionGate({ minTier: 4 }, lvl(13))).toBe(false)
    expect(meetsProgressionGate({ minTier: 4 }, lvl(14))).toBe(true)
    expect(meetsProgressionGate({ minTier: 3, minLevel: 8 }, lvl(8))).toBe(true)
    expect(meetsProgressionGate({}, lvl(1))).toBe(true)
  })

  it('ignores minLevel in Renown mode', () => {
    expect(meetsProgressionGate({ minTier: 2, minLevel: 1 }, { renownTier: 1 })).toBe(false)
    expect(meetsProgressionGate({ minTier: 2 }, { renownTier: 2 })).toBe(true)
  })
})

describe('feature choices in level mode', () => {
  it('offers no subclass before level 3', () => {
    expect(subclassChoiceFor('Wizard', lvl(2))).toBeNull()
    expect(subclassChoiceFor('Wizard', lvl(3))?.id).toBe('wizard-school')
  })

  it('offers Fighting Style at level 1 and Warlock invocations scale per level', () => {
    expect(eligibleFeatureChoices('Fighter', lvl(1)).map((c) => c.id)).toEqual(['fighting-style'])
    const inv = eligibleFeatureChoices('Warlock', lvl(1)).find((c) => c.id === 'eldritch-invocations')!
    expect(effectiveMaxCountForChoice(inv, lvl(1))).toBe(1)
    expect(effectiveMaxCountForChoice(inv, lvl(2))).toBe(3)
    expect(effectiveMaxCountForChoice(inv, lvl(5))).toBe(5)
    expect(effectiveMaxCountForChoice(inv, lvl(18))).toBe(10)
  })

  it('keeps Renown results identical for Warlock invocations', () => {
    const inv = eligibleFeatureChoices('Warlock', { renownTier: 1 }).find(
      (c) => c.id === 'eldritch-invocations',
    )!
    expect([1, 2, 3].map((t) => effectiveMaxCountForChoice(inv, { renownTier: t }))).toEqual([3, 5, 7])
  })
})

describe('derived stats in level mode', () => {
  it('sets proficiency bonus from the level', () => {
    const base = createBlankCharacter()
    expect(applyAllChanges({ ...base, ...lvl(1) }).profBonus).toBe(2)
    expect(applyAllChanges({ ...base, ...lvl(5) }).profBonus).toBe(3)
    expect(applyAllChanges({ ...base, ...lvl(20) }).profBonus).toBe(6)
  })
})

describe('migrateLevelToRenown', () => {
  it('leaves level-mode characters alone', () => {
    const ch = migrateLevelToRenown({ progressionMode: 'level', level: 7 }) as Record<string, unknown>
    expect(ch.level).toBe(7)
    expect(ch.progressionMode).toBe('level')
  })

  it('still converts legacy level-only characters', () => {
    const ch = migrateLevelToRenown({ level: 6 }) as Record<string, unknown>
    expect(ch.renownTier).toBe(2)
    expect(ch.level).toBeUndefined()
  })
})
