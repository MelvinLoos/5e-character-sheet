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



  it('keeps current HP bounded by max HP correctly', () => {
    const store = useCharacterStore()
    
    // Initial blank character should have hp_current set and synced to maxHp
    expect(store.currentCharacterData.combat.hp_current).toBe(store.maxHp)

    // Set con base score high to change maxHp
    store.currentCharacterData.pointBuyBaseScores.con = 14
    store.recalculateAbilityScores()

    // HP should stay at max HP because it was at max HP before
    expect(store.currentCharacterData.combat.hp_current).toBe(store.maxHp)

    // Set hp_current to a damaged state
    store.currentCharacterData.combat.hp_current = 5
    store.recalculateAbilityScores()
    
    // hp_current should be 5
    expect(store.currentCharacterData.combat.hp_current).toBe(5)

    // Set hp_current to above max HP
    store.currentCharacterData.combat.hp_current = 100
    // Trigger recalculation should bound it
    store.recalculateAbilityScores()
    expect(store.currentCharacterData.combat.hp_current).toBe(store.maxHp)
  })