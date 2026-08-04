import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useCharacterStore } from './character'
import { useProgressionStore } from './progression'
import type { CharacterFeature } from '@/types/character'

/**
 * Spell Store — magic vitals, feature filtering, and usage-tracking helpers.
 *
 * Reads reactively from useCharacterStore() (features, spellcasting) and
 * useProgressionStore() (abilityMods, profBonus).
 *
 * These getters duplicate what currently lives in characterStore for
 * backward compatibility during Phase 3. Step 3.5 will remove the
 * duplicates from characterStore and update all consumers.
 */
export const useSpellStore = defineStore('spellStore', () => {
  const characterStore = useCharacterStore()
  const progressionStore = useProgressionStore()

  // ---------------------------------------------------------------------------
  // Magic Vitals
  // ---------------------------------------------------------------------------

  /** The casting ability key for the current character (e.g. 'int', 'wis', 'cha'). */
  const spellcastingAbility = computed<string>(() => {
    return characterStore.currentCharacterData?.spellcasting?.ability || 'int'
  })

  /** Spellcasting ability modifier. */
  const spellMod = computed<number>(() => {
    return progressionStore.abilityMods[spellcastingAbility.value] || 0
  })

  /** Spell save DC: 8 + proficiency bonus + spellcasting ability modifier. */
  const spellSaveDC = computed<number>(() => {
    return 8 + progressionStore.profBonus + spellMod.value
  })

  /** Spell attack bonus: proficiency bonus + spellcasting ability modifier. */
  const spellAttack = computed<number>(() => {
    return progressionStore.profBonus + spellMod.value
  })

  // ---------------------------------------------------------------------------
  // Feature Getters
  // ---------------------------------------------------------------------------

  /** Key (class/species-granted) features. */
  const keyFeatures = computed<CharacterFeature[]>(() => {
    return characterStore.currentCharacterData?.features.filter((f) => f.key) || []
  })

  /** Other (custom/user-added) features. */
  const otherFeatures = computed<CharacterFeature[]>(() => {
    return characterStore.currentCharacterData?.features.filter((f) => !f.key) || []
  })

  // ---------------------------------------------------------------------------
  // Feature Usage Calculation
  // ---------------------------------------------------------------------------

  /**
   * Calculate the maximum number of uses for a feature based on its
   * resource tracking configuration.
   *
   * - Static: returns the `value` field directly (minimum 0)
   * - Scaling (pb): returns current proficiency bonus
   * - Scaling (ability): returns the ability modifier (minimum 1)
   * - Legacy uses: returns uses.total for backward compatibility
   * - No resource: returns null
   */
  function getFeatureMaxUses(feature: unknown): number | null {
    if (!feature || typeof feature !== 'object' || feature === null) return null

    const f = feature as {
      uses?: { total?: number; per?: string } | null
      resource?: { resourceType?: string; value?: number; scalingStat?: string | null } | null
    }

    // Handle legacy 'uses' format for backward compatibility
    if (f.uses && !f.resource) {
      return f.uses.total || null
    }

    // No resource tracking
    if (!f.resource || !f.resource.resourceType) {
      return null
    }

    const { resourceType, value, scalingStat } = f.resource

    try {
      if (resourceType === 'static') {
        return Math.max(0, value || 0)
      }

      if (resourceType === 'scaling') {
        if (!scalingStat) return 1

        if (scalingStat === 'pb') {
          return progressionStore.profBonus || 2
        }

        const validAbilities = ['str', 'dex', 'con', 'int', 'wis', 'cha']
        if (validAbilities.includes(scalingStat)) {
          const abilityMod = progressionStore.abilityMods[scalingStat] || 0
          return Math.max(1, abilityMod)
        }
      }

      return 1
    } catch {
      return 1
    }
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * Initialize or clean up the spellcasting object on the character data.
   * Sets ability to 'int' if any feature grants spellcasting (via casterType
   * or grantsSpells) but no spellcasting object is present; nulls it if no
   * spellcasting source exists.
   */
  function setupSpellcasting(): void {
    const data = characterStore.currentCharacterData
    if (!data) return

    const features = data.features || []
    const hasSpellcasting = features.some(
      (f) =>
        (typeof f.casterType === 'string' && f.casterType !== 'none') || !!f.grantsSpells,
    )

    if (hasSpellcasting && !data.spellcasting) {
      data.spellcasting = { ability: 'int' }
    } else if (!hasSpellcasting) {
      data.spellcasting = null
    }
  }

  return {
    // Getters
    spellcastingAbility,
    spellMod,
    spellSaveDC,
    spellAttack,
    keyFeatures,
    otherFeatures,
    // Methods
    getFeatureMaxUses,
    setupSpellcasting,
  }
})