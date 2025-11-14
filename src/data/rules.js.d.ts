declare module '../data/rules.js' {
  export const ABILITIES: Record<string, string>

  export const SKILLS: Record<string, string>

  export const PROFICIENCY_BONUS_PROGRESSION: Record<number, number>

  export const SPELL_SLOT_PROGRESSION: {
    full: Record<number, Record<string, number>>
    half: Record<number, Record<string, number>>
    third: Record<number, Record<string, number>>
  }

  interface Feature {
    title: string
    desc: string
    key?: boolean
    featureType?: string
    actionType?: string
    casterType?: string | null
    resource?: {
      baseAmount: number
      scaling: string
      scalingAbility: string | null
      resetPer: string
    } | null
  }

  interface ClassData {
    hitDie: number
    hitDice?: number // Legacy property alias
    hitDiceAverage?: number
    primaryAbilities: string[]
    savingThrows: string[]
    features: Feature[]
    description?: string
  }

  interface SpeciesData {
    size: string
    speed: string
    traits: Feature[]
    description?: string
  }

  interface BackgroundData {
    skills: string[]
    abilityScoreIncrease: string[]
    feature: Feature
    description?: string
  }

  export const CLASSES: Record<string, ClassData>
  export const SPECIES: Record<string, SpeciesData>
  export const BACKGROUNDS: Record<string, BackgroundData>
}

declare module '../../data/rules.js' {
  export * from './rules.js'
}

declare module '@/data/rules.js' {
  export const ABILITIES: Record<string, string>
  export const SKILLS: Record<string, string>
  export const PROFICIENCY_BONUS_PROGRESSION: Record<number, number>
  export const SPELL_SLOT_PROGRESSION: {
    full: Record<number, Record<string, number>>
    half: Record<number, Record<string, number>>
    third: Record<number, Record<string, number>>
  }

  interface Feature {
    title: string
    desc: string
    key?: boolean
    featureType?: string
    actionType?: string
    casterType?: string | null
    resource?: {
      baseAmount: number
      scaling: string
      scalingAbility: string | null
      resetPer: string
    } | null
  }

  interface ClassData {
    hitDie: number
    hitDice?: number
    hitDiceAverage?: number
    primaryAbilities: string[]
    savingThrows: string[]
    features: Feature[]
    description?: string
  }

  interface SpeciesData {
    size: string
    speed: string
    traits: Feature[]
    description?: string
  }

  interface BackgroundData {
    skills: string[]
    abilityScoreIncrease: string[]
    feature: Feature
    description?: string
  }

  export const CLASSES: Record<string, ClassData>
  export const SPECIES: Record<string, SpeciesData>
  export const BACKGROUNDS: Record<string, BackgroundData>
}
