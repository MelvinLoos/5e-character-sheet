declare module '../services/characterService.js' {
  interface CharacterData {
    name: string
    title: string
    class: string | null
    level: number
    species: string | null
    background: string | null
    pointBuyBaseScores: Record<string, number>
    backgroundBonusSelections: {
      plusTwo: string | null
      plusOne: string | null
    }
    abilityScores: Record<string, number>
    profBonus: number
    proficiencies: {
      savingThrows: string[]
      skills: string[]
    }
    combat: {
      ac: number
      hp_max: number
      hp_current?: number
      speed: string
    }
    attacks: unknown[]
    features: unknown[]
    equipment: string
    personality: {
      traits: string
      ideal: string
      bond: string
      flaw: string
    }
    spellcasting: unknown
    spells: unknown[]
  }

  export function getLibrary(): Record<string, CharacterData[]>
  export function saveLibrary(library: Record<string, CharacterData[]>): void
  export function getMod(score: number): number
  export function formatMod(mod: number): string
  export const pointBuyCosts: Record<number, number>
  export function createBlankCharacter(): CharacterData
}

declare module '../../services/characterService.js' {
  export * from './characterService.js'
}

declare module '../services/characterService.js' {
  export * from './characterService.js'
}

declare module '@/services/characterService.js' {
  interface CharacterData {
    name: string
    title: string
    class: string | null
    level: number
    species: string | null
    background: string | null
    pointBuyBaseScores: Record<string, number>
    backgroundBonusSelections: {
      plusTwo: string | null
      plusOne: string | null
    }
    abilityScores: Record<string, number>
    profBonus: number
    proficiencies: {
      savingThrows: string[]
      skills: string[]
    }
    combat: {
      ac: number
      hp_max: number
      hp_current?: number
      speed: string
    }
    attacks: unknown[]
    features: unknown[]
    equipment: string
    personality: {
      traits: string
      ideal: string
      bond: string
      flaw: string
    }
    spellcasting: unknown
    spells: unknown[]
  }

  export function getLibrary(): Record<string, CharacterData[]>
  export function saveLibrary(library: Record<string, CharacterData[]>): void
  export function getMod(score: number): number
  export function formatMod(mod: number): string
  export const pointBuyCosts: Record<number, number>
  export function createBlankCharacter(): CharacterData
}
