/**
 * useDiceTray — shared open/mounted state for the 3D dice tray.
 *
 * Module-level singletons (mirroring `useModals` / `useConfirm`) so surfaces
 * other than the floating FAB — e.g. the initiative tracker — can open the tray
 * and roll through the same lazily-loaded engine.
 */
import { ref } from 'vue'

/** The tray is mounted on first open and never unmounted (reuses the WebGL context). */
const isMounted = ref(false)
const isOpen = ref(false)

export function useDiceTray() {
  /** Mount the tray (if needed) and slide it open. */
  function openTray(): void {
    isMounted.value = true
    isOpen.value = true
  }

  function closeTray(): void {
    isOpen.value = false
  }

  return { isMounted, isOpen, openTray, closeTray }
}
