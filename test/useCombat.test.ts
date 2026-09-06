import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '@/stores/character'
import { useProgressionStore } from '@/stores/progression'
import { createBlankCharacter, getMod } from '@/domain'
import { useCombat, generateId } from '@/composables/useCombat'
import type { CharacterData } from '@/types/character'
import type { Attack } from '@/types/character'

/**
 * Helper: create a test character with specific ability scores and combat stats.
 */
function createTestCharacter(overrides: Partial<CharacterData> = {}): CharacterData {
  const baseScores = {
    str: 16,
    dex: 14,
    con: 12,
    int: 10,
    wis: 8,
    cha: 15,
  }

  return {
    ...createBlankCharacter(),
    pointBuyBaseScores: { ...baseScores },
    abilityScores: { ...baseScores },
    backgroundBonusSelections: { plusTwo: null, plusOne: null },
    profBonus: 2,
    class: 'Fighter',
    // Derived level for Fighter defaults to 3 (renownTier 1)
    renownTier: 1,
    combat: {
      ac: 16,
      hp_max: 28,
      hp_current: 28,
      speed: '30ft',
    },
    attacks: [],
    ...overrides,
  } as CharacterData
}

describe('generateId (pure utility)', () => {
  it('produces a unique, non-empty string on successive calls', () => {
    const id1 = generateId()
    const id2 = generateId()
    const id3 = generateId()

    expect(id1).toBeTruthy()
    expect(id2).toBeTruthy()
    expect(id3).toBeTruthy()
    expect(id1).not.toBe(id2)
    expect(id1).not.toBe(id3)
    expect(id2).not.toBe(id3)
  })
})

