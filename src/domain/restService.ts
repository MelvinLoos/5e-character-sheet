import { computeClassSpellSlots, detectCasterType } from './spellSlotService'
import type { CharacterData, CharacterFeature } from '@/types/character'

/**
 * Rest Service — pure 5e (2024) short/long rest rules.
 *
 * Every function takes a CharacterData snapshot and returns a result without
 * touching stores, so the store can snapshot, apply and undo a rest.
 */

/** Rules inputs the character data alone cannot provide. */
export interface RestContext {
  maxHp: number
  /** Total Hit Dice in the pool (the derived level). */
  level: number
  /** Hit die size, e.g. 8 for d8. */
  hitDie: number
  /** Fixed healing per die when taking the average. */
  hitDiceAverage: number
  conMod: number
}

export interface ShortRestOptions {
  hitDiceSpent: number
  useAverage: boolean
  rng?: () => number
}

/** What a rest would change, used by the confirmation modal and button states. */
export interface RestSummary {
  hpGained: number
  tempHpCleared: number
  hitDiceRegained: number
  /** Hit Dice available to spend (short rest only). */
  hitDiceAvailable: number
  /** Spell slot levels restored, e.g. ['level1', 'level2']. */
  slotLevels: string[]
  features: string[]
  deathSavesReset: boolean
  hasAnything: boolean
}

/** Deep copy; character data is plain JSON, and structuredClone rejects reactive proxies. */
export function cloneCharacter<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T
}

export const SHORT_REST_RESETS = ['Short Rest']
export const LONG_REST_RESETS = ['Short Rest', 'Long Rest', 'Day', 'Dawn']

/** Hit Dice regained on a long rest: half the pool, rounded down, minimum 1. */
export function hitDiceRegainedOnLongRest(total: number): number {
  return Math.max(1, Math.floor(total / 2))
}

/** Hit Dice still available to spend. */
export function hitDiceRemaining(data: CharacterData, ctx: RestContext): number {
  return Math.max(0, ctx.level - (data.combat.hit_dice_used ?? 0))
}

/** Expected healing for one Hit Die taken as the average (CON included, min 1). */
export function averageHitDieHealing(ctx: RestContext): number {
  return Math.max(1, ctx.hitDiceAverage + ctx.conMod)
}

/** HP healed by spending `count` Hit Dice: roll (or average) + CON per die, min 1 each. */
export function rollHitDiceHealing(
  count: number,
  ctx: RestContext,
  useAverage: boolean,
  rng: () => number = Math.random,
): number {
  let total = 0
  for (let i = 0; i < count; i++) {
    const base = useAverage ? ctx.hitDiceAverage : Math.floor(rng() * ctx.hitDie) + 1
    total += Math.max(1, base + ctx.conMod)
  }
  return total
}

function resetMatches(feature: CharacterFeature, resets: string[]): boolean {
  const reset = feature.resource?.reset ?? (feature.uses?.per ? legacyReset(feature.uses.per) : '')
  return resets.some((r) => r.toLowerCase() === reset.toLowerCase())
}

function legacyReset(per: string): string {
  const p = per.toLowerCase()
  if (p.includes('short')) return 'Short Rest'
  if (p.includes('long')) return 'Long Rest'
  if (p.includes('dawn')) return 'Dawn'
  if (p.includes('day')) return 'Day'
  return ''
}

function featuresToReset(data: CharacterData, resets: string[]): CharacterFeature[] {
  return data.features.filter((f) => (f.used ?? 0) > 0 && resetMatches(f, resets))
}

/**
 * Pact Magic slots restored by a short rest: the spent count at each level,
 * limited to the pact progression. Returns {} for non-pact casters.
 */
export function pactSlotsToRestore(
  features: CharacterFeature[],
  level: number,
  slotsSpent: Record<string, number>,
): Record<string, number> {
  if (detectCasterType(features) !== 'pact') return {}
  const pact = computeClassSpellSlots(features, level)
  const restore: Record<string, number> = {}
  for (const [key, max] of Object.entries(pact)) {
    const spent = Math.min(slotsSpent[key] ?? 0, max)
    if (spent > 0) restore[key] = spent
  }
  return restore
}

