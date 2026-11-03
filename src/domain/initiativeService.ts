import { cloneCharacter, featuresToReset } from './restService'
import type { CharacterData } from '@/types/character'

/**
 * Initiative Service — pure initiative roll rules.
 */

export type RollMode = 'normal' | 'advantage' | 'disadvantage'

export interface InitiativeRoll {
  mode: RollMode
  mod: number
  /** Every d20 rolled (two for advantage/disadvantage). */
  rolls: number[]
  /** The d20 that counts. */
  kept: number
  total: number
}

/**
 * Assemble an InitiativeRoll from already-rolled d20 faces. Used by the 3D
 * dice roller so its result is stored in the exact same shape as a local roll.
 */
export function buildInitiativeRoll(mode: RollMode, mod: number, rolls: number[]): InitiativeRoll {
  const kept =
    mode === 'advantage' ? Math.max(...rolls) : mode === 'disadvantage' ? Math.min(...rolls) : rolls[0]!
  return { mode, mod, rolls, kept, total: kept + mod }
}

/** Roll d20 + modifier, taking the higher or lower of two dice for (dis)advantage. */
export function rollInitiative(
  mod: number,
  mode: RollMode = 'normal',
  rng: () => number = Math.random,
): InitiativeRoll {
  const d20 = () => Math.floor(rng() * 20) + 1
  const rolls = mode === 'normal' ? [d20()] : [d20(), d20()]
  return buildInitiativeRoll(mode, mod, rolls)
}

/** Reset features whose resource resets on Initiative, returning a new CharacterData. */
export function resetInitiativeFeatures(data: CharacterData): CharacterData {
  const next = cloneCharacter(data)
  for (const f of featuresToReset(next, ['Initiative'])) f.used = 0
  return next
}