describe('useCombat', () => {
  let store: ReturnType<typeof useCharacterStore>
  let progressionStore: ReturnType<typeof useProgressionStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCharacterStore()
    progressionStore = useProgressionStore()
    store.currentCharacterData = createTestCharacter()
  })

  describe('initiativeMod', () => {
    it('reflects the Dexterity modifier', () => {
      // DEX 14 → +2
      const { initiativeMod } = useCombat(store)
      expect(initiativeMod.value).toBe(getMod(14)) // +2
    })

    it('is 0 when Dexterity is 10', () => {
      const baseScores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
      store.currentCharacterData = createTestCharacter({
        abilityScores: { ...baseScores },
        pointBuyBaseScores: { ...baseScores },
      })
      const { initiativeMod } = useCombat(store)
      expect(initiativeMod.value).toBe(0)
    })
  })

  describe('hitDiceDisplay', () => {
    it('formats correctly for a leveled character (level 3 Fighter → "3d10")', () => {
      // Fighter class has hitDice: 10 → should show "3d10"
      store.currentCharacterData.class = 'Fighter'
      store.currentCharacterData.renownTier = 1 // → derivedLevel = 3
      const { hitDiceDisplay } = useCombat(store)

      // The store's derivedLevel getter reads renownTier and returns 3 for tier 1
      expect(progressionStore.derivedLevel).toBe(3)
      expect(hitDiceDisplay.value).toBe('3d10')
    })

    it('falls back to d8 when class is null', () => {
      store.currentCharacterData.class = null
      const { hitDiceDisplay } = useCombat(store)

      expect(hitDiceDisplay.value).toBe('3d8') // derivedLevel=3, fallback die=8
    })
  })

  describe('walkingSpeed', () => {
    it('returns the combat speed from store', () => {
      store.currentCharacterData.combat.speed = '25ft'
      const { walkingSpeed } = useCombat(store)

      expect(walkingSpeed.value).toBe('25ft')
    })

    it('falls back to 30ft when combat speed is empty', () => {
      store.currentCharacterData.combat.speed = ''
      const { walkingSpeed } = useCombat(store)

      expect(walkingSpeed.value).toBe('30ft')
    })
  })

  describe('clampCurrentHp', () => {
    it('clamps hp_current to maxHp when it exceeds', () => {
      // progressionStore.maxHp is a computed getter that recalculates from ability scores,
      // derivedLevel, and class hitDice. For Fighter level 3 with CON 12 (+1):
      // hitDice(10) + conMod(1) + 2 * max(1, hitDiceAverage(6)+conMod(1)) = 10+1+2*7 = 25
      store.currentCharacterData.combat.hp_max = 30
      store.currentCharacterData.combat.hp_current = 45
      const { clampCurrentHp } = useCombat(store)

      clampCurrentHp()

      // The computed maxHp recalculates to 25 for this character
      expect(store.currentCharacterData.combat.hp_current).toBe(progressionStore.maxHp)
      expect(store.currentCharacterData.combat.hp_current).toBe(25)
    })

    it('does nothing when hp_current is within bounds', () => {
      store.currentCharacterData.combat.hp_max = 30
      store.currentCharacterData.combat.hp_current = 10 // well under the computed maxHp of 25
      const { clampCurrentHp } = useCombat(store)

      clampCurrentHp()

      expect(store.currentCharacterData.combat.hp_current).toBe(10)
    })
  })

  describe('getAttackBonus', () => {
    it('sums ability modifier and proficiency bonus', () => {
      // STR 16 (+3) + PB 2 = +5
      const attack: Attack = {
        id: '1',
        name: 'Longsword',
        atkStat: 'str',
        dmgDie: '1d8',
        dmgBonus: 0,
        type: 'slashing',
      }
      const { getAttackBonus } = useCombat(store)

      expect(getAttackBonus(attack)).toBe(5) // 3 + 2
    })

    it('returns customAtkValue directly when atkStat is "custom"', () => {
      const attack: Attack = {
        id: '2',
        name: 'Custom Weapon',
        atkStat: 'custom',
        customAtkValue: 7,
        dmgDie: '1d6',
        dmgBonus: 0,
        type: 'piercing',
      }
      const { getAttackBonus } = useCombat(store)

      expect(getAttackBonus(attack)).toBe(7)
    })
  })

  describe('getDamageBonus', () => {
    it('sums ability modifier and damage bonus', () => {
      // STR 16 (+3) + dmgBonus 2 = +5
      const attack: Attack = {
        id: '3',
        name: 'Greatsword',
        dmgStat: 'str',
        dmgDie: '2d6',
        dmgBonus: 2,
        type: 'slashing',
      }
      const { getDamageBonus } = useCombat(store)

      expect(getDamageBonus(attack)).toBe(5) // 3 + 2
    })

    it('returns customDmgValue directly when dmgStat is "custom"', () => {
      const attack: Attack = {
        id: '4',
        name: 'Custom Damage',
        dmgStat: 'custom',
        customDmgValue: 10,
        dmgDie: '1d4',
        dmgBonus: 0,
        type: 'force',
      }
      const { getDamageBonus } = useCombat(store)

      expect(getDamageBonus(attack)).toBe(10)
    })
  })

  describe('getAttackTypeLabel', () => {
    it('formats die and type into a label', () => {
      const { getAttackTypeLabel } = useCombat(store)
      expect(getAttackTypeLabel('1d8', 'slashing')).toBe('1d8 slashing')
    })
  })

  describe('addAttack / removeAttack', () => {
    it('addAttack pushes a new attack and returns its id', () => {
      store.currentCharacterData.attacks = []
      const { addAttack } = useCombat(store)

      const id = addAttack()

      expect(store.currentCharacterData.attacks).toHaveLength(1)
      expect(store.currentCharacterData.attacks[0].id).toBe(id)
      expect(store.currentCharacterData.attacks[0].name).toBe('New Attack')
    })

    it('removeAttack removes the attack at the given index', () => {
      store.currentCharacterData.attacks = [
        { id: 'a', name: 'First', dmgDie: '1d6', dmgBonus: 0, type: 'piercing' },
        { id: 'b', name: 'Second', dmgDie: '1d8', dmgBonus: 0, type: 'slashing' },
      ] as Attack[]
      const { removeAttack } = useCombat(store)

      removeAttack(0)

      expect(store.currentCharacterData.attacks).toHaveLength(1)
      expect(store.currentCharacterData.attacks[0].id).toBe('b')
    })
  })

  describe('editableAttacks', () => {
    it('assigns stable ids to attacks that lack them', () => {
      store.currentCharacterData.attacks = [
        { name: 'NoId', dmgDie: '1d6', dmgBonus: 0, type: 'piercing' },
      ] as Attack[]
      const { editableAttacks } = useCombat(store)

      const result = editableAttacks.value

      expect(result[0].id).toBeTruthy()
      expect(result[0].id).toBe(store.currentCharacterData.attacks[0].id)
    })

    it('does not overwrite existing attack ids', () => {
      store.currentCharacterData.attacks = [
        { id: 'existing-id', name: 'HasId', dmgDie: '1d8', dmgBonus: 0, type: 'slashing' },
      ] as Attack[]
      const { editableAttacks } = useCombat(store)

      const result = editableAttacks.value

      expect(result[0].id).toBe('existing-id')
    })

    it('writes back to store.attacks on set', () => {
      store.currentCharacterData.attacks = []
      const { editableAttacks } = useCombat(store)

      const newAttacks: Attack[] = [
        { id: 'x', name: 'X', dmgDie: '1d6', dmgBonus: 0, type: 'piercing' },
      ]
      editableAttacks.value = newAttacks

      expect(store.currentCharacterData.attacks).toEqual(newAttacks)
    })
  })
})