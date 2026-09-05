import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useCharacterStore } from './character'
import * as DND_RULES from '@/data/rules'
import { getMod, pointBuyCosts, computeSpellSlots } from '@/domain'
import { applyBackgroundBonuses } from '@/utils/characterMutations'
import type { CharacterFeature } from '@/types/character'

/**
 * Progression Store — derived stats, point-buy, and combat vitals.
 *
 * Reads reactively from useCharacterStore().currentCharacterData and
 * exposes computed getters for all derived character statistics.
 *
 * All getters are read-only views; mutations are performed by calling
 * characterStore actions or the action methods below.
 */
export const useProgressionStore = defineStore('progression', () => {
  const characterStore = useCharacterStore()

  // ---------------------------------------------------------------------------
  // Level & Proficiency
  // ---------------------------------------------------------------------------

  const derivedLevel = computed(() => {
    if (!characterStore.currentCharacterData) return 3
    const tier = characterStore.currentCharacterData.renownTier || 1
    return DND_RULES.getEffectiveLevel(tier)
  })

  const profBonus = computed(() => {
    if (!characterStore.currentCharacterData) return 2
    let prof = 2
    for (const levelThreshold in DND_RULES.PROFICIENCY_BONUS_PROGRESSION) {
      if (derivedLevel.value >= parseInt(levelThreshold)) {
        prof = DND_RULES.PROFICIENCY_BONUS_PROGRESSION[parseInt(levelThreshold)] ?? prof
      }
    }
    return prof
  })

  // ---------------------------------------------------------------------------
  // Ability Scores & Modifiers
  // ---------------------------------------------------------------------------

  const abilityMods = computed(() => {
    if (!characterStore.currentCharacterData) return {}
    return Object.fromEntries(
      Object.entries(characterStore.currentCharacterData.abilityScores).map(([key, value]) => [
        key,
        getMod(value),
      ]),
    )
  })

  const pointBuyPointsUsed = computed(() => {
    if (!characterStore.currentCharacterData) return 0
    let total = 0
    Object.values(characterStore.currentCharacterData.pointBuyBaseScores).forEach(
      (s) => (total += pointBuyCosts[s] ?? 0),
    )
    return total
  })

  const pointBuyPointsRemaining = computed(() => 27 - pointBuyPointsUsed.value)

  const pointBuyCostForScore = computed(() => (score: number): number => {
    return pointBuyCosts[score] ?? 0
  })

  const pointBuyMaxForScore = computed(() => (score: number): boolean => {
    if (score < 8 || score >= 15) return false
    const currentCost = pointBuyCosts[score] ?? 0
    const nextCost = pointBuyCosts[score + 1] ?? 0
    return pointBuyPointsUsed.value - currentCost + nextCost <= 27
  })

  const isValidBonusSelection = computed(() => (stat: string, bonusType: '+2' | '+1'): boolean => {
    const selections = characterStore.currentCharacterData?.backgroundBonusSelections
    if (!selections) return true
    if (bonusType === '+2') {
      return selections.plusOne !== stat
    }
    return selections.plusTwo !== stat
  })

  // ---------------------------------------------------------------------------
  // Combat Vitals
  // ---------------------------------------------------------------------------

  const maxHp = computed(() => {
    if (!characterStore.currentCharacterData) return 1
    const { class: className } = characterStore.currentCharacterData
    const classData = className ? DND_RULES.CLASSES[className] : undefined
    if (!classData) return 1

    const conMod = abilityMods.value.con ?? 0
    let hp = classData.hitDice + conMod
    if (derivedLevel.value > 1) {
      const hpGainPerLevel = classData.hitDiceAverage + conMod
      hp += (derivedLevel.value - 1) * Math.max(1, hpGainPerLevel)
    }
    return hp
  })

  const initiativeMod = computed(() => abilityMods.value.dex ?? 0)

  const walkingSpeed = computed(() => {
    const speed = characterStore.currentCharacterData?.combat.speed
    if (speed) return speed
    const species = characterStore.currentCharacterData?.species
    return species ? DND_RULES.SPECIES[species]?.speed ?? '30ft' : '30ft'
  })

  /**
   * Total spell slots for the character — the single source of truth.
   *
   * Additively merges class-based progression (from SPELL_SLOT_PROGRESSION)
   * with feat/trait-granted spells (e.g. Magic Initiate). Both the interactive
   * sheet and the printable sheet consume this exact value so they can never
   * diverge.
   */
  const spellSlots = computed<Record<string, number>>(() => {
    if (!characterStore.currentCharacterData) return {}
    const features = (characterStore.currentCharacterData.features || []) as CharacterFeature[]
    return computeSpellSlots(features, derivedLevel.value)
  })

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  function adjustPointBuyScore(key: string, delta: number): void {
    const data = characterStore.currentCharacterData
    if (!data) return
    const currentScore = data.pointBuyBaseScores[key] || 8
    const newScore = currentScore + delta
    let totalCost = 0
    Object.values(data.pointBuyBaseScores).forEach(
      (s) => (totalCost += pointBuyCosts[s] ?? 0),
    )
    const futureCost =
      totalCost - (pointBuyCosts[currentScore] ?? 0) + (pointBuyCosts[newScore] ?? 0)
    if (newScore >= 8 && newScore <= 15 && futureCost <= 27) {
      data.pointBuyBaseScores[key] = newScore
      recalculateAbilityScores()
    }
  }

  function recalculateAbilityScores(): void {
    const data = characterStore.currentCharacterData
    if (!data) return
    // Apply background bonuses to rebuild ability scores
    const updated = applyBackgroundBonuses(data)
    data.abilityScores = updated.abilityScores

    // Recalculate HP
    const oldMax = data.combat.hp_max
    const wasAtMax =
      data.combat.hp_current === oldMax ||
      data.combat.hp_current === undefined ||
      data.combat.hp_current === 1

    data.combat.hp_max = maxHp.value

    if (wasAtMax || (data.combat.hp_current ?? 0) > data.combat.hp_max) {
      data.combat.hp_current = data.combat.hp_max
    }

    // Setup spellcasting based on current features (inlined to avoid circular deps)
    const features = data.features || []
    const hasSpellcasting = features.some(
      (f) =>
        (typeof f.casterType === 'string' && f.casterType !== 'none') || !!f.grantsSpells,
    )
    if (hasSpellcasting) {
      const ability = DND_RULES.getSpellcastingAbility(data.class)
      data.spellcasting = { ...(data.spellcasting ?? {}), ability }
    } else {
      data.spellcasting = null
    }
  }

  function applyTierChange(newTier: number): void {
    if (!characterStore.currentCharacterData) return
    characterStore.currentCharacterData.renownTier = newTier
    recalculateAbilityScores()
  }

  return {
    // Getters
    derivedLevel,
    profBonus,
    abilityMods,
    maxHp,
    initiativeMod,
    walkingSpeed,
    spellSlots,
    pointBuyPointsUsed,
    pointBuyPointsRemaining,
    pointBuyCostForScore,
    pointBuyMaxForScore,
    isValidBonusSelection,
    // Actions
    adjustPointBuyScore,
    recalculateAbilityScores,
    applyTierChange,
  }
})