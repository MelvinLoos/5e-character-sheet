/**
 * Feat-granted ability score increases.
 *
 * A feature's `abilityIncrease` lists alternatives; the player's picks live in
 * `abilityChoice` on each feature instance. Pure functions only.
 */
import type { AbilityKey } from '@/types/enums'
import type { AbilityChoice, AbilityIncreaseOption, CharacterFeature } from '@/types/character'

export const ABILITY_KEYS: readonly AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
export const DEFAULT_ABILITY_MAX = 20

type IncreaseHolder = Pick<CharacterFeature, 'abilityIncrease' | 'abilityChoice'>

const isAbilityKey = (v: unknown): v is AbilityKey =>
  typeof v === 'string' && (ABILITY_KEYS as readonly string[]).includes(v)

const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

function posInt(v: unknown, fallback: number): number {
  const n = Number(v)
  return Number.isInteger(n) && n > 0 ? n : fallback
}

function sanitizeOption(raw: unknown, shape: 'fiveTools' | 'structured'): AbilityIncreaseOption | null {
  if (!isRecord(raw)) return null
  const opt: AbilityIncreaseOption = {}

  const fixedSrc = shape === 'structured' ? raw.fixed : raw
  if (isRecord(fixedSrc)) {
    const fixed: Partial<Record<AbilityKey, number>> = {}
    for (const [k, v] of Object.entries(fixedSrc)) {
      const key = k.toLowerCase()
      if (isAbilityKey(key) && typeof v === 'number' && Number.isFinite(v) && v !== 0) fixed[key] = v
    }
    if (Object.keys(fixed).length) opt.fixed = fixed
  }

  if (isRecord(raw.choose)) {
    const from = (Array.isArray(raw.choose.from) ? raw.choose.from : [])
      .map((a) => String(a).toLowerCase())
      .filter(isAbilityKey)
    const unique = [...new Set(from)]
    if (unique.length) {
      const count = Math.min(posInt(raw.choose.count, 1), unique.length)
      opt.choose = { from: unique, count, amount: posInt(raw.choose.amount, 1) }
    }
  }

  if (typeof raw.max === 'number' && raw.max > 0) opt.max = raw.max
  return opt.fixed || opt.choose ? opt : null
}

function sanitizeList(raw: unknown, shape: 'fiveTools' | 'structured'): AbilityIncreaseOption[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const out = raw.map((o) => sanitizeOption(o, shape)).filter((o): o is AbilityIncreaseOption => !!o)
  return out.length ? out : undefined
}

/** Map a 5e.tools feat `ability` array to alternatives. Unknown keys are dropped. */
export function parseFiveToolsAbility(raw: unknown): AbilityIncreaseOption[] | undefined {
  return sanitizeList(raw, 'fiveTools')
}

/** Validate an already-structured `abilityIncrease` (e.g. from guild JSON). */
export function sanitizeAbilityIncrease(raw: unknown): AbilityIncreaseOption[] | undefined {
  return sanitizeList(raw, 'structured')
}

/** Is `choice` a complete, valid pick for `options`? */
export function isValidAbilityChoice(
  options: AbilityIncreaseOption[] | undefined,
  choice: AbilityChoice | undefined,
): boolean {
  const opt = options?.[choice?.option ?? -1]
  if (!opt || !choice) return false
  if (!opt.choose) return true
  const { from, count } = opt.choose
  return (
    choice.picks.length === count &&
    new Set(choice.picks).size === count &&
    choice.picks.every((p) => from.includes(p))
  )
}

/**
 * The bonuses a feature currently grants. Features with a single, fixed-only
 * alternative need no pick. Returns null while a required pick is missing.
 */
export function resolveAbilityIncrease(
  feature: IncreaseHolder,
): { bonuses: Record<string, number>; max: number } | null {
  const options = feature.abilityIncrease
  if (!options?.length) return null
  const index = feature.abilityChoice?.option ?? (options.length === 1 ? 0 : -1)
  const opt = options[index]
  if (!opt) return null

  const bonuses: Record<string, number> = { ...(opt.fixed ?? {}) }
  if (opt.choose) {
    if (!isValidAbilityChoice(options, feature.abilityChoice)) return null
    for (const pick of feature.abilityChoice!.picks) {
      bonuses[pick] = (bonuses[pick] ?? 0) + opt.choose.amount
    }
  }
  return { bonuses, max: opt.max ?? DEFAULT_ABILITY_MAX }
}

/** True when the feature offers a decision the player has not (validly) made. */
export function needsAbilityChoice(feature: IncreaseHolder): boolean {
  const options = feature.abilityIncrease
  if (!options?.length) return false
  if (options.length === 1 && !options[0]!.choose) return false
  return !isValidAbilityChoice(options, feature.abilityChoice)
}

/** Short label for badges, e.g. "+2 STR" or "+1 STR, +1 DEX". Empty while unresolved. */
export function describeAbilityIncrease(feature: IncreaseHolder): string {
  const r = resolveAbilityIncrease(feature)
  if (!r) return ''
  return Object.entries(r.bonuses)
    .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k.toUpperCase()}`)
    .join(', ')
}

/** Raise `score` by `bonus` up to `max`, never lowering a score already above it. */
export function applyCappedIncrease(score: number, bonus: number, max: number): number {
  return Math.max(score, Math.min(score + bonus, max))
}
