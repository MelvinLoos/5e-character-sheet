import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '@/stores/character'
import { useProgressionStore } from '@/stores/progression'
import { useSpellStore } from '@/stores/spellStore'
import { createBlankCharacter } from '@/domain'
import { applyAllChanges, calculateDerivedStats } from '@/utils/characterMutations'
import { CLASS_SPELLCASTING_ABILITY, getSpellcastingAbility } from '@/data/rules'
import type { CharacterData, CharacterFeature } from '@/types/character'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseScores = { str: 10, dex: 10, con: 10, int: 10, wis: 18, cha: 16 }

function makeChar(overrides: Partial<CharacterData> = {}): CharacterData {
  return {
    ...createBlankCharacter(),
    pointBuyBaseScores: { ...baseScores },
    abilityScores: { ...baseScores },
    backgroundBonusSelections: { plusTwo: null, plusOne: null },
    renownTier: 1,
    profBonus: 2,
    features: [],
    spellcasting: null,
    ...overrides,
  } as CharacterData
}

// ---------------------------------------------------------------------------
// Rules data: class -> spellcasting ability mapping
// ---------------------------------------------------------------------------

describe('CLASS_SPELLCASTING_ABILITY', () => {
  it('maps every spellcasting class to the correct ability', () => {
    expect(CLASS_SPELLCASTING_ABILITY).toEqual({
      Bard: 'cha',
      Cleric: 'wis',
      Druid: 'wis',
      Paladin: 'cha',
      Ranger: 'wis',
      Sorcerer: 'cha',
      Warlock: 'cha',
      Wizard: 'int',
    })
  })
})

describe('getSpellcastingAbility', () => {
  it('returns the mapped ability for a known spellcaster class', () => {
    expect(getSpellcastingAbility('Cleric')).toBe('wis')
    expect(getSpellcastingAbility('Druid')).toBe('wis')
    expect(getSpellcastingAbility('Bard')).toBe('cha')
    expect(getSpellcastingAbility('Sorcerer')).toBe('cha')
    expect(getSpellcastingAbility('Warlock')).toBe('cha')
    expect(getSpellcastingAbility('Paladin')).toBe('cha')
    expect(getSpellcastingAbility('Ranger')).toBe('wis')
    expect(getSpellcastingAbility('Wizard')).toBe('int')
  })

  it('falls back to int for non-casters or missing class values', () => {
    expect(getSpellcastingAbility('Fighter')).toBe('int')
    expect(getSpellcastingAbility('Barbarian')).toBe('int')
    expect(getSpellcastingAbility(null)).toBe('int')
    expect(getSpellcastingAbility(undefined)).toBe('int')
  })
})


// ---------------------------------------------------------------------------
// calculateDerivedStats derives the ability from the class
// ---------------------------------------------------------------------------

describe('calculateDerivedStats spellcasting ability', () => {
  it.each([
    ['Cleric', 'wis'],
    ['Druid', 'wis'],
    ['Ranger', 'wis'],
    ['Bard', 'cha'],
    ['Sorcerer', 'cha'],
    ['Warlock', 'cha'],
    ['Paladin', 'cha'],
    ['Wizard', 'int'],
  ])('sets %s spellcasting ability to %s', (className, expected) => {
    const char = makeChar({
      class: className,
      features: [
        { title: `${className} Spellcasting`, desc: '', casterType: 'full', key: true } as CharacterFeature,
      ],
    })
    const result = calculateDerivedStats(char)
    expect(result.spellcasting?.ability).toBe(expected)
  })

  it('refreshes the ability even when a spellcasting object already exists', () => {
    const char = makeChar({
      class: 'Cleric',
      spellcasting: { ability: 'int', slotsSpent: { level1: 2 } },
      features: [
        { title: 'Cleric Spellcasting', desc: '', casterType: 'full', key: true } as CharacterFeature,
      ],
    })
    const result = calculateDerivedStats(char)
    expect(result.spellcasting?.ability).toBe('wis')
    expect(result.spellcasting?.slotsSpent).toEqual({ level1: 2 })
  })

  it('nulls spellcasting for non-caster classes', () => {
    const char = makeChar({
      class: 'Fighter',
      spellcasting: { ability: 'int' },
      features: [],
    })
    const result = calculateDerivedStats(char)
    expect(result.spellcasting).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// applyAllChanges grants the correct ability end-to-end
// ---------------------------------------------------------------------------

describe('applyAllChanges spellcasting ability', () => {
  it.each([
    ['Cleric', 'wis'],
    ['Druid', 'wis'],
    ['Ranger', 'wis'],
    ['Bard', 'cha'],
    ['Sorcerer', 'cha'],
    ['Warlock', 'cha'],
    ['Paladin', 'cha'],
    ['Wizard', 'int'],
  ])('grants %s the correct spellcasting ability', (className, expected) => {
    const result = applyAllChanges(makeChar({ class: className }))
    expect(result.spellcasting?.ability).toBe(expected)
  })

  it.each(['Fighter', 'Barbarian'])('leaves %s without a spellcasting object', (className) => {
    const result = applyAllChanges(makeChar({ class: className, background: null }))
    expect(result.spellcasting).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Store integration
// ---------------------------------------------------------------------------

describe('spellcasting ability store integration', () => {
  let characterStore: ReturnType<typeof useCharacterStore>
  let spellStore: ReturnType<typeof useSpellStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    characterStore = useCharacterStore()
    useProgressionStore()
    spellStore = useSpellStore()
  })

  it('computes spell attack from Wisdom for a Cleric with WIS 18 and INT 10', () => {
    characterStore.currentCharacterData = makeChar({
      class: 'Fighter',
      pointBuyBaseScores: { str: 10, dex: 10, con: 10, int: 10, wis: 18, cha: 10 },
      abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 18, cha: 10 },
    })
    characterStore.applyClassChange('Cleric')

    expect(characterStore.currentCharacterData.spellcasting?.ability).toBe('wis')
    expect(spellStore.spellcastingAbility).toBe('wis')
    expect(spellStore.spellMod).toBe(4) // WIS 18 -> +4
    expect(spellStore.spellAttack).toBe(6) // PB +2 + WIS +4
    expect(spellStore.spellSaveDC).toBe(14) // 8 + 2 + 4
  })

  it('updates the ability when switching class from Cleric to Wizard', () => {
    characterStore.currentCharacterData = makeChar({
      class: 'Fighter',
      pointBuyBaseScores: { str: 10, dex: 10, con: 10, int: 18, wis: 18, cha: 10 },
      abilityScores: { str: 10, dex: 10, con: 10, int: 18, wis: 18, cha: 10 },
    })

    characterStore.applyClassChange('Cleric')
    expect(characterStore.currentCharacterData.spellcasting?.ability).toBe('wis')

    characterStore.applyClassChange('Wizard')
    expect(characterStore.currentCharacterData.spellcasting?.ability).toBe('int')
  })
})

