import { defineStore } from 'pinia'
import {
  ABILITIES,
  SKILLS,
  PROFICIENCY_BONUS_PROGRESSION,
  SPELL_SLOT_PROGRESSION,
  CLASSES,
  SPECIES,
  BACKGROUNDS,
} from '@/data/rules'
import { logger } from '@/utils/logger'
import { get, set } from 'idb-keyval'

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
      ] as const

      if (!validCategories.includes(category as typeof validCategories[number])) {
        logger.warn(`Invalid category: ${category}. Valid categories:`, validCategories)
        return
      }

      // For arrays (spells, feats), replace directly
      if (category === 'spells' || category === 'feats') {
        const key = category as 'spells' | 'feats'
        this[key] = [...dataArray]
        set('dndRulesLibrary', JSON.parse(JSON.stringify(this.$state)))
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

      const key = category as 'classes' | 'species' | 'backgrounds'
      this[key] = dataObject
      set('dndRulesLibrary', JSON.parse(JSON.stringify(this.$state)))
    },

    /**
     * Reset a category to its original state (from rules.js)
     */
    resetCategory(category: keyof RulesState) {
      const defaults: RulesState = {
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
        // Use a generic typing approach to assign the value based on the key
        const resetKey = category as keyof RulesState;
        (this as RulesState)[resetKey] = defaults[resetKey] as never;
        set('dndRulesLibrary', JSON.parse(JSON.stringify(this.$state)))
      }
    },

    /**
     * Load data from IndexedDB
     */
    async loadFromStorage(): Promise<void> {
      try {
        const storedState = await get<RulesState>('dndRulesLibrary')
        if (storedState) {
          // Merge stored state with current state
          this.$patch(storedState)
        }
      } catch (err) {
        logger.error('Failed to load rules store from IDB:', err)
      }
    }
  },
})
