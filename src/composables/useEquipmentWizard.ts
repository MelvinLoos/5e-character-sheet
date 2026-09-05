/**
 * useEquipmentWizard — Shared starting-equipment wizard state.
 *
 * Extracted from the character store to reduce its interface width.
 * Uses module-level singletons so all callers share the same wizard state.
 *
 * The `finalizeEquipment` function returns updated CharacterData that
 * the caller (the store) assigns back to `currentCharacterData`.
 */
import { ref } from 'vue'
import type { StartingEquipmentState } from '@/types/equipment'
import type { CharacterData } from '@/types/character'
import {
  applyStartingEquipment,
  calculateDerivedStats,
} from '@/utils/characterMutations'

// Module-level singleton — shared across all consumers
const startingEquipmentState = ref<StartingEquipmentState>({
  classOption: null,
  backgroundOption: null,
  resolvedClassChoices: [],
  selectedTrinket: null,
})

export function useEquipmentWizard() {
  /** Set the class equipment option (A, B, or C). */
  function selectClassEquipmentOption(option: 'A' | 'B' | 'C'): void {
    startingEquipmentState.value.classOption = option
  }

  /** Set the background equipment option (A or B). */
  function selectBackgroundEquipmentOption(option: 'A' | 'B'): void {
    startingEquipmentState.value.backgroundOption = option
  }

  /** Resolve a class equipment choice (e.g. "pick Handaxe or Light Hammer"). */
  function resolveEquipmentChoice(
    choiceIndex: number,
    itemId: string,
    quantity: number,
  ): void {
    startingEquipmentState.value.resolvedClassChoices =
      startingEquipmentState.value.resolvedClassChoices.filter(
        (rc) => rc.choiceIndex !== choiceIndex,
      )

    startingEquipmentState.value.resolvedClassChoices.push({
      choiceIndex,
      selectedItemId: itemId,
      selectedQuantity: quantity,
    })
  }

  /** Set the selected trinket (by EquipmentItem.id). */
  function selectTrinket(trinketId: string | null): void {
    startingEquipmentState.value.selectedTrinket = trinketId
  }

  /**
   * Finalize starting equipment: resolve all wizard selections and apply
   * them to the given character data, returning the updated character.
   */
  function finalizeEquipment(charData: CharacterData): CharacterData {
    let result = applyStartingEquipment(charData, startingEquipmentState.value)
    // Recalculate derived stats to account for new attacks, AC, etc.
    result = calculateDerivedStats(result)
    return result
  }

  /** Reset the starting equipment state (e.g. when starting a new character). */
  function resetStartingEquipment(): void {
    startingEquipmentState.value = {
      classOption: null,
      backgroundOption: null,
      resolvedClassChoices: [],
      selectedTrinket: null,
    }
  }

  return {
    startingEquipmentState,
    selectClassEquipmentOption,
    selectBackgroundEquipmentOption,
    resolveEquipmentChoice,
    selectTrinket,
    finalizeEquipment,
    resetStartingEquipment,
  }
}