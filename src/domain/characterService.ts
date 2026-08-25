import * as DND_RULES from '../data/rules'
import type { RulesFeature } from '../types/rules'
import type {
  CharacterData,
} from '../types/character'
import { STORAGE_KEYS } from '../constants/storage-keys'

// Re-export CharacterData for backward compatibility (all consumers import from here)
export type { CharacterData } from '../types/character'

/**
 * Automatically migrates legacy character library storage to the new snake_case key.
 */
function migrateLegacyStorage(): void {
  const legacyData = localStorage.getItem('dndCharacterLibrary')
  if (legacyData && !localStorage.getItem(STORAGE_KEYS.CHARACTER_LIBRARY)) {
    localStorage.setItem(STORAGE_KEYS.CHARACTER_LIBRARY, legacyData)
    localStorage.removeItem('dndCharacterLibrary')
  }
}

export const saveLibrary = (library: Record<string, CharacterData[]>): void =>
  localStorage.setItem(STORAGE_KEYS.CHARACTER_LIBRARY, JSON.stringify(library))
export const getLibrary = (): Record<string, CharacterData[]> => {
  migrateLegacyStorage()
  const library = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHARACTER_LIBRARY) || 'null') || {}

  // Migrate characters in library to have the new fields
  Object.keys(library).forEach((key) => {
    library[key] = library[key].map((char: CharacterData) => ({
      ...char,
      gold: char.gold ?? 0,
      supply: char.supply ?? 0,
      influence: char.influence ?? 0,
      inventorySlots: char.inventorySlots ?? Math.max(10, char.abilityScores?.str || 10),
      equippedGear: char.equippedGear ?? [],
      consumables: char.consumables ?? [],
      jobInParty: char.jobInParty ?? '',
      subChoice: char.subChoice ?? null,
    }))
  })

  return library
}

export const getMod = (score: number): number => Math.floor((score - 10) / 2)
export const formatMod = (mod: number): string => (mod >= 0 ? `+${mod}` : mod.toString())

export const pointBuyCosts: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
}

export const createBlankCharacter = (): CharacterData => {
  const defaultBackground = Object.keys(DND_RULES.BACKGROUNDS)[0] || null
  const defaultClass = Object.keys(DND_RULES.CLASSES)[0] || null
  const defaultSpecies = Object.keys(DND_RULES.SPECIES)[0] || null

  let defaultSelections: { plusTwo: string | null; plusOne: string | null } = {
    plusTwo: null,
    plusOne: null,
  }
  const backgroundFeature: RulesFeature[] = []
  const defaultBackgroundData = defaultBackground
    ? DND_RULES.BACKGROUNDS[defaultBackground]
    : undefined
  if (defaultBackgroundData) {
    const bonusOptions = defaultBackgroundData.abilityScoreIncrease
    defaultSelections = { plusTwo: bonusOptions[0] ?? null, plusOne: bonusOptions[1] ?? null }
    if (defaultBackgroundData.feature) backgroundFeature.push(defaultBackgroundData.feature)
  }

  let classFeatures: RulesFeature[] = []
  const defaultClassData = defaultClass ? DND_RULES.CLASSES[defaultClass] : undefined
  if (defaultClassData?.features) {
    classFeatures = defaultClassData.features
  }

  let speciesTraits: RulesFeature[] = []
  const defaultSpeciesData = defaultSpecies ? DND_RULES.SPECIES[defaultSpecies] : undefined
  if (defaultSpeciesData?.traits) {
    speciesTraits = defaultSpeciesData.traits
  }

  const baseScores: Record<string, number> = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }
  const finalScores: Record<string, number> = { ...baseScores }
  if (defaultSelections.plusTwo) {
    finalScores[defaultSelections.plusTwo] = (finalScores[defaultSelections.plusTwo] ?? 0) + 2
  }
  if (defaultSelections.plusOne) {
    finalScores[defaultSelections.plusOne] = (finalScores[defaultSelections.plusOne] ?? 0) + 1
  }

  return {
    name: 'New Character',
    title: '',
    jobInParty: '',
    class: defaultClass,
    renownTier: 1,
    renownMilestones: 0,
    species: defaultSpecies,
    subChoice: null,
    featureChoices: {},
    background: defaultBackground,
    pointBuyBaseScores: baseScores,
    backgroundBonusSelections: defaultSelections,
    abilityScores: finalScores,
    profBonus: 2,
    proficiencies: {
      savingThrows: defaultClassData?.savingThrows || [],
      skills:
        defaultBackgroundData?.skills?.map((skill: string) =>
          skill.toLowerCase().replace(/ /g, ''),
        ) || [],
    },
    combat: {
      ac: 10,
      isAcOverride: false,
      hp_max: 1,
      hp_current: 1,
      speed: defaultSpeciesData?.speed || '30ft',
    },
    attacks: [],
    features: [
      ...speciesTraits,
      ...classFeatures,
      ...backgroundFeature,
    ] as CharacterData['features'],
    equipment: '',
    gold: 0,
    supply: 0,
    influence: 0,
    inventorySlots: Math.max(10, finalScores.str || 10), // Base slot calculation, can be updated later
    equippedGear: [],
    consumables: [],
    personality: { traits: '', ideal: '', bond: '', flaw: '', notes: '' },
    spellcasting: null,
    spells: [],
  }
}
