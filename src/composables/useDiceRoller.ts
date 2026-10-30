/**
 * useDiceRoller — owns the lazily-loaded 3D dice engine.
 *
 * `@3d-dice/dice-box-threejs` (~700 KB min, bundles three.js + cannon-es) is
 * imported dynamically on the first roll, so it never enters the initial PWA
 * bundle. The library exposes no public `dispose()` and registers a `window`
 * resize listener, so exactly one instance is created per session and reused —
 * the tray is hidden rather than destroyed (see DiceTray.vue).
 */
import { ref } from 'vue'
import {
  buildNotation,
  clampDice,
  clampModifier,
  hapticPattern,
  rollDice,
  summarizeRoll,
  triggerHaptics,
  type RawRollResult,
  type RollSummary,
} from '@/domain/diceService'
import { useCelebration } from '@/composables/useCelebration'

/** Minimal surface of the engine we rely on. */
export interface DiceBoxInstance {
  initialize: () => Promise<void>
  roll: (notation: string) => Promise<RawRollResult>
  updateConfig: (config: Record<string, unknown>) => void
}

/**
 * The default theme (`white` colourset + `glass` material on a green-felt
 * surface) resolves to the engine's textureless "none" texture, so **no**
 * external assets are needed. Sounds stay off to keep the main thread free.
 */
const BOX_CONFIG = {
  sounds: false,
  shadows: true,
  theme_surface: 'green-felt',
  theme_colorset: 'white',
  theme_material: 'glass',
} as const

// Session-level singleton — one WebGL context, one resize listener.
let box: DiceBoxInstance | null = null
let pending: Promise<DiceBoxInstance> | null = null
let webglSupport: boolean | null = null

/** Values forced into the next roll by the e2e test hook. */
let nextRollOverride: number[] | null = null

/** Probe WebGL once per session (a probe context is released immediately). */
export function supportsWebGL(): boolean {
  if (webglSupport !== null) return webglSupport
  if (typeof document === 'undefined') return (webglSupport = false)
  try {
    const canvas = document.createElement('canvas')
    const context = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null
    context?.getExtension('WEBGL_lose_context')?.loseContext()
    webglSupport = context !== null
  } catch {
    webglSupport = false
  }
  return webglSupport
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** True when the tray should render tumbling 3D dice instead of an instant result. */
export function canUse3d(): boolean {
  return supportsWebGL() && !prefersReducedMotion()
}

async function createBox(container: string): Promise<DiceBoxInstance> {
  // The engine reads `container.clientWidth/clientHeight` in its constructor,
  // so the tray must be laid out before this runs.
  const { default: DiceBox } = await import('@3d-dice/dice-box-threejs')
  const instance = new DiceBox(container, BOX_CONFIG) as unknown as DiceBoxInstance
  await instance.initialize()
  return instance
}

async function getBox(container: string): Promise<DiceBoxInstance> {
  if (box) return box
  if (!pending) {
    pending = createBox(container)
      .then((instance) => (box = instance))
      .catch((error: unknown) => {
        // Allow a later retry instead of caching a rejected promise forever.
        pending = null
        throw error
      })
  }
  return pending
}

interface DiceTestHooks {
  setNextRoll: (values: number[]) => void
  clearNextRoll: () => void
}

const TEST_HOOKS_ENABLED =
  import.meta.env.DEV || import.meta.env.MODE === 'test' || import.meta.env.VITE_DICE_TEST_HOOK === 'true'

// e2e-only escape hatch: lets a Playwright spec force the next roll's faces so
// the crit overlay and haptics can be asserted deterministically. Never exposed
// in a production build (see playwright.config.ts / CI build env).
if (typeof window !== 'undefined' && TEST_HOOKS_ENABLED) {
  ;(window as Window & { __hgDiceTest?: DiceTestHooks }).__hgDiceTest = {
    setNextRoll: (values) => {
      nextRollOverride = values
    },
    clearNextRoll: () => {
      nextRollOverride = null
    },
  }
}

export function useDiceRoller() {
  const isRolling = ref(false)
  const lastRoll = ref<RollSummary | null>(null)
  /** True when the last roll used the physics-free fallback. */
  const isDegraded = ref(false)

  function takeOverride(count: number): number[] | undefined {
    const override = nextRollOverride
    nextRollOverride = null
    return override ? override.slice(0, count) : undefined
  }

  function finish(summary: RollSummary): RollSummary {
    lastRoll.value = summary
    triggerHaptics(hapticPattern(summary))
    if (summary.isNat20) useCelebration().trigger('crit')
    return summary
  }

  /**
   * Warm the engine up when the tray opens so the first roll tumbles instantly.
   * Failures are swallowed here — `roll()` reports them via `isDegraded`.
   */
  async function ensureReady(container: string): Promise<void> {
    if (!canUse3d()) return
    try {
      await getBox(container)
    } catch {
      isDegraded.value = true
    }
  }

  /**
   * Roll dice. `container` is a CSS selector for the canvas host; it is only
   * needed the first time (the instance is cached afterwards).
   */
  async function roll(container: string, faces: number, count = 1, modifier = 0): Promise<RollSummary> {
    const dice = clampDice(count)
    const mod = clampModifier(modifier)
    const predetermined = takeOverride(dice)
    isRolling.value = true
    try {
      if (canUse3d()) {
        try {
          const instance = await getBox(container)
          const raw = await instance.roll(buildNotation(dice, faces, mod, predetermined))
          isDegraded.value = false
          return finish(summarizeRoll(raw))
        } catch {
          // Engine failed (theme load, context loss, …) — fall through to numeric.
        }
      }
      isDegraded.value = true
      return finish(rollDice(dice, faces, mod, Math.random, predetermined))
    } finally {
      isRolling.value = false
    }
  }

  return { isRolling, lastRoll, isDegraded, ensureReady, roll }
}
