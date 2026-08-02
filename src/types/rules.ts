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

/**
 * Represents a "choose N from [list]" skill proficiency rule.
 * `from` may be a specific list of skill names or the literal string 'any'
 * to indicate the player may choose from any skill.
 */
export interface SkillChoice {
  count: number
  from: string[] | 'any'
}

/** Class definition in the rules compendium. */
export interface ClassData {
  description?: string
  hitDice: number
  hitDiceAverage: number
  savingThrows: AbilityKey[]
  features: RulesFeature[]
  /** Fixed skill proficiencies granted automatically by the class. */
  fixedSkills?: string[]
  /** Optional "choose N from [list]" skill proficiency rule. */
  skillChoices?: SkillChoice
}

/** Species definition in the rules compendium. */
export interface SpeciesData {
  description?: string
  speed: string
  traits: RulesFeature[]
}

import type { BackgroundEquipment } from './equipment'

/** Background definition in the rules compendium. */
export interface BackgroundData {
  description?: string
  /** Fixed skill proficiencies granted automatically by the background. */
  skills: string[]
  /** Optional "choose N from [list]" skill proficiency rule. */
  skillChoices?: SkillChoice
  abilityScoreIncrease: AbilityKey[]
  feature: RulesFeature
  equipment?: BackgroundEquipment
}

/** Alias for the nested spell slot records keyed by caster level. */
export type SpellSlotsByLevel = Record<number, Record<string, number>>