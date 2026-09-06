import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '../src/stores/character'
import { useProgressionStore } from '../src/stores/progression'

describe('Character Store - Ability Modifiers', () => {
  let store: ReturnType<typeof useCharacterStore>
  let progressionStore: ReturnType<typeof useProgressionStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCharacterStore()
    progressionStore = useProgressionStore()
  })

  it('applies ability modifiers from features', () => {
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
    progressionStore.recalculateAbilityScores()

    // Check results
    expect(store.currentCharacterData.abilityScores.str).toBe(12)
    expect(store.currentCharacterData.abilityScores.dex).toBe(11)
    expect(store.currentCharacterData.abilityScores.con).toBe(10)
  })

  it('stacks with background bonuses', () => {
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
    progressionStore.recalculateAbilityScores()

    // Check results
    // STR: 10 + 2 (background) + 1 (feat) = 13
    // DEX: 10 + 1 (background) + 1 (feat) = 12
    expect(store.currentCharacterData.abilityScores.str).toBe(13)
    expect(store.currentCharacterData.abilityScores.dex).toBe(12)
  })

  it('keeps current HP bounded by max HP correctly', () => {
    // Set a defined class and CON to get predictable maxHp
    store.currentCharacterData.class = 'Fighter'
    store.currentCharacterData.pointBuyBaseScores.con = 14
    store.currentCharacterData.abilityScores.con = 14
    store.currentCharacterData.renownTier = 1
    progressionStore.recalculateAbilityScores()
    
    // Set hp_current to max to start
    store.currentCharacterData.combat.hp_current = progressionStore.maxHp
    expect(store.currentCharacterData.combat.hp_current).toBe(progressionStore.maxHp)

    // Set con base score high to change maxHp
    store.currentCharacterData.pointBuyBaseScores.con = 14
    progressionStore.recalculateAbilityScores()

    // HP should stay at max HP because it was at max HP before
    expect(store.currentCharacterData.combat.hp_current).toBe(progressionStore.maxHp)

    // Set hp_current to a damaged state
    store.currentCharacterData.combat.hp_current = 5
    progressionStore.recalculateAbilityScores()
    
    // hp_current should be 5
    expect(store.currentCharacterData.combat.hp_current).toBe(5)

    // Set hp_current to above max HP
    store.currentCharacterData.combat.hp_current = 100
    // Trigger recalculation should bound it
    progressionStore.recalculateAbilityScores()
    expect(store.currentCharacterData.combat.hp_current).toBe(progressionStore.maxHp)
  })
})