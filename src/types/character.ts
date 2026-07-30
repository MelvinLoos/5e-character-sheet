/**
 * Canonical character-related data model interfaces.
 * Import from '@/types/character'.
 *
 * This is the single source of truth for all character entity shapes.
 * Components and stores MUST import from here, not define local interfaces.
 */

import type { AbilityKey, CasterType, DamageType, ActionType, FeatureType, MagicSchool } from './enums'

// ---------------------------------------------------------------------------
// Feature & Resource
// ---------------------------------------------------------------------------

/** Resource tracking metadata for features that consume limited uses. */
export interface ResourceData {
  resourceType: 'static' | 'scaling'
  value?: number
  scalingStat?: AbilityKey | 'pb' | null
  reset?: string
}

/** Legacy use-tracking shape, preserved for backward compatibility during migrations. */
export interface LegacyUses {
  total: number
  per: string
}

/** A character feature / trait — the canonical runtime shape used in CharacterData.
 * featureType, actionType, and casterType accept string in addition to their strict
 * unions to accommodate user input, rules-store data, and legacy JSON. */
export interface CharacterFeature {
  title: string
  desc: string
  key?: boolean
  source?: string
  featureType?: FeatureType | string
  actionType?: ActionType | string
  casterType?: CasterType | string | null
  uses?: LegacyUses | null
  resource?: ResourceData | null
  grantsSpells?: boolean
  grantedSpellLevels?: number[]
  abilityModifiers?: Record<string, number>
  prerequisite?: string
}

/** Runtime character feature — loose types for data loaded from external sources.
 * @deprecated Use CharacterFeature when possible; this is for read-only display of
 * features loaded from rules compendia or during migration. */
export interface DisplayFeature {
  title: string
  desc: string
  key?: boolean
  source?: string
  featureType?: string
  actionType?: string
  casterType?: string | null
  uses?: LegacyUses | null
  resource?: ResourceData | null
  grantsSpells?: boolean
  grantedSpellLevels?: number[]
  abilityModifiers?: Record<string, number>
}

// ---------------------------------------------------------------------------
// Spells & Spellcasting
// ---------------------------------------------------------------------------

/** A spell known or prepared by the character. */
export interface CharacterSpell {
  id?: string
  name: string
  level: number
  desc: string
  source?: string
  school?: MagicSchool
  castingTime?: string
  range?: string
  components?: string
  duration?: string
  concentration?: boolean
  ritual?: boolean
  prepared?: boolean
  classes?: string[]
}

/** Spellcasting tracking data attached to a character. */
export interface Spellcasting {
  ability?: AbilityKey
  slotsSpent?: Record<string, number>
}

// ---------------------------------------------------------------------------
// Attacks & Combat
// ---------------------------------------------------------------------------

/** A weapon or spell attack on the character sheet.
 * atkStat and dmgStat accept string to accommodate user input and legacy data;
 * they resolve to AbilityKey values at runtime. */
export interface Attack {
  id?: string
  name: string
  atkStat?: AbilityKey | string | null
  customAtkValue?: number
  dmgDie: string
  dmgStat?: AbilityKey | string | null
  customDmgValue?: number
  dmgBonus: number
  type: DamageType | string
  notes?: string
  weaponMastery?: string
}

/** Combat statistics block. */
export interface CombatStats {
  ac: number
  hp_max: number
  hp_current?: number
  speed: string
}

// ---------------------------------------------------------------------------
// Inventory & Economy
// ---------------------------------------------------------------------------

/** An equipped gear item. */
export interface EquippedGear {
  id: string
  name: string
  type: string
  description: string
  slotCost: number
  rarity?: string
  theme?: string
}

/** A consumable item (ammunition, potions, etc.) using usage dice. */
export interface Consumable {
  id: string
  name: string
  type: string
  slotCost: number
  usageDie: string
}

// ---------------------------------------------------------------------------
// Personality & Background
// ---------------------------------------------------------------------------

/** Roleplay personality fields. */
export interface Personality {
  traits: string
  ideal: string
  bond: string
  flaw: string
  notes?: string
}

/** Background ability score bonus selections.
 * Uses string rather than AbilityKey for the values because these come from
 * user input / dynamic dropdown selections that may be empty string or legacy values. */
export interface BackgroundBonusSelections {
  plusTwo: string | null
  plusOne: string | null
}

// ---------------------------------------------------------------------------
// Proficiencies
// ---------------------------------------------------------------------------

/** Character proficiency data.
 * savingThrows may contain runtime string values from legacy data,
 * so we keep it as string[] rather than AbilityKey[] for migration safety. */
export interface Proficiencies {
  savingThrows: string[]
  skills: string[]
}

// ---------------------------------------------------------------------------
// Character Data (root entity)
// ---------------------------------------------------------------------------

/** Complete character entity — the single source of truth for all character data. */
export interface CharacterData {
  name: string
  title: string
  jobInParty: string
  class: string | null
  renownTier: number
  renownMilestones: number
  species: string | null
  background: string | null
  pointBuyBaseScores: Record<string, number>
  backgroundBonusSelections: BackgroundBonusSelections
  abilityScores: Record<string, number>
  profBonus: number
  proficiencies: Proficiencies
  combat: CombatStats
  attacks: Attack[]
  features: CharacterFeature[]
  equipment: string
  personality: Personality
  spellcasting: Spellcasting | null
  spells: CharacterSpell[]
  gold: number
  supply: number
  influence: number
  inventorySlots: number
  equippedGear: EquippedGear[]
  consumables: Consumable[]
}