/**
 * Canonical string literal unions and enums used throughout the application.
 * Import from '@types' or '@/types/enums' — not from component-local definitions.
 */

/** The five caster progression types in D&D 5.5e. */
export type CasterType = 'full' | 'half' | 'third' | 'pact' | 'none'

/** The six ability scores (lowercase, 3-letter keys). */
export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

/** Resource tracking modes for features. */
export type ResourceType = 'static' | 'scaling'

/**
 * Valid reset cadences for feature resources.
 * Normalized to PascalCase display strings via {@link normalizeReset}.
 */
export type ResetType =
  | 'Short Rest'
  | 'Long Rest'
  | 'Dawn'
  | 'Initiative'
  | 'Turn'
  | 'Round'
  | 'Encounter'
  | 'Day'
  | 'Week'
  | 'None'
  | 'Special'

/** Action economy classifications for features. */
export type ActionType =
  | 'Action'
  | 'Bonus Action'
  | 'Reaction'
  | 'Free Action'
  | 'No Action'
  | 'Passive'
  | 'Variable'

/** Feature classification tags. */
export type FeatureType =
  | 'Class Feature'
  | 'Species Trait'
  | 'Background Feature'
  | 'Feat'
  | 'Spellcasting'
  | 'Other'

/** The three damage types: physical damage categories for attacks. */
export type DamageType =
  | 'bludgeoning'
  | 'piercing'
  | 'slashing'
  | 'acid'
  | 'cold'
  | 'fire'
  | 'force'
  | 'lightning'
  | 'necrotic'
  | 'poison'
  | 'psychic'
  | 'radiant'
  | 'thunder'

/** Magic school classifications for spells. */
export type MagicSchool =
  | 'Abjuration'
  | 'Conjuration'
  | 'Divination'
  | 'Enchantment'
  | 'Evocation'
  | 'Illusion'
  | 'Necromancy'
  | 'Transmutation'

/** Spell components. */
export type SpellComponent = 'V' | 'S' | 'M'

/** Weapon mastery property tags. */
export type WeaponMastery =
  | 'Graze'
  | 'Nick'
  | 'Push'
  | 'Sap'
  | 'Slow'
  | 'Topple'
  | 'Vex'
  | 'Cleave'