import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import * as DND_RULES from '../data/rules'

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
  applySpeciesTraits,
  applyFeatureChoices,
  applyBackgroundBonuses,
  calculateDerivedStats,
  applyAllChanges,
  applyStartingEquipment,
} from '../utils/characterMutations'
import type { StartingEquipmentState } from '@/types/equipment'

import {
  initSupabase,
  fetchCharacterFromUrl,
  shareCharacterToSupabase,
  getSupabaseClient,
} from '@/infra'
import { generateCharacter as aiGenerate, loadAiSchema, getAiSchema } from '@/infra'
import { loadSchema, getSchema, validateCharacterData } from '@/domain'
import { calculateArmorClass } from '@/utils/acCalculator'
import { autoSeedAttacks } from '@/composables/useCombat'
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
  // Reactive boolean so UI components can bind to it without seeing the
  // actual Supabase client instance. The client itself is kept in a
  // module-level singleton (sharingService.ts) outside Vue's reactivity system.
  const isSupabaseReady = ref(false)
  const sourceCharacterId = ref<string | null>(null) // For shared characters

  // Modal states
  const isLoading = ref(false)
  const loadingText = ref('')
  const errorModal = ref({ show: false, errors: [] as string[] })
  const shareModal = ref({ show: false, url: '' })

  // Starting equipment selection state (creation-time only, not persisted)
  const startingEquipmentState = ref<StartingEquipmentState>({
    classOption: null,
    backgroundOption: null,
    resolvedClassChoices: [],
    selectedTrinket: null,
  })

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

  /**
   * Dynamically calculated Armor Class from equipped armor, shields, and DEX.
   * If the user has enabled manual AC override, the stored manual value is used.
   */
  const computedArmorClass = computed(() => {
    const char = currentCharacterData.value
    if (!char) return 10
    if (char.combat.isAcOverride) return char.combat.ac
    const dexMod = abilityMods.value.dex ?? 0
    return calculateArmorClass(char.equippedGear ?? [], dexMod)
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
    initSupabase()
    // Set isSupabaseReady so UI components can reactively bind to it
    // without ever seeing the actual Supabase client instance.
    isSupabaseReady.value = true

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

    // Apply full mutation pipeline (cleanup stale skills, apply class/background skills, features, derived stats)
    currentCharacterData.value = applyAllChanges(currentCharacterData.value)

    // Sync HP with calculated values
    // If hp_current matches the stored hp_max (or is new), update it to the calculated maxHp
    // This ensures new characters or those at full health get the correct calculated max HP
    const calculatedMax = maxHp.value
    const combat = currentCharacterData.value.combat
    if (combat.hp_current === combat.hp_max || combat.hp_current === undefined) {
      combat.hp_current = calculatedMax
    }
    combat.hp_max = calculatedMax

    // Auto-seed attacks from equipped weapons when attacks list is empty
    _autoSeedAttacksIfNeeded()
  }

  /**
   * Auto-populate attacks from equipped weapons when the attacks array is empty
   * but the character has weapons equipped. Only runs once — preserves user edits.
   */
  function _autoSeedAttacksIfNeeded(): void {
    const char = currentCharacterData.value
    if (!char) return

    const attacks = char.attacks || []
    if (attacks.length > 0) return

    const equippedGear = char.equippedGear || []
    const hasWeapons = equippedGear.some((g) => g.type === 'Weapon')
    if (!hasWeapons) return

    const mods = abilityMods.value
    char.attacks = autoSeedAttacks(equippedGear, mods)
  }

  function _migrateLegacyCharacter(data: unknown): CharacterData {
    return migrateCharacterData(data)
  }

  function _setupSpellcasting(): void {
    if (!currentCharacterData.value) return

    const features = currentCharacterData.value.features || []
    const hasSpellcasting = features.some(
      (f) =>
        (typeof f.casterType === 'string' && f.casterType !== 'none') || !!f.grantsSpells,
    )

    if (hasSpellcasting) {
      // Derive the casting ability from the character's class
      const ability = DND_RULES.getSpellcastingAbility(currentCharacterData.value.class)
      currentCharacterData.value.spellcasting = {
        ...(currentCharacterData.value.spellcasting ?? {}),
        ability,
      }
    } else if (!hasSpellcasting) {
      // Remove spellcasting object if no spellcasting source exists
      currentCharacterData.value.spellcasting = null
    }
  }

  async function loadCharacterFromUrl(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search)
    try {
      const result = await fetchCharacterFromUrl(getSupabaseClient(), urlParams)
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
    const client = getSupabaseClient()
    if (!client) {
      _showErrorModal(['Online sharing is not configured.'])
      return
    }
    if (!currentCharacterData.value) return

    _showLoading('Saving character to the archives...')
    try {
      const newId = await shareCharacterToSupabase(
        client,
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

  // --- Explicit Actions (replacing implicit watchers) ---

  /**
   * Apply a background change: set the background value, then pipe the
   * character through the full mutation pipeline (cleanup, background
   * skills, class skills, features, and derived stat recalculation).
   */
  function applyBackgroundChange(newBackground: string): void {
    if (!currentCharacterData.value) return
    currentCharacterData.value.background = newBackground
    currentCharacterData.value = applyAllChanges(currentCharacterData.value)
  }

  /**
   * Apply a class change: set the class value, then pipe the character
   * through the full mutation pipeline (cleanup, background skills,
   * class skills, features, and derived stat recalculation).
   */
  function applyClassChange(newClass: string): void {
    if (!currentCharacterData.value) return
    currentCharacterData.value.class = newClass
    currentCharacterData.value = applyAllChanges(currentCharacterData.value)
  }

  /**
   * Apply a species change: set the species value, clear any previous
   * subChoice (since sub-choices are species-specific), then pipe the
   * character through species traits and derived stat recalculation.
   */
  function applySpeciesChange(newSpecies: string): void {
    if (!currentCharacterData.value) return
    currentCharacterData.value.species = newSpecies
    currentCharacterData.value.subChoice = null
    currentCharacterData.value = applySpeciesTraits(currentCharacterData.value)
    currentCharacterData.value = calculateDerivedStats(currentCharacterData.value)
  }

  /**
   * Apply a subChoice selection: set the subChoice ID, merge the selected
   * subChoice's traits into the feature list, and recalculate derived stats.
   * This is a no-op if the current species has no subChoices defined.
   */
  function applySubChoice(subChoiceId: string): void {
    if (!currentCharacterData.value) return
    const species = currentCharacterData.value.species
    if (!species) return

    const speciesData = DND_RULES.SPECIES[species]
    if (!speciesData?.subChoices) return

    currentCharacterData.value.subChoice = subChoiceId
    currentCharacterData.value = applySpeciesTraits(currentCharacterData.value)
    currentCharacterData.value = calculateDerivedStats(currentCharacterData.value)
  }

  /**
   * Returns the display name for the current species, including the
   * sub-choice label when one is selected. E.g. "Goliath (Cloud Giant)".
   */
  const displaySpeciesName = computed(() => {
    const species = currentCharacterData.value?.species
    if (!species) return null

    const subChoice = currentCharacterData.value?.subChoice
    if (!subChoice) return species

    const speciesData = DND_RULES.SPECIES[species]
    const match = speciesData?.subChoices?.find((sc) => sc.id === subChoice)
    if (!match) return species

    return `${species} (${match.label})`
  })

  /**
   * Apply a feature choice selection: set the selected option IDs for a given
   * choice ID, validate against the class's featureChoices rule and catalog,
   * persist to the character's featureChoices record, and re-run calculations.
   *
   * Mirrors `applySubChoice`. Enforces count (resolved via `getEffectiveLevel`
   * with tier scaling) and prerequisites.
   */
  function applyFeatureChoice(choiceId: string, optionIds: string[]): void {
    if (!currentCharacterData.value) return
    const char = currentCharacterData.value
    const className = char.class
    if (!className) return

    const classData = DND_RULES.CLASSES[className]
    if (!classData?.featureChoices) return

    const choice = classData.featureChoices.find((c) => c.id === choiceId)
    if (!choice) return

    // Enforce count: resolve via getEffectiveLevel with tier scaling
    const tier = char.renownTier || 1
    const level = DND_RULES.getEffectiveLevel(tier)
    let maxCount = choice.count
    if (choice.scalesPerTier) {
      // Tier 1 = base count, Tier 2 = +1, Tier 3 = +2
      maxCount = choice.count + (tier - 1)
    }

    if (optionIds.length > maxCount) {
      // Truncate to the maximum allowed count
      optionIds = optionIds.slice(0, maxCount)
    }

    // Validate each option exists and meets prerequisites
    const validOptionIds: string[] = []
    for (const optionId of optionIds) {
      const option = choice.options.find((o) => o.id === optionId)
      if (!option) continue

      // Check prerequisite (basic format: "Fighter:level:3")
      if (option.prerequisite) {
        const parts = option.prerequisite.split(':')
        if (parts.length >= 3 && parts[0] === className && parts[1] === 'level') {
          const part2 = parts[2]
          if (part2 !== undefined) {
            const requiredLevel = parseInt(part2, 10)
            if (!isNaN(requiredLevel) && level < requiredLevel) continue
          }
        }
      }

      validOptionIds.push(optionId)
    }

    // Persist to character data
    if (!char.featureChoices) {
      char.featureChoices = {}
    }
    char.featureChoices[choiceId] = validOptionIds

    // Re-run calculations
    currentCharacterData.value = applyFeatureChoices(currentCharacterData.value)
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

  // --- Starting Equipment Actions ---

  /** Set the class equipment option (A, B, or C). */
  function selectClassEquipmentOption(option: 'A' | 'B' | 'C'): void {
    startingEquipmentState.value.classOption = option
  }

  /** Set the background equipment option (A or B). */
  function selectBackgroundEquipmentOption(option: 'A' | 'B'): void {
    startingEquipmentState.value.backgroundOption = option
  }

  /** Resolve a class equipment choice (e.g. "pick Handaxe or Light Hammer"). */
  function resolveEquipmentChoice(
    choiceIndex: number,
    itemId: string,
    quantity: number,
  ): void {
    // Remove any previous resolution for this choice index
    startingEquipmentState.value.resolvedClassChoices =
      startingEquipmentState.value.resolvedClassChoices.filter(
        (rc) => rc.choiceIndex !== choiceIndex,
      )

    startingEquipmentState.value.resolvedClassChoices.push({
      choiceIndex,
      selectedItemId: itemId,
      selectedQuantity: quantity,
    })
  }

  /** Set the selected trinket (by EquipmentItem.id). */
  function selectTrinket(trinketId: string | null): void {
    startingEquipmentState.value.selectedTrinket = trinketId
  }

  /**
   * Finalize starting equipment: resolve all selections and apply them
   * to the current character data. This adds gear, consumables, attack
   * entries, gold, and spellcasting focus features.
   */
  function confirmStartingEquipment(): void {
    if (!currentCharacterData.value) return

    currentCharacterData.value = applyStartingEquipment(
      currentCharacterData.value,
      startingEquipmentState.value,
    )

    // Recalculate derived stats to account for new attacks, AC, etc.
    currentCharacterData.value = calculateDerivedStats(currentCharacterData.value)
  }

  /** Reset the starting equipment state (e.g. when starting a new character). */
  function resetStartingEquipment(): void {
    startingEquipmentState.value = {
      classOption: null,
      backgroundOption: null,
      resolvedClassChoices: [],
      selectedTrinket: null,
    }
  }

  // --- Reactive AC recalculation ---
  // When equipped gear changes and the user is not manually overriding AC,
  // update combat.ac in place so it stays in sync with the computed value.
  // We only touch combat.ac (not the whole character object) to avoid a
  // recursive watcher loop.
  watch(
    () => currentCharacterData.value?.equippedGear,
    () => {
      const char = currentCharacterData.value
      if (!char || char.combat.isAcOverride) return
      const dexMod = getMod(char.abilityScores.dex ?? 10)
      char.combat.ac = calculateArmorClass(char.equippedGear ?? [], dexMod)
    },
    { deep: true },
  )

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
    // Supabase readiness flag (reactive boolean; the actual client is kept
    // in a module-level singleton outside Vue's reactivity system).
    isSupabaseReady,
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
    computedArmorClass,
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
    // Starting equipment state & actions
    startingEquipmentState,
    selectClassEquipmentOption,
    selectBackgroundEquipmentOption,
    resolveEquipmentChoice,
    selectTrinket,
    confirmStartingEquipment,
    resetStartingEquipment,
    // New explicit actions
    applyBackgroundChange,
    applyClassChange,
    applySpeciesChange,
    applySubChoice,
    applyFeatureChoice,
    applyBonusSelectionChange,
    recalculateAll,
    // Getters
    displaySpeciesName,
    // Modals
    closeErrorModal: () => (errorModal.value.show = false),
    closeShareModal: () => (shareModal.value.show = false),
  }
})