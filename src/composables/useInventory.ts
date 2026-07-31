import { computed } from 'vue'
import { useCharacterStore } from '@/stores/character'
import type { ComputedRef } from 'vue'

/**
 * Composable encapsulating D&D 5.5e inventory management logic.
 *
 * Extracts from EquipmentBlock.vue:
 * - Slot capacity calculation (STR-based, min 10)
 * - Encumbrance tracking (used slots, slot percentage)
 * - Supply purchasing (gold → supply exchange)
 * - Gear and consumable CRUD operations
 * - Theme-based gear background CSS class resolution
 *
 * @param characterStore - Optional pre-existing character store instance.
 *   If omitted, calls useCharacterStore() internally.
 */
export function useInventory(characterStore?: ReturnType<typeof useCharacterStore>) {
  const store = characterStore ?? useCharacterStore()

  // ---------------------------------------------------------------------------
  // Slot Capacity & Encumbrance
  // ---------------------------------------------------------------------------

  /** Current Strength score, defaulting to 10 if unavailable. */
  const strScore: ComputedRef<number> = computed(() => {
    return store.currentCharacterData.abilityScores['str'] || 10
  })

  /** Maximum inventory slots: STR score, clamped to minimum 15 (STR×15 lb for medium creature). */
  const maxSlots: ComputedRef<number> = computed(() => {
    return Math.max(15, strScore.value)
  })

  /** Total slots consumed by equipped gear and consumables. */
  const usedSlots: ComputedRef<number> = computed(() => {
    let cost = 0
    const gear = store.currentCharacterData.equippedGear || []
    const consumables = store.currentCharacterData.consumables || []
    for (const item of gear) {
      cost += item.slotCost || 0
    }
    for (const item of consumables) {
      cost += item.slotCost || 0
    }
    return Math.round(cost * 10) / 10
  })

  /** Encumbrance percentage: (usedSlots / maxSlots) * 100, clamped [0, 100], rounded to 1 decimal. */
  const slotPercentage: ComputedRef<number> = computed(() => {
    if (maxSlots.value === 0) return 0
    const percent = (usedSlots.value / maxSlots.value) * 100
    return Math.round(Math.min(100, Math.max(0, percent)) * 10) / 10
  })

  /** Remaining available inventory slots. */
  const availableSlots: ComputedRef<number> = computed(() => {
    return maxSlots.value - usedSlots.value
  })

  // ---------------------------------------------------------------------------
  // Economy
  // ---------------------------------------------------------------------------

  /**
   * Exchanges 1 gold for 1 supply.
   * @returns true if the purchase succeeded, false if gold < 1.
   */
  function buySupply(): boolean {
    if (store.currentCharacterData.gold >= 1) {
      store.currentCharacterData.gold -= 1
      store.currentCharacterData.supply = (store.currentCharacterData.supply || 0) + 1
      return true
    }
    return false
  }

  // ---------------------------------------------------------------------------
  // Gear CRUD
  // ---------------------------------------------------------------------------

  /**
   * Adds a new blank gear item to the equippedGear array.
   * @returns The UUID of the newly created item.
   */
  function addGear(): string {
    const id = crypto.randomUUID()
    store.currentCharacterData.equippedGear.push({
      id,
      name: 'New Item',
      type: 'Gear',
      description: 'Description',
      slotCost: 1,
      theme: 'default',
    })
    return id
  }

  /**
   * Removes a gear item at the given index.
   */
  function removeGear(idx: number): void {
    store.currentCharacterData.equippedGear.splice(idx, 1)
  }

  // ---------------------------------------------------------------------------
  // Consumable CRUD
  // ---------------------------------------------------------------------------

  /**
   * Adds a new blank consumable item to the consumables array.
   * @returns The UUID of the newly created item.
   */
  function addConsumable(): string {
    const id = crypto.randomUUID()
    store.currentCharacterData.consumables.push({
      id,
      name: 'New Consumable',
      type: 'Item',
      slotCost: 1,
      usageDie: 'd8',
    })
    return id
  }

  /**
   * Removes a consumable item at the given index.
   */
  function removeConsumable(idx: number): void {
    store.currentCharacterData.consumables.splice(idx, 1)
  }

  // ---------------------------------------------------------------------------
  // UI Utility (Pure)
  // ---------------------------------------------------------------------------

  /**
   * Maps a gear theme name to a CSS class string for background styling.
   * Pure function — no store dependency, fully testable in isolation.
   */
  function getGearBgClass(theme?: string): string {
    if (theme === 'parchment-bg' || theme === 'parchment') {
      return 'parchment-bg text-[#15130b]'
    }
    if (theme === 'deep-teal-bg' || theme === 'deep-teal') {
      return 'deep-teal-bg text-on-primary-container'
    }
    return 'bg-surface-container text-on-surface'
  }

  return {
    strScore,
    maxSlots,
    usedSlots,
    slotPercentage,
    availableSlots,
    buySupply,
    addGear,
    removeGear,
    addConsumable,
    removeConsumable,
    getGearBgClass,
  }
}