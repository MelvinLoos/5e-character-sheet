/**
 * Dice Service — pure dice-roll rules and haptics.
 *
 * Mirrors `initiativeService.ts`: everything that is not rendering lives in
 * plain, injectable TypeScript so it can be unit-tested without a WebGL context
 * (jsdom has none).
 *
 * The 3D engine (`@3d-dice/dice-box-threejs`) is wrapped by `useDiceRoller`,
 * which feeds its aggregate result into `summarizeRoll`.
 */

/** Polyhedral dice offered by the tray, ascending. */
export const DICE_TYPES = [4, 6, 8, 10, 12, 20, 100] as const
export type DieFaces = (typeof DICE_TYPES)[number]

/** Cap simultaneous dice so main-thread cannon-es stepping stays smooth on phones. */
export const MAX_DICE = 10
/** Clamp the modifier so the tray stays usable with a phone keyboard. */
export const MAX_MODIFIER = 99

/** Haptic patterns (ms): short tap, triple pulse for a crit, long buzz for a fumble. */
export const HAPTIC_TAP = 40
export const HAPTIC_CRIT: number[] = [60, 30, 100]
export const HAPTIC_FUMBLE: number[] = [120]

/** A single settled die as reported by the engine. */
export interface RawDieResult {
  type?: string
  sides: number
  id?: number
  value: number
  label?: string
  reason?: string
}

/** One group of identical dice inside an aggregate result. */
export interface RawRollSet {
  num: number
  type: string
  sides: number
  rolls: RawDieResult[]
  total: number
}

/** Aggregate result shape resolved by `Box.roll()` (Roll20-style). */
export interface RawRollResult {
  notation: string
  sets: RawRollSet[]
  modifier: number
  total: number
}

/** Tray-friendly view of a settled roll. */
export interface RollSummary {
  /** Human-readable notation without the predetermined suffix, e.g. `2d6+3`. */
  notation: string
  faces: number
  values: number[]
  modifier: number
  total: number
  /** True only for a single d20 that landed on 20. */
  isNat20: boolean
  /** True only for a single d20 that landed on 1. */
  isNat1: boolean
}

/** Clamp a die count into `[1, MAX_DICE]`. */
export function clampDice(count: number): number {
  if (!Number.isFinite(count)) return 1
  return Math.min(MAX_DICE, Math.max(1, Math.trunc(count)))
}

/** Clamp a modifier into `[-MAX_MODIFIER, MAX_MODIFIER]`. */
export function clampModifier(modifier: number): number {
  if (!Number.isFinite(modifier)) return 0
  return Math.min(MAX_MODIFIER, Math.max(-MAX_MODIFIER, Math.trunc(modifier)))
}

/** `2d6+3` / `1d20-1` / `4d6` — the display form, without any predetermined suffix. */
export function formatNotation(count: number, faces: number, modifier = 0): string {
  const mod = modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : ''
  return `${count}d${faces}${mod}`
}

/**
 * Command string for the 3D engine. Predetermined values are appended as
 * `@v1,v2,…` **after** the modifier (`1d20+2@20`): the engine splits on `@`
 * before parsing the dice expression, so the modifier must come first.
 */
export function buildNotation(
  count: number,
  faces: number,
  modifier = 0,
  predetermined?: number[],
): string {
  const base = formatNotation(count, faces, modifier)
  return predetermined?.length ? `${base}@${predetermined.join(',')}` : base
}

function summarizeValues(faces: number, values: number[], modifier: number): RollSummary {
  const single = values.length === 1
  return {
    notation: formatNotation(values.length, faces, modifier),
    faces,
    values,
    modifier,
    total: values.reduce((sum, value) => sum + value, 0) + modifier,
    isNat20: faces === 20 && single && values[0] === 20,
    isNat1: faces === 20 && single && values[0] === 1,
  }
}

/** Flatten the engine's aggregate result into a tray-friendly summary. */
export function summarizeRoll(raw: RawRollResult): RollSummary {
  const rolls = raw.sets.flatMap((set) => set.rolls)
  const faces = rolls[0]?.sides ?? 0
  return summarizeValues(
    faces,
    rolls.map((roll) => roll.value),
    raw.modifier ?? 0,
  )
}

/**
 * Instant, physics-free roll used when WebGL is missing or the user prefers
 * reduced motion. `rng` is injectable so tests stay deterministic.
 */
export function rollDice(
  count: number,
  faces: number,
  modifier = 0,
  rng: () => number = Math.random,
  predetermined?: number[],
): RollSummary {
  const dice = clampDice(count)
  const values = Array.from({ length: dice }, (_, index) => {
    const forced = predetermined?.[index]
    if (forced !== undefined) return Math.min(faces, Math.max(1, Math.trunc(forced)))
    return Math.floor(rng() * faces) + 1
  })
  return summarizeValues(faces, values, clampModifier(modifier))
}

/** Haptic pattern for a settled roll. */
export function hapticPattern(summary: RollSummary): number | number[] {
  if (summary.isNat20) return HAPTIC_CRIT
  if (summary.isNat1) return HAPTIC_FUMBLE
  return HAPTIC_TAP
}

type VibrateFn = (pattern: number | number[]) => boolean

function defaultVibrate(): VibrateFn | undefined {
  if (typeof navigator === 'undefined') return undefined
  const vibrate = (navigator as Navigator & { vibrate?: VibrateFn }).vibrate
  return typeof vibrate === 'function' ? vibrate.bind(navigator) : undefined
}

/**
 * Fire a vibration pattern, degrading to a no-op on devices without
 * `navigator.vibrate` (e.g. iOS Safari). Never throws.
 */
export function triggerHaptics(pattern: number | number[], vibrate: VibrateFn | undefined = defaultVibrate()): boolean {
  if (!vibrate) return false
  try {
    return vibrate(pattern)
  } catch {
    return false
  }
}
