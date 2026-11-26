/**
 * useSheetRoll — tap-to-roll from the sheet through the shared dice tray, plus
 * a polite screen-reader announcement channel (rendered once in App.vue).
 */
import { nextTick, ref } from 'vue'
import { formatMod } from '@/domain'
import { DICE_CANVAS_HOST_ID, canUse3d, useDiceRoller } from '@/composables/useDiceRoller'
import { useDiceTray } from '@/composables/useDiceTray'

/** Latest message for the global `aria-live="polite"` region. */
export const announcement = ref('')

export function announce(message: string): void {
  // Clear first so an identical consecutive message is still re-announced.
  announcement.value = ''
  void nextTick(() => {
    announcement.value = message
  })
}

/**
 * Resolve once the lazily-mounted dice canvas host is in the DOM. Bounded, and
 * skipped entirely when the engine can't use 3D (numeric fallback needs no host).
 */
export async function waitForCanvasHost(): Promise<void> {
  if (!canUse3d()) return
  for (let attempt = 0; attempt < 40; attempt++) {
    if (document.getElementById(DICE_CANVAS_HOST_ID)) return
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
}

export function useSheetRoll() {
  const { openTray } = useDiceTray()
  const { isRolling, roll } = useDiceRoller()

  /** Roll a d20 + `mod` for `label` (e.g. "Athletics") and announce the total. */
  async function rollCheck(label: string, mod: number): Promise<void> {
    if (isRolling.value) return
    openTray()
    await waitForCanvasHost()
    const summary = await roll(`#${DICE_CANVAS_HOST_ID}`, 20, 1, mod)
    announce(`${label}: ${summary.total} (d20 ${summary.values[0]} ${formatMod(mod)})`)
  }

  return { rollCheck, isRolling }
}
