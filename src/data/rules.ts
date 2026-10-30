// A simplified library of D&D 2024 rules for the Heroes Guild Character Sheet.

// --- Type definitions for the exported rules data ---
// All canonical interfaces are now defined in @/types/rules and re-exported here.

// Re-export types that other files import from this module.
// RulesFeature is aliased as Feature for backward compatibility.
export type {
  RulesFeature as Feature,
  ClassData,
  SpeciesData,
  BackgroundData,
  SpellSlotsByLevel,
  SubChoice,
  FeatureChoice,
  FeatureChoiceOption,
  FeatureChoicePrerequisites,
} from '@/types/rules'

export * from './constants'
export * from './progressions'
export * from './classes'
export * from './classSpellcasting'
export * from './feats'
export * from './invocations'
export * from './species'
export * from './backgrounds'
