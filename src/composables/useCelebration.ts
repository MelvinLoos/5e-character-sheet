/**
 * useCelebration — global success-animation trigger.
 *
 * Module-level singleton state, rendered once by <CelebrationOverlay /> in
 * App.vue. Specified by Issue #66 (Delightful Reaction Animations); the crit
 * variant is consumed by the dice roller (Issue #69).
 *
 *   useCelebration().trigger('crit')
 */
import { ref } from 'vue'

export type CelebrationType = 'crit' | 'success' | 'save'

export interface CelebrationEvent {
  type: CelebrationType | null
  timestamp: number
}

const celebration = ref<CelebrationEvent>({ type: null, timestamp: 0 })

export function useCelebration() {
  function trigger(type: CelebrationType): void {
    celebration.value = { type, timestamp: Date.now() }
  }

  return { celebration, trigger }
}
