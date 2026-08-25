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

/** An option within a class feature choice (e.g. a specific Fighting Style). */
export interface FeatureChoiceOption {
  /** Unique identifier (e.g. "defense", "dueling"). */
  id: string
  /** Display label (e.g. "Defense", "Dueling"). */
  label: string
  /** Optional flavour description. */
  description?: string
  /** Traits granted when this option is selected. */
  traits: RulesFeature[]
  /** Optional prerequisite string (e.g. "Fighter:level:3"). */
  prerequisite?: string
}

/** A class feature choice where the player picks one or more options.
 *  Examples: Fighting Style (Fighter/Paladin), Eldritch Invocations (Warlock). */
export interface FeatureChoice {
  /** Unique identifier (e.g. "fighting-style", "eldritch-invocations"). */
  id: string
  /** Display label for the choice group. */
  label: string
  /** Optional flavour description. */
  description?: string
  /** Base number of options the player may select. */
  count: number
  /** If true, count scales: Tier 2 = +1, Tier 3 = +2. */
  scalesPerTier?: boolean
  /** Available options for this choice. */
  options: FeatureChoiceOption[]
  /** Minimum Renown Tier (1-3) required before this choice is available. */
  minTier?: number
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
  /** Class feature choices where players pick from a catalogue of options. */
  featureChoices?: FeatureChoice[]
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