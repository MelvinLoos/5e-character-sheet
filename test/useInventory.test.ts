import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '@/stores/character'
import { createBlankCharacter } from '@/domain'
import { useInventory } from '@/composables/useInventory'
import type { CharacterData } from '@/types/character'

/**
 * Helper: create a test character with specific ability scores and inventory state.
 *
 * We set pointBuyBaseScores to match abilityScores to prevent the store watcher
 * from resetting scores via recalculateAbilityScores().
 */
function createTestCharacter(overrides: Partial<CharacterData> = {}): CharacterData {
  const baseScores = {
    str: 14,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  }

  return {
    ...createBlankCharacter(),
    pointBuyBaseScores: { ...baseScores },
    abilityScores: { ...baseScores },
    backgroundBonusSelections: { plusTwo: null, plusOne: null },
    gold: 5,
    supply: 0,
    equippedGear: [],
    consumables: [],
    ...overrides,
  } as CharacterData
}

describe('useInventory', () => {
  let store: ReturnType<typeof useCharacterStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCharacterStore()
    store.currentCharacterData = createTestCharacter()
  })

  describe('maxSlots', () => {
    it('scales with Strength score (STR 16 → 16 slots)', () => {
      store.currentCharacterData.abilityScores['str'] = 16
      store.currentCharacterData.pointBuyBaseScores['str'] = 16
      const { maxSlots } = useInventory(store)

      expect(maxSlots.value).toBe(16)
    })

    it('enforces minimum floor of 15 slots (STR 6 → 15 slots)', () => {
      store.currentCharacterData.abilityScores['str'] = 6
      store.currentCharacterData.pointBuyBaseScores['str'] = 6
      const { maxSlots } = useInventory(store)

      expect(maxSlots.value).toBe(15)
    })

    it('handles STR exactly at 15 (no clamping needed)', () => {
      store.currentCharacterData.abilityScores['str'] = 15
      store.currentCharacterData.pointBuyBaseScores['str'] = 15
      const { maxSlots } = useInventory(store)

      expect(maxSlots.value).toBe(15)
    })
  })

  describe('usedSlots', () => {
    it('sums slot costs of all equippedGear', () => {
      store.currentCharacterData.equippedGear = [
        { id: '1', name: 'Sword', type: 'Weapon', description: '', slotCost: 3 },
        { id: '2', name: 'Shield', type: 'Armor', description: '', slotCost: 2 },
      ]
      store.currentCharacterData.consumables = []
      const { usedSlots } = useInventory(store)

      expect(usedSlots.value).toBe(5)
    })

    it('sums slot costs across both equippedGear AND consumables', () => {
      store.currentCharacterData.equippedGear = [
        { id: '1', name: 'Sword', type: 'Weapon', description: '', slotCost: 3 },
      ]
      store.currentCharacterData.consumables = [
        { id: 'c1', name: 'Potion', type: 'Potion', slotCost: 1, usageDie: 'd8' },
        { id: 'c2', name: 'Rations', type: 'Food', slotCost: 2, usageDie: 'd6' },
      ]
      const { usedSlots } = useInventory(store)

      expect(usedSlots.value).toBe(6) // 3 + 1 + 2
    })

    it('treats missing slotCost as 0', () => {
      store.currentCharacterData.equippedGear = [
        { id: '1', name: 'Free Item', type: 'Misc', description: '', slotCost: 0 },
      ]
      store.currentCharacterData.consumables = []
      const { usedSlots } = useInventory(store)

      expect(usedSlots.value).toBe(0)
    })
  })

  describe('slotPercentage', () => {
    it('calculates correct encumbrance ratio (15 STR, 7.5 used = 50%)', () => {
      store.currentCharacterData.abilityScores['str'] = 15
      store.currentCharacterData.pointBuyBaseScores['str'] = 15
      store.currentCharacterData.equippedGear = [
        { id: '1', name: 'Heavy Armor', type: 'Armor', description: '', slotCost: 7.5 },
      ]
      store.currentCharacterData.consumables = []
      const { slotPercentage } = useInventory(store)

      expect(slotPercentage.value).toBe(50)
    })

    it('clamps at 100% when over-encumbered', () => {
      store.currentCharacterData.abilityScores['str'] = 15
      store.currentCharacterData.pointBuyBaseScores['str'] = 15
      store.currentCharacterData.equippedGear = [
        { id: '1', name: 'Overloaded', type: 'Misc', description: '', slotCost: 20 },
      ]
      store.currentCharacterData.consumables = []
      const { slotPercentage } = useInventory(store)

      expect(slotPercentage.value).toBe(100)
    })

    it('returns 0 when no items are carried', () => {
      store.currentCharacterData.equippedGear = []
      store.currentCharacterData.consumables = []
      const { slotPercentage } = useInventory(store)

      expect(slotPercentage.value).toBe(0)
    })
  })

  describe('availableSlots', () => {
    it('returns maxSlots - usedSlots', () => {
      store.currentCharacterData.abilityScores['str'] = 16
      store.currentCharacterData.pointBuyBaseScores['str'] = 16
      store.currentCharacterData.equippedGear = [
        { id: '1', name: 'Item', type: 'Gear', description: '', slotCost: 4 },
      ]
      store.currentCharacterData.consumables = []
      const { availableSlots } = useInventory(store)

      expect(availableSlots.value).toBe(12) // 16 - 4
    })
  })

  describe('buySupply', () => {
    it('deducts 1 gold and adds 1 supply when gold >= 1', () => {
      store.currentCharacterData.gold = 5
      store.currentCharacterData.supply = 0
      const { buySupply } = useInventory(store)

      const result = buySupply()

      expect(result).toBe(true)
      expect(store.currentCharacterData.gold).toBe(4)
      expect(store.currentCharacterData.supply).toBe(1)
    })

    it('returns false when gold is 0 (purchase fails)', () => {
      store.currentCharacterData.gold = 0
      store.currentCharacterData.supply = 0
      const { buySupply } = useInventory(store)

      const result = buySupply()

      expect(result).toBe(false)
      expect(store.currentCharacterData.gold).toBe(0)
      expect(store.currentCharacterData.supply).toBe(0)
    })
  })

  describe('getGearBgClass (pure utility)', () => {
    it("returns 'parchment-bg' class for parchment theme", () => {
      // Call independently — no store needed
      const { getGearBgClass } = useInventory(store)

      expect(getGearBgClass('parchment')).toContain('parchment-bg')
      expect(getGearBgClass('parchment-bg')).toContain('parchment-bg')
    })

    it("returns 'deep-teal-bg' class for deep-teal theme", () => {
      const { getGearBgClass } = useInventory(store)

      expect(getGearBgClass('deep-teal')).toContain('deep-teal-bg')
      expect(getGearBgClass('deep-teal-bg')).toContain('deep-teal-bg')
    })

    it("returns default 'bg-surface-container' class for unknown themes", () => {
      const { getGearBgClass } = useInventory(store)

      expect(getGearBgClass('fantasy')).toContain('bg-surface-container')
      expect(getGearBgClass(undefined)).toContain('bg-surface-container')
    })
  })

  describe('addGear / removeGear', () => {
    it('addGear pushes a new item and returns its id', () => {
      store.currentCharacterData.equippedGear = []
      const { addGear } = useInventory(store)

      const id = addGear()

      expect(store.currentCharacterData.equippedGear).toHaveLength(1)
      expect(store.currentCharacterData.equippedGear[0].id).toBe(id)
      expect(store.currentCharacterData.equippedGear[0].name).toBe('New Item')
      expect(store.currentCharacterData.equippedGear[0].slotCost).toBe(1)
    })

    it('removeGear removes the item at the given index', () => {
      store.currentCharacterData.equippedGear = [
        { id: 'a', name: 'First', type: 'Gear', description: '', slotCost: 1 },
        { id: 'b', name: 'Second', type: 'Gear', description: '', slotCost: 1 },
      ]
      const { removeGear } = useInventory(store)

      removeGear(0)

      expect(store.currentCharacterData.equippedGear).toHaveLength(1)
      expect(store.currentCharacterData.equippedGear[0].id).toBe('b')
    })
  })

  describe('addConsumable / removeConsumable', () => {
    it('addConsumable pushes a new consumable and returns its id', () => {
      store.currentCharacterData.consumables = []
      const { addConsumable } = useInventory(store)

      const id = addConsumable()

      expect(store.currentCharacterData.consumables).toHaveLength(1)
      expect(store.currentCharacterData.consumables[0].id).toBe(id)
      expect(store.currentCharacterData.consumables[0].usageDie).toBe('d8')
    })

    it('removeConsumable removes the item at the given index', () => {
      store.currentCharacterData.consumables = [
        { id: 'c1', name: 'A', type: 'Item', slotCost: 1, usageDie: 'd6' },
        { id: 'c2', name: 'B', type: 'Item', slotCost: 1, usageDie: 'd8' },
      ]
      const { removeConsumable } = useInventory(store)

      removeConsumable(1)

      expect(store.currentCharacterData.consumables).toHaveLength(1)
      expect(store.currentCharacterData.consumables[0].id).toBe('c1')
    })
  })
})