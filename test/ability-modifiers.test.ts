import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '../src/stores/character'

describe('Character Store - Ability Modifiers', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('applies ability modifiers from features', () => {
    const store = useCharacterStore()

    // Setup base stats
    store.currentCharacterData.pointBuyBaseScores = {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    }

    // Add a feature with ability modifiers
    store.currentCharacterData.features = [
      {
        title: 'ASI',
        desc: 'Test',
        abilityModifiers: { str: 2, dex: 1 },
      },
    ] as any

    // Trigger recalculation
    store.recalculateAbilityScores()

    // Check results
    expect(store.currentCharacterData.abilityScores.str).toBe(12)
    expect(store.currentCharacterData.abilityScores.dex).toBe(11)
    expect(store.currentCharacterData.abilityScores.con).toBe(10)
  })

  it('stacks with background bonuses', () => {
    const store = useCharacterStore()

    // Setup base stats
    store.currentCharacterData.pointBuyBaseScores = {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    }

    // Setup background bonuses
    store.currentCharacterData.backgroundBonusSelections = {
      plusTwo: 'str',
      plusOne: 'dex',
    }

    // Add a feature with ability modifiers
    store.currentCharacterData.features = [
      {
        title: 'ASI',
        desc: 'Test',
        abilityModifiers: { str: 1, dex: 1 },
      },
    ] as any

    // Trigger recalculation
    store.recalculateAbilityScores()

    // Check results
    // STR: 10 + 2 (background) + 1 (feat) = 13
    // DEX: 10 + 1 (background) + 1 (feat) = 12
    expect(store.currentCharacterData.abilityScores.str).toBe(13)
    expect(store.currentCharacterData.abilityScores.dex).toBe(12)
  })
})
