import { useCharacterStore } from '@/stores/character'
import { useConfirm } from '@/composables/useConfirm'
import { hasStartingEquipment } from '@/utils/characterMutations'

/**
 * Confirm-before-reset guard shared by the sheet header selects and the
 * creation guide. Changing class or background removes the starting equipment
 * the player chose, so ask first when there is any to lose.
 * Resolves true when the change may proceed.
 */
export function useSelectionChange() {
  const store = useCharacterStore()
  const { confirm } = useConfirm()

  async function confirmSelectionChange(
    field: 'class' | 'background',
    next: string,
  ): Promise<boolean> {
    if (next === store.currentCharacterData[field]) return true
    if (!hasStartingEquipment(store.currentCharacterData)) return true
    return confirm({
      title: `Change ${field}?`,
      message: `Changing your ${field} will remove the starting equipment you selected. Continue?`,
      confirmLabel: `Change ${field}`,
      danger: true,
    })
  }

  return { confirmSelectionChange }
}
