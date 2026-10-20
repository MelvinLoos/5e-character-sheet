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
/** Prerequisites a catalog option may require before it can be selected. */
export interface FeatureChoicePrerequisites {
  /** Minimum effective level (resolved via getEffectiveLevel(tier)). */
  minLevel?: number
  /** Requires another option by id (e.g. 'pact-of-the-blade', 'thirsting-blade'). */
  requiresInvocation?: string
  /** Requires a known Warlock cantrip that deals damage ('damage') or deals damage via an attack roll ('attack-roll'). */
  requiresCantrip?: 'damage' | 'attack-roll'
}

/** A single selectable option within a feature-choice catalog. */
export interface FeatureChoiceOption {
  id: string
  label: string
  description?: string
  /** Features granted when this option is selected. */
  traits: RulesFeature[]
  /** Inline string prerequisite (e.g. \"Warlock:level:1\") for simple gating. */
  prerequisite?: string
  /** Structured prerequisites for external catalog options. */
  prerequisites?: FeatureChoicePrerequisites
  /** e.g. Agonizing Blast, Eldritch Spear, Repelling Blast, Lessons of the First Ones. */
  repeatable?: boolean
}

/** A "choose N from catalog" rule attached to a class. */
export interface FeatureChoice {
  /** Unique identifier (e.g. "fighting-style", "eldritch-invocations"). */
  id: string
  /** Display label for the choice group. */
  label: string
  /** Optional flavour description. */
  description?: string
  /** Key into the catalog registry (e.g. 'invocations') — used for external catalogs. */
  catalogId?: string
  /** Fixed count, or count keyed by effective level (e.g. { 1: 1, 2: 3, 5: 5, ... }). */
  count: number | Record<number, number>
  /** If true and count is a number: Tier 2 = +1, Tier 3 = +2. */
  scalesPerTier?: boolean
  /** Inline options — used when options are defined directly on the class entry. */
  options?: FeatureChoiceOption[]
  /** Minimum Renown Tier (1-3) required before this choice is available. */
  minTier?: number
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

/** A single feature granted by an imported subclass at a specific level. */
export interface SubclassFeature {
  name: string
  level: number
  description: string
}

/** A subclass import definition — the authoring format used in JSON files. */
export interface SubclassImport {
  /** Display name of the subclass (e.g. "Champion", "Circle of the Moon"). */
  name: string
  /** The parent class this subclass belongs to (e.g. "Fighter", "Druid"). */
  parentClass: string
  /** Flavour text describing the subclass archetype. */
  description?: string
  /** Features granted by this subclass, each with a level gate. */
  features: SubclassFeature[]
}

/** Alias for the nested spell slot records keyed by caster level. */
export type SpellSlotsByLevel = Record<number, Record<string, number>>