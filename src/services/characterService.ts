import * as DND_RULES from '../data/rules'
import type { Feature } from '../data/rules'

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
  attacks: Array<{
    id?: string
    name: string
    atkStat?: string | null
    customAtkValue?: number
    dmgDie: string
    dmgStat?: string | null
    customDmgValue?: number
    dmgBonus: number
    type: string
    notes?: string
    weaponMastery?: string
  }>
  features: Array<{
    title: string
    desc: string
    key?: boolean
    source?: string
    featureType?: string
    actionType?: string
    uses?: { total: number; per: string } | null
    resource?: {
      resourceType: string
      value?: number
      scalingStat?: string | null
      reset?: string
    } | null
    casterType?: string | null
    grantsSpells?: boolean
    grantedSpellLevels?: number[]
    abilityModifiers?: Record<string, number>
    [key: string]: unknown
  }>
  equipment: string
  personality: {
    traits: string
    ideal: string
    bond: string
    flaw: string
    notes?: string
  }
  spellcasting: { ability?: string } | null
  spells: Array<{
    name: string
    level: number
    desc: string
    source?: string
    school?: string
    castingTime?: string
    range?: string
    components?: string
    duration?: string
    concentration?: boolean
  }>
  gold: number
  supply: number
  influence: number
  inventorySlots: number
  equippedGear: Array<{
    id: string
    name: string
    type: string
    description: string
    slotCost: number
    rarity?: string
    theme?: string
  }>
  consumables: Array<{
    id: string
    name: string
    type: string
    slotCost: number
    usageDie: string
  }>
}

const STORAGE_KEY = 'dndCharacterLibrary'

export const saveLibrary = (library: Record<string, CharacterData[]>): void =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(library))
export const getLibrary = (): Record<string, CharacterData[]> => {
  const library = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {}
  
  // Migrate characters in library to have the new fields
  Object.keys(library).forEach(key => {
    library[key] = library[key].map((char: CharacterData) => ({
      ...char,
      gold: char.gold ?? 0,
      supply: char.supply ?? 0,
      influence: char.influence ?? 0,
      inventorySlots: char.inventorySlots ?? Math.max(10, char.abilityScores?.str || 10),
      equippedGear: char.equippedGear ?? [],
      consumables: char.consumables ?? [],
      jobInParty: char.jobInParty ?? ''
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
  const backgroundFeature: Feature[] = []
  const defaultBackgroundData = defaultBackground
    ? DND_RULES.BACKGROUNDS[defaultBackground]
    : undefined
  if (defaultBackgroundData) {
    const bonusOptions = defaultBackgroundData.abilityScoreIncrease
    defaultSelections = { plusTwo: bonusOptions[0] ?? null, plusOne: bonusOptions[1] ?? null }
    if (defaultBackgroundData.feature) backgroundFeature.push(defaultBackgroundData.feature)
  }

  let classFeatures: Feature[] = []
  const defaultClassData = defaultClass ? DND_RULES.CLASSES[defaultClass] : undefined
  if (defaultClassData?.features) {
    classFeatures = defaultClassData.features
  }

  let speciesTraits: Feature[] = []
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
