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
  baseSpells: unknown[]
  baseFeats: unknown[]
  guildSpells: unknown[]
  guildFeats: unknown[]
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
    baseSpells: [],
    baseFeats: [],
    guildSpells: [],
    guildFeats: [],
  }),

  getters: {
    // Expose current rules data for consumption by components
    allClasses: (state) => state.classes,
    allSpecies: (state) => state.species,
    allBackgrounds: (state) => state.backgrounds,
    allSpells: (state) => [...state.baseSpells, ...state.guildSpells],
    allFeats: (state) => [...state.baseFeats, ...state.guildFeats],
  },

  actions: {
    /**
     * Import data into a specific category, replacing existing data.
     * For spells and feats, data goes into the base layer (baseSpells/baseFeats),
     * leaving the guild overlay untouched.
     * @param category - The data category to replace (e.g., 'spells', 'feats', 'classes')
     * @param dataArray - The array of data to import
     */
    importData(category: string, dataArray: unknown[]) {
      const validCategories = ['spells', 'feats', 'classes', 'species', 'backgrounds'] as const

      if (!validCategories.includes(category as (typeof validCategories)[number])) {
        logger.warn(`Invalid category: ${category}. Valid categories:`, validCategories)
        return
      }

      // For arrays (spells, feats), map to base layer
      if (category === 'spells') {
        this.baseSpells = [...dataArray]
        set('dndRulesLibrary', JSON.parse(JSON.stringify(this.$state)))
        return
      }
      if (category === 'feats') {
        this.baseFeats = [...dataArray]
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
     * Inject guild-scoped spells into the overlay array.
     * This replaces any previously injected guild spells without affecting
     * the base layer (imported SRD, cached data, etc.).
     */
    injectGuildSpells(spells: unknown[]): void {
      this.guildSpells = [...spells]
    },

    /**
     * Inject guild-scoped feats into the overlay array.
     * This replaces any previously injected guild feats without affecting
     * the base layer.
     */
    injectGuildFeats(feats: unknown[]): void {
      this.guildFeats = [...feats]
    },

    /**
     * Remove all guild-scoped content from the store.
     * This clears the guild overlay without touching base data.
     * Safe to call when no guild content is present (idempotent).
     */
    stripGuildContent(): void {
      this.guildSpells = []
      this.guildFeats = []
    },

    /**
     * Reset a category to its original state (from rules.js).
     * For spells/feats, resets only the base layer — guild overlay
     * is managed separately by guildContentSyncStore.
     */
    resetCategory(category: string) {
      // Backward compatibility: map legacy 'spells'/'feats' to 'baseSpells'/'baseFeats'
      const mappedCategory =
        category === 'spells' ? 'baseSpells' :
        category === 'feats' ? 'baseFeats' :
        category

      const defaults: Partial<RulesState> = {
        abilities: { ...ABILITIES },
        skills: { ...SKILLS },
        proficiencyBonusProgression: { ...PROFICIENCY_BONUS_PROGRESSION },
        spellSlotProgression: JSON.parse(JSON.stringify(SPELL_SLOT_PROGRESSION)),
        classes: JSON.parse(JSON.stringify(CLASSES)),
        species: JSON.parse(JSON.stringify(SPECIES)),
        backgrounds: JSON.parse(JSON.stringify(BACKGROUNDS)),
        baseSpells: [],
        baseFeats: [],
      }

      if (mappedCategory in defaults) {
        // Use a generic typing approach to assign the value based on the key
        const resetKey = mappedCategory as keyof RulesState
        ;(this as RulesState)[resetKey] = defaults[resetKey] as never
        set('dndRulesLibrary', JSON.parse(JSON.stringify(this.$state)))
      }
    },

    /**
     * Load data from IndexedDB with state migration for old keys.
     *
     * Migration: previously, spells and feats were stored under the keys
     * `spells` and `feats`. After the dual-state refactor, these were renamed
     * to `baseSpells` and `baseFeats`. If the stored state contains the old
     * keys, their values are migrated to the new keys before merging.
     */
    async loadFromStorage(): Promise<void> {
      try {
        const storedState = await get<Record<string, unknown>>('dndRulesLibrary')
        if (storedState) {
          // Migrate old key names to new key names
          if ('spells' in storedState && !('baseSpells' in storedState)) {
            storedState.baseSpells = storedState.spells
            delete storedState.spells
          }
          if ('feats' in storedState && !('baseFeats' in storedState)) {
            storedState.baseFeats = storedState.feats
            delete storedState.feats
          }

          // Remove old keys if they exist alongside new keys (cleanup)
          if ('spells' in storedState) {
            delete storedState.spells
          }
          if ('feats' in storedState) {
            delete storedState.feats
          }

          // Merge stored state with current state utilizing the mutator function
          // to bypass TypeScript TS2769 generic DeepPartial incompatibility
          this.$patch((state) => {
            Object.assign(state, storedState)
          })
        }
      } catch (err) {
        logger.error('Failed to load rules store from IDB:', err)
      }
    },
  },
})