import * as DND_RULES from '../data/rules.js'

const STORAGE_KEY = 'dndCharacterLibrary'

export const getLibrary = () => JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
export const saveLibrary = (library) => localStorage.setItem(STORAGE_KEY, JSON.stringify(library))

export const getMod = (score) => Math.floor((score - 10) / 2)
export const formatMod = (mod) => (mod >= 0 ? `+${mod}` : mod.toString())

export const pointBuyCosts = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }

export const createBlankCharacter = () => {
  const defaultBackground = Object.keys(DND_RULES.BACKGROUNDS)[0] || null
  const defaultClass = Object.keys(DND_RULES.CLASSES)[0] || null
  const defaultSpecies = Object.keys(DND_RULES.SPECIES)[0] || null

  let defaultSelections = { plusTwo: null, plusOne: null }
  let backgroundFeature = []
  if (defaultBackground && DND_RULES.BACKGROUNDS[defaultBackground]) {
    const bgData = DND_RULES.BACKGROUNDS[defaultBackground]
    const bonusOptions = bgData.abilityScoreIncrease
    defaultSelections = { plusTwo: bonusOptions[0], plusOne: bonusOptions[1] }
    if (bgData.feature) backgroundFeature.push(bgData.feature)
  }

  let classFeatures = []
  if (defaultClass && DND_RULES.CLASSES[defaultClass] && DND_RULES.CLASSES[defaultClass].features) {
    classFeatures = DND_RULES.CLASSES[defaultClass].features
  }

  let speciesTraits = []
  if (
    defaultSpecies &&
    DND_RULES.SPECIES[defaultSpecies] &&
    DND_RULES.SPECIES[defaultSpecies].traits
  ) {
    speciesTraits = DND_RULES.SPECIES[defaultSpecies].traits
  }

  const baseScores = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }
  const finalScores = { ...baseScores }
  if (defaultSelections.plusTwo) finalScores[defaultSelections.plusTwo] += 2
  if (defaultSelections.plusOne) finalScores[defaultSelections.plusOne] += 1

  return {
    name: 'New Character',
    title: '',
    class: defaultClass,
    level: 1,
    species: defaultSpecies,
    background: defaultBackground,
    pointBuyBaseScores: baseScores,
    backgroundBonusSelections: defaultSelections,
    abilityScores: finalScores,
    profBonus: 2,
    proficiencies: {
      savingThrows: DND_RULES.CLASSES[defaultClass]?.savingThrows || [],
      skills: DND_RULES.BACKGROUNDS[defaultBackground]?.skills?.map(skill => skill.toLowerCase().replace(/ /g, '')) || [],
    },
    combat: { ac: 10, hp_max: 1, speed: DND_RULES.SPECIES[defaultSpecies]?.speed || '30ft' },
    attacks: [],
    features: [...speciesTraits, ...classFeatures, ...backgroundFeature],
    equipment: '',
    personality: { traits: '', ideal: '', bond: '', flaw: '' },
    spellcasting: null,
    spells: [],
  }
}
