import { defineStore } from 'pinia'
import { ref, shallowRef, computed, watch } from 'vue'
import * as DND_RULES from '../data/rules'
import type { SupabaseClient } from '@supabase/supabase-js'

import {
  getLibrary as getLocalLibrary,
  saveLibrary as saveLocalLibrary,
  createBlankCharacter,
  getMod,
  pointBuyCosts,
} from '@/domain'
import type { CharacterData } from '@/domain'

import { logger } from '../utils/logger'
import {
  migrateCharacterData,
  applyBackgroundSkills,
  applyBackgroundFeature,
  applyClassFeatures,
  applySpeciesTraits,
  applyBackgroundBonuses,
  calculateDerivedStats,
  applyAllChanges,
} from '../utils/characterMutations'

import {
  initSupabase,
  fetchCharacterFromUrl,
  shareCharacterToSupabase,
} from '@/infra'
import { generateCharacter as aiGenerate, loadAiSchema, getAiSchema } from '@/infra'
import { loadSchema, getSchema, validateCharacterData } from '@/domain'
import { STORAGE_KEYS } from '../constants/storage-keys'

export const useCharacterStore = defineStore('character', () => {
  // --- STATE ---
  // Initialize with a blank character to avoid widespread null checks in templates/components
  const currentCharacterData = ref<CharacterData>(createBlankCharacter())
  const currentUserData = computed(() => currentCharacterData.value)
  const isEditing = ref(false)
  const characterLibrary = ref<Record<string, CharacterData[]>>(getLocalLibrary())
  const sessionName = ref('Uncategorized')
  const schema = computed(() => getSchema())
  const geminiSchema = computed(() => getAiSchema())
  // Use shallowRef so the Supabase client instance is stored as-is without Vue's
  // deep UnwrapRef expansion, which otherwise strips its nominal type properties.
  const supabaseClient = shallowRef<SupabaseClient | null>(null)
  const sourceCharacterId = ref<string | null>(null) // For shared characters

  // Modal states
  const isLoading = ref(false)
  const loadingText = ref('')
  const errorModal = ref({ show: false, errors: [] as string[] })
  const shareModal = ref({ show: false, url: '' })

  // --- GETTERS (Computed Properties) ---
  // These are INTERNAL-ONLY computed properties used by the store's own actions.
  // External consumers must use useProgressionStore and useSpellStore instead.

  const derivedLevel = computed(() => {
    if (!currentCharacterData.value) return 3
    const tier = currentCharacterData.value.renownTier || 1
    return DND_RULES.getEffectiveLevel(tier)
  })

  const abilityMods = computed(() => {
    if (!currentCharacterData.value) return {}
    return Object.fromEntries(
      Object.entries(currentCharacterData.value.abilityScores).map(([key, value]) => [
        key,
        getMod(value),
      ]),
    )
  })

  const profBonus = computed(() => {
    if (!currentCharacterData.value) return 2
    let prof = 2
    for (const levelThreshold in DND_RULES.PROFICIENCY_BONUS_PROGRESSION) {
      if (derivedLevel.value >= parseInt(levelThreshold)) {
        prof = DND_RULES.PROFICIENCY_BONUS_PROGRESSION[parseInt(levelThreshold)] ?? prof
      }
    }
    return prof
  })

  const maxHp = computed(() => {
    if (!currentCharacterData.value) return 1
    const { class: className } = currentCharacterData.value
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

  const spellSlots = computed<Record<string, number>>(() => {
    if (!currentCharacterData.value) return {}
    const features = currentCharacterData.value.features || []
    const spellcastingFeature = features.find(
      (f) => typeof f.casterType === 'string' && f.casterType !== 'none',
    )
    if (!spellcastingFeature?.casterType) return {}
    const level = derivedLevel.value
    const progression =
      DND_RULES.SPELL_SLOT_PROGRESSION[
        spellcastingFeature.casterType as keyof typeof DND_RULES.SPELL_SLOT_PROGRESSION
      ]
    return (progression?.[level] || {}) as Record<string, number>
  })

  const keyFeatures = computed(() => currentCharacterData.value?.features.filter((f) => f.key) || [])
  const otherFeatures = computed(() => currentCharacterData.value?.features.filter((f) => !f.key) || [])

  const spellcastingAbility = computed(() => currentCharacterData.value?.spellcasting?.ability || 'int')
  const spellMod = computed(() => abilityMods.value[spellcastingAbility.value] || 0)
  const spellSaveDC = computed(() => 8 + profBonus.value + spellMod.value)
  const spellAttack = computed(() => profBonus.value + spellMod.value)

  const pointBuyPointsUsed = computed(() => {
    if (!currentCharacterData.value) return 0
    let total = 0
    Object.values(currentCharacterData.value.pointBuyBaseScores).forEach((s) => (total += pointBuyCosts[s] ?? 0))
    return total
  })
  const pointBuyPointsRemaining = computed(() => 27 - pointBuyPointsUsed.value)
  const pointBuyCostForScore = computed(() => (score: number): number => pointBuyCosts[score] ?? 0)
  const pointBuyMaxForScore = computed(() => (score: number): boolean => {
    if (score < 8 || score >= 15) return false
    const cur = pointBuyCosts[score] ?? 0
    const nxt = pointBuyCosts[score + 1] ?? 0
    return pointBuyPointsUsed.value - cur + nxt <= 27
  })
  const isValidBonusSelection = computed(() => (stat: string, bonusType: '+2' | '+1'): boolean => {
    const s = currentCharacterData.value?.backgroundBonusSelections
    if (!s) return true
    return bonusType === '+2' ? s.plusOne !== stat : s.plusTwo !== stat
  })

  const initiativeMod = computed(() => abilityMods.value.dex ?? 0)
  const walkingSpeed = computed(() => {
    const spd = currentCharacterData.value?.combat.speed
    if (spd) return spd
    const sp = currentCharacterData.value?.species
    return sp ? DND_RULES.SPECIES[sp]?.speed ?? '30ft' : '30ft'
  })

  function getFeatureMaxUses(feature: unknown): number | null {
    if (!feature || typeof feature !== 'object' || feature === null) return null
    const f = feature as {
      uses?: { total?: number; per?: string } | null
      resource?: { resourceType?: string; value?: number; scalingStat?: string | null } | null
    }
    if (f.uses && !f.resource) return f.uses.total || null
    if (!f.resource || !f.resource.resourceType) return null
    const { resourceType, value, scalingStat } = f.resource
    try {
      if (resourceType === 'static') return Math.max(0, value || 0)
      if (resourceType === 'scaling') {
        if (!scalingStat) return 1
        if (scalingStat === 'pb') return profBonus.value || 2
        const valid = ['str', 'dex', 'con', 'int', 'wis', 'cha']
        if (valid.includes(scalingStat)) return Math.max(1, abilityMods.value[scalingStat] || 0)
      }
      return 1
    } catch { return 1 }
  }

  // --- ACTIONS (Methods) ---

  async function initStore(): Promise<void> {
    supabaseClient.value = initSupabase()

    await loadSchema()
    await loadAiSchema()

    // Priority: shared URL → unsaved draft → last loaded/saved character → blank
    await loadCharacterFromUrl()

    // Only fall back to draft/last character if no character was loaded from URL
    const urlParams = new URLSearchParams(window.location.search)
    if (!urlParams.get('id')) {
      // Try draft first (unsaved work-in-progress), then last saved character
      if (!_restoreDraft()) {
        _restoreLastCharacter()
      }
    }
  }

  function validateCharacter(data: unknown): { valid: boolean; errors: string[] } {
    return validateCharacterData(data)
  }

  function _showLoading(text: string): void {
    isLoading.value = true
    loadingText.value = text
  }
  function _hideLoading(): void {
    isLoading.value = false
  }

  // --- Draft Persistence Helpers ---

  function _saveDraft(): void {
    if (!currentCharacterData.value) return
    try {
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_DRAFT,
        JSON.stringify(currentCharacterData.value),
      )
    } catch (e) {
      logger.warn('Failed to save character draft to localStorage:', e)
    }
  }

  function _restoreDraft(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_DRAFT)
      if (!raw) return false
      const data = JSON.parse(raw)
      if (data && typeof data === 'object') {
        _setCharacter(data)
        return true
      }
    } catch (e) {
      logger.warn('Failed to restore character draft from localStorage:', e)
    }
    return false
  }

  function _clearDraft(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_DRAFT)
    } catch (e) {
      logger.warn('Failed to clear character draft from localStorage:', e)
    }
  }

  function _setCurrentCharacterId(session: string, name: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CHARACTER_ID, `${session}|${name}`)
    } catch (e) {
      logger.warn('Failed to set current character ID:', e)
    }
  }

  function _clearCurrentCharacterId(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_CHARACTER_ID)
    } catch (e) {
      logger.warn('Failed to clear current character ID:', e)
    }
  }

  function _restoreLastCharacter(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_CHARACTER_ID)
      if (!raw) return false
      const [session, charName] = raw.split('|')
      if (!session || !charName) return false
      const library = getLocalLibrary()
      const data = library[session]?.find((c: CharacterData) => c.name === charName)
      if (data) {
        _setCharacter(data)
        sessionName.value = session
        return true
      }
    } catch (e) {
      logger.warn('Failed to restore last character:', e)
    }
    return false
  }

  function _showErrorModal(errors: string[]): void {
    errorModal.value.errors = errors
    errorModal.value.show = true
  }

  function _setCharacter(data: unknown): void {
    // Migrate legacy character data to new format
    const migratedData = _migrateLegacyCharacter(data)

    // Assign after asserting it matches CharacterData shape (migration ensures required fields)
    currentCharacterData.value = migratedData as unknown as CharacterData
    isEditing.value = false
    sourceCharacterId.value = null // Reset source unless it's set by sharing

    // Setup spellcasting object if character has valid casterType
    _setupSpellcasting()

    // Ensure background skills are properly applied
    updateBackgroundSkills()

    // Sync HP with calculated values
    // If hp_current matches the stored hp_max (or is new), update it to the calculated maxHp
    // This ensures new characters or those at full health get the correct calculated max HP
    const calculatedMax = maxHp.value
    const combat = currentCharacterData.value.combat
    if (combat.hp_current === combat.hp_max || combat.hp_current === undefined) {
      combat.hp_current = calculatedMax
    }
    combat.hp_max = calculatedMax
  }

  function _migrateLegacyCharacter(data: unknown): CharacterData {
    return migrateCharacterData(data)
  }

  function _setupSpellcasting(): void {
    if (!currentCharacterData.value) return

    const features = currentCharacterData.value.features || []
    const spellcastingFeature = features.find((f) => f.casterType && f.casterType !== 'none')

    if (spellcastingFeature && !currentCharacterData.value.spellcasting) {
      // Set up spellcasting object with default ability
      currentCharacterData.value.spellcasting = {
        ability: 'int', // Default to Intelligence as specified
      }
    } else if (!spellcastingFeature) {
      // Remove spellcasting object if no valid casterType exists
      currentCharacterData.value.spellcasting = null
    }
  }

  async function loadCharacterFromUrl(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search)
    try {
      const result = await fetchCharacterFromUrl(supabaseClient.value, urlParams)
      if (result) {
        _showLoading('Fetching character from the archives...')
        _setCharacter(result.data)
        sourceCharacterId.value = result.id
      }
    } catch (error) {
      logger.error('Error loading character from URL:', error)
      _showErrorModal([`Could not load character: ${(error as Error).message}`])
      history.replaceState({}, '', window.location.pathname)
    } finally {
      _hideLoading()
    }
  }

  function loadCharacterFromLibrary(key: string): void {
    const [session, charName] = key.split('|')
    if (!session || !charName) return

    const data = characterLibrary.value[session]?.find((c: CharacterData) => c.name === charName)
    if (data) {
      _setCharacter(data)
      sessionName.value = session
      // Clear any stale draft and remember this as the last loaded character
      _clearDraft()
      _setCurrentCharacterId(session, charName)
    }
  }

  function handleFileLoad(event: Event): void {
    const target = event.target as HTMLInputElement
    const file = target?.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = e.target?.result
        if (typeof result !== 'string') return
        const data = JSON.parse(result)
        const { valid, errors } = validateCharacter(data)

        if (!valid) {
          _showErrorModal((errors as string[]) || [])
          return
        }
        _setCharacter(data)
        saveToLibrary() // Auto-save imported char
      } catch (error) {
        _showErrorModal([`Error loading file: ${(error as Error).message}`])
        logger.error('File load error:', error)
      }
    }
    reader.readAsText(file)
  }

  function saveToLibrary(): void {
    if (!currentCharacterData.value) return
    const session = sessionName.value.trim() || 'Uncategorized'
    const library = getLocalLibrary() // Get fresh copy
    if (!library[session]) library[session] = []

    const existingIndex = library[session].findIndex(
      (c: CharacterData) => c.name === currentCharacterData.value?.name,
    )
    if (existingIndex > -1) {
      library[session][existingIndex] = currentCharacterData.value
    } else {
      library[session].push(currentCharacterData.value)
    }

    saveLocalLibrary(library)
    characterLibrary.value = library // Update reactive state

    // Clear draft since character is now safely in library
    _clearDraft()
    // Remember this as the last loaded/saved character
    _setCurrentCharacterId(session, currentCharacterData.value.name)
  }

  function handleNewCharacter(): void {
    _clearDraft()
    _clearCurrentCharacterId()
    _setCharacter(createBlankCharacter())
    isEditing.value = true
  }

  function toggleEdit(): void {
    isEditing.value = !isEditing.value
  }

  async function generateCharacter(userPrompt: string): Promise<void> {
    _showLoading('The mists of creation are swirling...')
    try {
      const generatedData = await aiGenerate(userPrompt)
      const { valid, errors } = validateCharacter(generatedData.data)
      if (!valid) {
        logger.error('AI generated invalid data:', errors)
        _showErrorModal(
          ['The AI generated a character with some inconsistencies, but here it is:'].concat(
            (errors as string[]) || [],
          ),
        )

        // Recalculate derived stats when level changes (ensures profBonus, HP, spell slots, etc. update)
        watch(
          () => currentCharacterData.value?.renownTier,
          () => {
            recalculateAbilityScores()
          },
        )

        // Recalculate when ability scores change (to refresh ability mods and derived values)
        watch(
          () => currentCharacterData.value?.abilityScores,
          () => {
            recalculateAbilityScores()
          },
          { deep: true },
        )
      }

      _setCharacter({
        ...createBlankCharacter(),
        ...(generatedData.data as Record<string, unknown>),
      })
      saveToLibrary()
    } catch (error) {
      logger.error('Error generating character:', error)
      _showErrorModal([`Error generating character: ${(error as Error).message}`])
    } finally {
      _hideLoading()
    }
  }

  async function shareCharacter(): Promise<void> {
    if (!supabaseClient.value) {
      _showErrorModal(['Online sharing is not configured.'])
      return
    }
    if (!currentCharacterData.value) return

    _showLoading('Saving character to the archives...')
    try {
      const newId = await shareCharacterToSupabase(
        supabaseClient.value,
        currentCharacterData.value,
        sourceCharacterId.value,
      )

      const newUrl = `${window.location.origin}${window.location.pathname}?id=${newId}`

      shareModal.value.url = newUrl
      shareModal.value.show = true

      history.pushState({}, '', newUrl)
      sourceCharacterId.value = newId
    } catch (error) {
      logger.error('Error sharing character:', error)
      _showErrorModal([`Could not share character: ${(error as Error).message}`])
    } finally {
      _hideLoading()
    }
  }

  function exportCharacter(): void {
    if (!currentCharacterData.value) return
    const jsonString = JSON.stringify(currentCharacterData.value, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentCharacterData.value.name.toLowerCase().replace(/\s+/g, '_')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // --- Direct Data Mutations ---

  function updateCharacter(key: string, value: unknown): void {
    if (currentCharacterData.value) {
      ;(currentCharacterData.value as unknown as Record<string, unknown>)[key] = value
    }
  }

  function updateNested(key1: string, key2: string, value: unknown): void {
    if (currentCharacterData.value) {
      const obj = currentCharacterData.value as unknown as Record<string, unknown>
      const inner = obj[key1] as Record<string, unknown> | undefined
      if (inner) inner[key2] = value
    }
  }

  function adjustPointBuyScore(key: string, delta: number): void {
    if (!currentCharacterData.value) return
    const currentScore = currentCharacterData.value.pointBuyBaseScores[key] || 8
    const newScore = currentScore + delta
    let totalCost = 0
    Object.values(currentCharacterData.value.pointBuyBaseScores).forEach(
      (s) => (totalCost += pointBuyCosts[s] ?? 0),
    )
    const futureCost =
      totalCost - (pointBuyCosts[currentScore] ?? 0) + (pointBuyCosts[newScore] ?? 0)
    if (newScore >= 8 && newScore <= 15 && futureCost <= 27) {
      currentCharacterData.value.pointBuyBaseScores[key] = newScore
      recalculateAbilityScores()
    }
  }

  function recalculateAbilityScores(): void {
    const data = currentCharacterData.value
    if (!data) return
    const finalScores = { ...data.pointBuyBaseScores }
    if (data.backgroundBonusSelections.plusTwo) {
      const score = finalScores[data.backgroundBonusSelections.plusTwo]
      if (score !== undefined) {
        finalScores[data.backgroundBonusSelections.plusTwo] = score + 2
      }
    }
    if (data.backgroundBonusSelections.plusOne) {
      const score = finalScores[data.backgroundBonusSelections.plusOne]
      if (score !== undefined) {
        finalScores[data.backgroundBonusSelections.plusOne] = score + 1
      }
    }

    // Apply feature bonuses
    if (data.features) {
      data.features.forEach((feature) => {
        if (feature.abilityModifiers) {
          Object.entries(feature.abilityModifiers).forEach(([stat, bonus]) => {
            // Normalize stat key to lowercase just in case
            const normalizedStat = stat.toLowerCase()
            if (finalScores[normalizedStat] !== undefined && typeof bonus === 'number') {
              finalScores[normalizedStat] += bonus
            }
          })
        }
      })
    }

    data.abilityScores = finalScores

    // Also recalculate derived stats
    const oldMax = data.combat.hp_max
    const wasAtMax =
      data.combat.hp_current === oldMax ||
      data.combat.hp_current === undefined ||
      data.combat.hp_current === 1

    data.combat.hp_max = maxHp.value

    if (wasAtMax || (data.combat.hp_current ?? 0) > data.combat.hp_max) {
      data.combat.hp_current = data.combat.hp_max
    }

    // Setup spellcasting based on current features
    _setupSpellcasting()
  }

  // Helper function to update background skills
  function updateBackgroundSkills(): void {
    if (!currentCharacterData.value || !currentCharacterData.value.background) return

    const backgroundData = DND_RULES.BACKGROUNDS[currentCharacterData.value.background]
    if (!backgroundData || !backgroundData.skills) return

    // Get current skill proficiencies
    const currentSkills = new Set(currentCharacterData.value.proficiencies.skills)

    // Normalize background skill names (lowercase, no spaces)
    const backgroundSkills = backgroundData.skills.map((skill: string) =>
      skill.toLowerCase().replace(/ /g, ''),
    )

    // Add background skills to proficiencies if not already there
    backgroundSkills.forEach((skill: string) => {
      currentSkills.add(skill)
    })

    // Update character data
    currentCharacterData.value.proficiencies.skills = Array.from(currentSkills)
  }

  // --- Explicit Actions (replacing implicit watchers) ---

  /**
   * Apply a background change: set the background value, then pipe the
   * character through background skills, background feature, and derived
   * stat recalculation.
   */
  function applyBackgroundChange(newBackground: string): void {
    if (!currentCharacterData.value) return
    currentCharacterData.value.background = newBackground
    currentCharacterData.value = applyBackgroundSkills(currentCharacterData.value)
    currentCharacterData.value = applyBackgroundFeature(currentCharacterData.value)
    currentCharacterData.value = calculateDerivedStats(currentCharacterData.value)
  }

  /**
   * Apply a class change: set the class value, then pipe the character
   * through class features and derived stat recalculation.
   */
  function applyClassChange(newClass: string): void {
    if (!currentCharacterData.value) return
    currentCharacterData.value.class = newClass
    currentCharacterData.value = applyClassFeatures(currentCharacterData.value)
    currentCharacterData.value = calculateDerivedStats(currentCharacterData.value)
  }

  /**
   * Apply a species change: set the species value, then pipe the character
   * through species traits and derived stat recalculation.
   */
  function applySpeciesChange(newSpecies: string): void {
    if (!currentCharacterData.value) return
    currentCharacterData.value.species = newSpecies
    currentCharacterData.value = applySpeciesTraits(currentCharacterData.value)
    currentCharacterData.value = calculateDerivedStats(currentCharacterData.value)
  }

  /**
   * Apply background bonus selection changes by rebuilding ability scores
   * and recalculating derived stats.
   */
  function applyBonusSelectionChange(): void {
    if (!currentCharacterData.value) return
    currentCharacterData.value = applyBackgroundBonuses(currentCharacterData.value)
    currentCharacterData.value = calculateDerivedStats(currentCharacterData.value)
  }

  /**
   * Full recalculate: run ALL mutation functions in the correct pipeline
   * order (bonuses → skills → background feature → class features →
   * species traits → derived stats).
   */
  function recalculateAll(): void {
    if (!currentCharacterData.value) return
    currentCharacterData.value = applyAllChanges(currentCharacterData.value)
  }

  // --- Auto-save draft watcher (debounced deep watch) ---
  let draftTimer: ReturnType<typeof setTimeout> | null = null
  watch(
    currentCharacterData,
    () => {
      if (draftTimer) clearTimeout(draftTimer)
      draftTimer = setTimeout(() => {
        _saveDraft()
      }, 500)
    },
    { deep: true },
  )

  return {
    // State
    currentCharacterData,
    currentUserData,
    isEditing,
    characterLibrary,
    sessionName,
    schema,
    geminiSchema,
    supabaseClient,
    sourceCharacterId,
    isLoading,
    loadingText,
    errorModal,
    shareModal,
    // Getters (legacy compatibility — new code should use useProgressionStore / useSpellStore)
    abilityMods,
    profBonus,
    maxHp,
    derivedLevel,
    spellSlots,
    keyFeatures,
    otherFeatures,
    spellcastingAbility,
    spellMod,
    spellSaveDC,
    spellAttack,
    pointBuyPointsUsed,
    pointBuyPointsRemaining,
    pointBuyCostForScore,
    pointBuyMaxForScore,
    isValidBonusSelection,
    initiativeMod,
    walkingSpeed,
    getFeatureMaxUses,
    // Actions
    initStore,
    loadCharacterFromUrl,
    loadCharacterFromLibrary,
    handleFileLoad,
    saveToLibrary,
    handleNewCharacter,
    toggleEdit,
    generateCharacter,
    shareCharacter,
    exportCharacter,
    updateCharacter,
    updateNested,
    adjustPointBuyScore,
    recalculateAbilityScores,
    validateCharacter,
    // New explicit actions
    applyBackgroundChange,
    applyClassChange,
    applySpeciesChange,
    applyBonusSelectionChange,
    recalculateAll,
    // Modals
    closeErrorModal: () => (errorModal.value.show = false),
    closeShareModal: () => (shareModal.value.show = false),
  }
})
