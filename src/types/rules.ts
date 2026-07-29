/**
 * Canonical rules-data interfaces used by src/data/rules.ts.
 * Import from '@/types/rules'.
 */

import type { AbilityKey, CasterType } from './enums'

/** A feature as defined in the D&D 5.5e rules data (class features, species traits, etc.). */
export interface RulesFeature {
  title: string
  desc: string
  key?: boolean
  featureType?: string
  actionType?: string
  casterType?: CasterType | null
  uses?: { total: number; per: string }
}

/** Class definition in the rules compendium. */
export interface ClassData {
  description?: string
  hitDice: number
  hitDiceAverage: number
  savingThrows: AbilityKey[]
  features: RulesFeature[]
}

/** Species definition in the rules compendium. */
export interface SpeciesData {
  description?: string
  speed: string
  traits: RulesFeature[]
}

/** Background definition in the rules compendium. */
export interface BackgroundData {
  description?: string
  skills: string[]
  abilityScoreIncrease: AbilityKey[]
  feature: RulesFeature
}

/** Alias for the nested spell slot records keyed by caster level. */
export type SpellSlotsByLevel = Record<number, Record<string, number>>