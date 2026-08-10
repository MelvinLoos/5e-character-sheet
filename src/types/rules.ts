/**
 * Canonical rules-data interfaces used by src/data/rules.ts.
 * Import from '@/types/rules'.
 */

import type { AbilityKey, FeatureType, ActionType } from './enums'

/** A feature as defined in the D&D 5.5e rules data (class features, species traits, etc.). */
export interface RulesFeature {
  title: string
  desc: string
  key?: boolean
  featureType?: FeatureType | string
  actionType?: ActionType | string
  uses?: { total: number; per: string }
  /** Minimum Renown Tier (1-3) required before this trait is gained. */
  minTier?: number
}

/** A sub-choice within a species: lineages (Elf), ancestries (Goliath), legacies (Tiefling). */
export interface SubChoice {
  /** Unique identifier (e.g. "high-elf", "drow", "cloud-giant"). */
  id: string
  /** Display label shown to the player (e.g. "High Elf", "Drow"). */
  label: string
  /** Optional flavour description for the sub-choice. */
  description?: string
  /** Traits granted by selecting this sub-choice. */
  traits: RulesFeature[]
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
  /** Optional sub-choices: lineages (Elf), ancestries (Goliath), legacies (Tiefling). */
  subChoices?: SubChoice[]
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