function hasDeathSaves(data: CharacterData): boolean {
  const ds = data.combat.death_saves
  return !!ds && (ds.successes > 0 || ds.failures > 0)
}

export function describeShortRest(data: CharacterData, ctx: RestContext): RestSummary {
  const slots = pactSlotsToRestore(
    data.features,
    ctx.level,
    data.spellcasting?.slotsSpent ?? {},
  )
  const features = featuresToReset(data, SHORT_REST_RESETS).map((f) => f.title)
  const hitDiceAvailable = hitDiceRemaining(data, ctx)
  const hpMissing = Math.max(0, ctx.maxHp - (data.combat.hp_current ?? ctx.maxHp))
  const slotLevels = Object.keys(slots)
  return {
    hpGained: 0,
    tempHpCleared: 0,
    hitDiceRegained: 0,
    hitDiceAvailable,
    slotLevels,
    features,
    deathSavesReset: false,
    hasAnything: slotLevels.length > 0 || features.length > 0 || (hitDiceAvailable > 0 && hpMissing > 0),
  }
}

export function describeLongRest(data: CharacterData, ctx: RestContext): RestSummary {
  const hp = data.combat.hp_current ?? ctx.maxHp
  const slotLevels = Object.entries(data.spellcasting?.slotsSpent ?? {})
    .filter(([, n]) => n > 0)
    .map(([k]) => k)
  const features = featuresToReset(data, LONG_REST_RESETS).map((f) => f.title)
  const used = data.combat.hit_dice_used ?? 0
  const hitDiceRegained = Math.min(used, hitDiceRegainedOnLongRest(ctx.level))
  const hpGained = Math.max(0, ctx.maxHp - hp)
  const tempHpCleared = data.combat.hp_temp ?? 0
  const deathSavesReset = hasDeathSaves(data)
  return {
    hpGained,
    tempHpCleared,
    hitDiceRegained,
    hitDiceAvailable: 0,
    slotLevels,
    features,
    deathSavesReset,
    hasAnything:
      hpGained > 0 ||
      tempHpCleared > 0 ||
      hitDiceRegained > 0 ||
      slotLevels.length > 0 ||
      features.length > 0 ||
      deathSavesReset,
  }
}

function resetDeathSaves(data: CharacterData): void {
  data.combat.death_saves = { successes: 0, failures: 0 }
}

function resetFeatures(data: CharacterData, resets: string[]): void {
  for (const f of featuresToReset(data, resets)) f.used = 0
}

/** Apply a short rest, returning a new CharacterData. */
export function applyShortRest(
  data: CharacterData,
  ctx: RestContext,
  options: ShortRestOptions,
): CharacterData {
  const next = cloneCharacter(data)
  const count = Math.max(0, Math.min(options.hitDiceSpent, hitDiceRemaining(next, ctx)))

  if (count > 0) {
    const healed = rollHitDiceHealing(count, ctx, options.useAverage, options.rng)
    const current = next.combat.hp_current ?? ctx.maxHp
    next.combat.hp_current = Math.min(ctx.maxHp, current + healed)
    next.combat.hit_dice_used = (next.combat.hit_dice_used ?? 0) + count
    if (next.combat.hp_current > 0) resetDeathSaves(next)
  }

  const restore = pactSlotsToRestore(next.features, ctx.level, next.spellcasting?.slotsSpent ?? {})
  if (next.spellcasting?.slotsSpent) {
    for (const [key, n] of Object.entries(restore)) {
      next.spellcasting.slotsSpent[key] = Math.max(0, (next.spellcasting.slotsSpent[key] ?? 0) - n)
    }
  }

  resetFeatures(next, SHORT_REST_RESETS)
  return next
}

/** Apply a long rest, returning a new CharacterData. */
export function applyLongRest(data: CharacterData, ctx: RestContext): CharacterData {
  const next = cloneCharacter(data)
  next.combat.hp_current = ctx.maxHp
  next.combat.hp_temp = 0
  next.combat.hit_dice_used = Math.max(
    0,
    (next.combat.hit_dice_used ?? 0) - hitDiceRegainedOnLongRest(ctx.level),
  )
  if (next.spellcasting) next.spellcasting.slotsSpent = {}
  resetFeatures(next, LONG_REST_RESETS)
  resetDeathSaves(next)
  return next
}
