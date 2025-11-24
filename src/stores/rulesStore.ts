import { defineStore } from 'pinia'
import {
  ABILITIES,
  SKILLS,
  PROFICIENCY_BONUS_PROGRESSION,
  SPELL_SLOT_PROGRESSION,
  CLASSES,
  SPECIES,
  BACKGROUNDS,
} from '@/data/rules.js'

interface RulesState {
  abilities: Record<string, string>
  skills: Record<string, string>
  proficiencyBonusProgression: Record<number, number>
  spellSlotProgression: Record<string, Record<number, Record<string, number>>>
  classes: Record<string, unknown>
  species: Record<string, unknown>
  backgrounds: Record<string, unknown>
  spells: unknown[]
  feats: unknown[]
}

export const useRulesStore = defineStore('rules', {
  state: (): RulesState => ({
    abilities: { ...ABILITIES },
    skills: { ...SKILLS },
    proficiencyBonusProgression: { ...PROFICIENCY_BONUS_PROGRESSION },
    spellSlotProgression: JSON.parse(JSON.stringify(SPELL_SLOT_PROGRESSION)),
    classes: JSON.parse(JSON.stringify(CLASSES)),
    species: JSON.parse(JSON.stringify(SPECIES)),
    backgrounds: JSON.parse(JSON.stringify(BACKGROUNDS)),
    spells: [],
    feats: [],
  }),

  getters: {
    // Expose current rules data for consumption by components
    allClasses: (state) => state.classes,
    allSpecies: (state) => state.species,
    allBackgrounds: (state) => state.backgrounds,
    allSpells: (state) => state.spells,
    allFeats: (state) => state.feats,
  },

  actions: {
    /**
     * Import data into a specific category, replacing existing data.
     * @param category - The data category to replace (e.g., 'spells', 'feats', 'classes')
     * @param dataArray - The array of data to import
     */
    importData(category: string, dataArray: unknown[]) {
      const validCategories = [
        'spells',
        'feats',
        'classes',
        'species',
        'backgrounds',
      ]

      if (!validCategories.includes(category)) {
        console.warn(`Invalid category: ${category}. Valid categories:`, validCategories)
        return
      }

      // For arrays (spells, feats), replace directly
      if (category === 'spells' || category === 'feats') {
        ;(this as any)[category] = [...dataArray]
        console.log(`Imported ${dataArray.length} items into ${category}`)
        return
      }

      // For objects (classes, species, backgrounds), convert array to keyed object
      // Assuming each item has a 'name' property
      const dataObject: Record<string, unknown> = {}
      for (const item of dataArray) {
        if (item && typeof item === 'object' && 'name' in item) {
          const name = (item as { name: string }).name
          dataObject[name] = item
        }
      }

      ;(this as any)[category] = dataObject
      console.log(`Imported ${Object.keys(dataObject).length} items into ${category}`)
    },

    /**
     * Reset a category to its original state (from rules.js)
     */
    resetCategory(category: string) {
      const defaults: Record<string, unknown> = {
        abilities: { ...ABILITIES },
        skills: { ...SKILLS },
        proficiencyBonusProgression: { ...PROFICIENCY_BONUS_PROGRESSION },
        spellSlotProgression: JSON.parse(JSON.stringify(SPELL_SLOT_PROGRESSION)),
        classes: JSON.parse(JSON.stringify(CLASSES)),
        species: JSON.parse(JSON.stringify(SPECIES)),
        backgrounds: JSON.parse(JSON.stringify(BACKGROUNDS)),
        spells: [],
        feats: [],
      }

      if (category in defaults) {
        ;(this as any)[category] = defaults[category]
        console.log(`Reset ${category} to default`)
      }
    },
  },
})
