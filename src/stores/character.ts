import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
// @ts-expect-error - JS module without types
import * as DND_RULES from '../data/rules.js'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
// @ts-expect-error - JS module without types
import { generateCharacterViaGemini } from '../services/apiService.js'
import {
  getLibrary as getLocalLibrary,
  saveLibrary as saveLocalLibrary,
  createBlankCharacter,
  getMod,
  pointBuyCosts,
  // @ts-expect-error - JS module without types
} from '../services/characterService.js'
import { migrateUsesToResource } from '../utils/migrations'

// Type interfaces
interface CharacterData {
  name: string
  title: string
  class: string | null
  level: number
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
}

// Minimal Ajv-like interface for compile-time typing (we don't import Ajv runtime typings)
interface AjvLike {
  compile: (
    schema: unknown,
  ) => ((data: unknown) => boolean) & { errors?: Array<{ message?: string } | null> }
}

export const useCharacterStore = defineStore('character', () => {
  // --- STATE ---
  // Initialize with a blank character to avoid widespread null checks in templates/components
  const currentCharacterData = ref<CharacterData>(createBlankCharacter())
  const isEditing = ref(false)
  const characterLibrary = ref<Record<string, CharacterData[]>>(getLocalLibrary())
  const sessionName = ref('Uncategorized')
  const schema = ref<object | null>(null)
  const geminiSchema = ref<object | null>(null)
  const ajv = ref<AjvLike | null>(null)
  const supabaseClient = ref<SupabaseClient | null>(null)
  const sourceCharacterId = ref<string | null>(null) // For shared characters

  // Modal states
  const isLoading = ref(false)
  const loadingText = ref('')
  const errorModal = ref({ show: false, errors: [] as string[] })
  const shareModal = ref({ show: false, url: '' })

  // --- GETTERS (Computed Properties) ---

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
      if (currentCharacterData.value.level >= parseInt(levelThreshold)) {
        prof = DND_RULES.PROFICIENCY_BONUS_PROGRESSION[levelThreshold]
      }
    }
    return prof
  })

  const maxHp = computed(() => {
    if (!currentCharacterData.value) return 1
    const { level, class: className } = currentCharacterData.value
    const classData = DND_RULES.CLASSES[className]
    if (!classData) return 1

    const conMod = abilityMods.value.con
    let hp = classData.hitDice + conMod
    if (level > 1) {
      const hpGainPerLevel = classData.hitDiceAverage + conMod
      hp += (level - 1) * Math.max(1, hpGainPerLevel)
    }
    return hp
  })

  const keyFeatures = computed(
    () => currentCharacterData.value?.features.filter((f) => f.key) || [],
  )
  const otherFeatures = computed(
    () => currentCharacterData.value?.features.filter((f) => !f.key) || [],
  )

  const spellcastingAbility = computed(
    () => currentCharacterData.value?.spellcasting?.ability || 'int',
  )

  const spellMod = computed(() => abilityMods.value[spellcastingAbility.value] || 0)

  const spellSaveDC = computed(() => 8 + profBonus.value + spellMod.value)

  const spellAttack = computed(() => profBonus.value + spellMod.value)

  const pointBuyPointsUsed = computed(() => {
    if (!currentCharacterData.value) return 0
    let total = 0
    Object.values(currentCharacterData.value.pointBuyBaseScores).forEach(
      (s) => (total += pointBuyCosts[s]),
    )
    return total
  })

  const pointBuyPointsRemaining = computed(() => 27 - pointBuyPointsUsed.value)

  // Helper function to calculate feature maximum uses based on 2024 resource system
  function getFeatureMaxUses(feature: unknown) {
    if (!feature || !currentCharacterData.value) return null
    if (typeof feature !== 'object' || feature === null) return null
    const f = feature as {
      uses?: { total?: number; per?: string } | null
      resource?: { resourceType?: string; value?: number; scalingStat?: string | null } | null
    }

    // Handle legacy 'uses' format for backward compatibility
    if (f.uses && !f.resource) {
      return f.uses.total || null
    }

    // Handle new 'resource' format
    if (!f.resource || !f.resource.resourceType) {
      return null // No resource tracking
    }

    const { resourceType, value, scalingStat } = f.resource

    try {
      if (resourceType === 'static') {
        return Math.max(0, value || 0)
      }

      if (resourceType === 'scaling') {
        if (!scalingStat) return 1 // Fallback if stat not specified

        if (scalingStat === 'pb') {
          return profBonus.value || 2 // Fallback to level 1 PB
        }

        // Handle ability score scaling
        const validAbilities = ['str', 'dex', 'con', 'int', 'wis', 'cha']
        if (validAbilities.includes(scalingStat)) {
          const abilityMod = abilityMods.value[scalingStat] || 0
          return Math.max(1, abilityMod) // Minimum 1 use
        }
      }

      // Fallback for unknown configurations
      return 1
    } catch (error) {
      console.warn('Error calculating feature max uses:', error)
      return 1
    }
  } // --- ACTIONS (Methods) ---

  async function initStore() {
    // Init Supabase
    const SUPABASE_URL = 'https://hqnxqotwtzeheydnaaio.supabase.co'
    const SUPABASE_ANON_KEY =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxbnhxb3R3dHplaGV5ZG5hYWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTk5MjIsImV4cCI6MjA3NjE3NTkyMn0.0zB-cPMBx-SJkZyu0_MgGoz71xvrp-83r1tUEVg9MeQ'

    if ((SUPABASE_URL as string) !== 'YOUR_SUPABASE_PROJECT_URL') {
      try {
        supabaseClient.value = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        console.log('Supabase client initialized.')
      } catch (e) {
        console.error('Error initializing Supabase client:', (e as Error).message)
      }
    } else {
      console.warn('Supabase credentials not found. Online sharing will be disabled.')
    }

    // Init AJV - skip dynamic window-based loading to avoid casting to `any` here.
    // If Ajv is required at runtime, prefer bundling/importing it explicitly.
    try {
      // If a global Ajv is present, we could initialize it here. For now, warn and continue.
      if (typeof window !== 'undefined' && (window as unknown)) {
        // noop - placeholder to avoid unused variable warnings
      }
      console.warn('Ajv not loaded. Validation will be limited.')
    } catch (e) {
      console.warn('Ajv initialization skipped.', e)
    }

    // Load Schema
    try {
      const response = await fetch('/schema.json')
      if (!response.ok) throw new Error('Network response was not ok for schema.json')
      schema.value = await response.json()
      console.log('Character schema loaded.')
    } catch (e) {
      console.error('Error loading schema.json:', e)
      console.warn('AI character generation will be disabled.')
    }

    // Load Gemini-compatible schema
    try {
      const response = await fetch('/gemini-schema.json')
      if (!response.ok) throw new Error('Network response was not ok for gemini-schema.json')
      geminiSchema.value = await response.json()
      console.log('Gemini schema loaded.')
    } catch (e) {
      console.error('Error loading gemini-schema.json:', e)
      console.warn('AI character generation will be disabled.')
    }

    // Load character from URL if present
    await loadCharacterFromUrl()
  }

  function validateCharacter(data: unknown) {
    if (!ajv.value || !schema.value) {
      console.warn('AJV or schema not initialized, skipping validation.')
      return { valid: true }
    }
    if (!ajv.value || !schema.value) {
      console.warn('AJV not initialized properly; skipping validation.')
      return { valid: true }
    }
    const validate = ajv.value.compile(schema.value)
    const valid = validate(data)
    if (valid) {
      return { valid: true, errors: [] }
    }
    const errorMessages = (validate.errors || [])
      .map((err) => err?.message)
      .filter(Boolean) as string[]
    return { valid: false, errors: [...new Set(errorMessages)] }
  }

  function _showLoading(text: string) {
    isLoading.value = true
    loadingText.value = text
  }
  function _hideLoading() {
    isLoading.value = false
  }

  function _showErrorModal(errors: string[]) {
    errorModal.value.errors = errors
    errorModal.value.show = true
  }

  function _setCharacter(data: unknown) {
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

  function _migrateLegacyCharacter(data: unknown) {
    // Create a copy to avoid mutating the original
    let migrated: Record<string, unknown> = { ...(data as Record<string, unknown>) }

    // Convert legacy `uses` into the new `resource` shape when applicable
    migrated = migrateUsesToResource(migrated) as Record<string, unknown>

    // Add missing backgroundBonusSelections if not present
    if (!migrated.backgroundBonusSelections) {
      migrated.backgroundBonusSelections = {
        plusTwo: null,
        plusOne: null,
      }
    }

    // Add missing pointBuyBaseScores if not present
    if (!migrated.pointBuyBaseScores) {
      // If we have final ability scores, try to reverse-engineer base scores
      if (migrated.abilityScores) {
        migrated.pointBuyBaseScores = { ...(migrated.abilityScores as Record<string, number>) }

        // Subtract background bonuses if we can determine them
        const background = migrated.background
        if (background && DND_RULES.BACKGROUNDS[background]) {
          // For legacy files, we can't know which bonuses were selected, so leave as-is
        }
      } else {
        // Fallback to default 8s
        migrated.pointBuyBaseScores = {
          str: 8,
          dex: 8,
          con: 8,
          int: 8,
          wis: 8,
          cha: 8,
        }
      }
    }

    // Ensure abilityScores exists
    if (!migrated.abilityScores) {
      migrated.abilityScores = { ...(migrated.pointBuyBaseScores as Record<string, number>) }
    }

    // Add missing proficiencies structure if not present
    if (!migrated.proficiencies) {
      migrated.proficiencies = {
        skills: migrated.skills || [],
        savingThrows: migrated.savingThrows || [],
      }
    }

    // Ensure features array exists
    if (!migrated.features) {
      migrated.features = []
    }

    // Add missing spellcasting feature for spellcasting classes
    if (migrated.class && migrated.spellcasting) {
      const hasSpellcastingFeature =
        Array.isArray(migrated.features) &&
        (migrated.features as unknown[]).some((f: unknown) => {
          const ff = f as Record<string, unknown>
          return (
            typeof ff.title === 'string' &&
            ff.title.toLowerCase().includes('spellcasting') &&
            !!ff.casterType
          )
        })

      if (!hasSpellcastingFeature) {
        // Determine caster type based on class
        let casterType = 'full'
        const className = ((migrated.class as string) || '').replace(/\s*\(.*\)/, '') // Remove subclass info

        if (['Ranger', 'Paladin'].includes(className)) {
          casterType = 'half'
        } else if (['Eldritch Knight', 'Arcane Trickster'].includes(className)) {
          casterType = 'third'
        } else if (className === 'Warlock') {
          casterType = 'pact'
        }

        // Add spellcasting feature
        ;(migrated.features as unknown[]).push({
          title: `Spellcasting (${className})`,
          desc: `You can cast ${className.toLowerCase()} spells. ${(migrated.spellcasting as Record<string, unknown>).ability}
            is your spellcasting ability.`,
          casterType: casterType,
          key: true,
        })
      }
    }

    // Ensure spells array exists
    if (!migrated.spells) {
      migrated.spells = []
    }

    // Ensure combat object exists
    if (!migrated.combat) {
      migrated.combat = {
        ac: 10,
        hp_max: 1,
        hp_current: 1,
        speed: '30ft',
      }
    } else {
      const combat = migrated.combat as Record<string, unknown>
      if (combat.hp_current === undefined) {
        combat.hp_current = combat.hp_max || 1
      }
    }

    // Ensure attacks array exists
    if (!migrated.attacks) {
      migrated.attacks = []
    }

    // Ensure personality object exists
    if (!migrated.personality) {
      migrated.personality = {
        traits: '',
        ideal: '',
        bond: '',
        flaw: '',
        notes: '',
      }
    }

    return migrated
  }

  function _setupSpellcasting() {
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

  async function loadCharacterFromUrl() {
    const urlParams = new URLSearchParams(window.location.search)
    const characterId = urlParams.get('id')

    if (characterId && supabaseClient.value) {
      _showLoading('Fetching character from the archives...')
      try {
        const client = supabaseClient.value
        if (!client) throw new Error('Supabase client not initialized')
        const { data, error } = await client
          .from('characters')
          .select('character_data, id')
          .eq('id', characterId)
          .single()

        if (error) throw error
        if (!data) throw new Error('Character not found.')

        _setCharacter(data.character_data)
        sourceCharacterId.value = data.id // Set the source ID
      } catch (error) {
        console.error('Error loading character from URL:', error)
        _showErrorModal([`Could not load character: ${(error as Error).message}`])
        // Clear the URL query param to avoid confusion
        history.replaceState({}, '', window.location.pathname)
      } finally {
        _hideLoading()
      }
    }
  }

  function loadCharacterFromLibrary(key: string) {
    const [session, charName] = key.split('|')
    if (!session || !charName) return

    const data = characterLibrary.value[session]?.find((c: CharacterData) => c.name === charName)
    if (data) {
      _setCharacter(data)
      sessionName.value = session
    }
  }

  function handleFileLoad(event: Event) {
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
        console.error('File load error:', error)
      }
    }
    reader.readAsText(file)
  }

  function saveToLibrary() {
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
  }

  function handleNewCharacter() {
    _setCharacter(createBlankCharacter())
    isEditing.value = true
  }

  function toggleEdit() {
    isEditing.value = !isEditing.value
  }

  async function generateCharacter(userPrompt: string) {
    if (!userPrompt) {
      _showErrorModal(['Please describe the character you want to generate.'])
      return
    }
    if (!geminiSchema.value) {
      _showErrorModal(['Character schema is not loaded. AI generation is disabled.'])
      return
    }

    _showLoading('The mists of creation are swirling...')
    try {
      const generatedData = await generateCharacterViaGemini(userPrompt, geminiSchema.value)
      const { valid, errors } = validateCharacter(generatedData)
      if (!valid) {
        console.error('AI generated invalid data:', errors)
        _showErrorModal(
          ['The AI generated a character with some inconsistencies, but here it is:'].concat(
            (errors as string[]) || [],
          ),
        )

        // Recalculate derived stats when level changes (ensures profBonus, HP, spell slots, etc. update)
        watch(
          () => currentCharacterData.value?.level,
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

      _setCharacter({ ...createBlankCharacter(), ...generatedData })
      saveToLibrary()
    } catch (error) {
      console.error('Error generating character:', error)
      _showErrorModal([`Error generating character: ${(error as Error).message}`])
    } finally {
      _hideLoading()
    }
  }

  async function shareCharacter() {
    if (!supabaseClient.value) {
      _showErrorModal(['Online sharing is not configured.'])
      return
    }
    if (!currentCharacterData.value) return

    _showLoading('Saving character to the archives...')
    try {
      const client = supabaseClient.value
      if (!client) throw new Error('Supabase client not initialized')
      const { data, error } = await client
        .from('characters')
        .insert([
          {
            name: currentCharacterData.value.name,
            character_data: currentCharacterData.value,
            source_character_id: sourceCharacterId.value,
          },
        ])
        .select()
        .single()

      if (error) throw error

      const newId = data.id
      const newUrl = `${window.location.origin}${window.location.pathname}?id=${newId}`

      shareModal.value.url = newUrl
      shareModal.value.show = true

      history.pushState({}, '', newUrl)
      sourceCharacterId.value = newId
    } catch (error) {
      console.error('Error sharing character:', error)
      _showErrorModal([`Could not share character: ${(error as Error).message}`])
    } finally {
      _hideLoading()
    }
  }

  function exportCharacter() {
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

  function updateCharacter(key: string, value: unknown) {
    if (currentCharacterData.value) {
      ;(currentCharacterData.value as unknown as Record<string, unknown>)[key] = value
    }
  }

  function updateNested(key1: string, key2: string, value: unknown) {
    if (currentCharacterData.value) {
      const obj = currentCharacterData.value as unknown as Record<string, unknown>
      const inner = obj[key1] as Record<string, unknown> | undefined
      if (inner) inner[key2] = value
    }
  }

  function adjustPointBuyScore(key: string, delta: number) {
    if (!currentCharacterData.value) return
    const currentScore = currentCharacterData.value.pointBuyBaseScores[key] || 8
    const newScore = currentScore + delta
    let totalCost = 0
    Object.values(currentCharacterData.value.pointBuyBaseScores).forEach(
      (s) => (totalCost += pointBuyCosts[s]),
    )
    const futureCost = totalCost - pointBuyCosts[currentScore] + pointBuyCosts[newScore]
    if (newScore >= 8 && newScore <= 15 && futureCost <= 27) {
      currentCharacterData.value.pointBuyBaseScores[key] = newScore
      recalculateAbilityScores()
    }
  }

  function recalculateAbilityScores() {
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
    data.combat.hp_max = maxHp.value

    // Setup spellcasting based on current features
    _setupSpellcasting()
  }

  // Helper function to update background skills
  function updateBackgroundSkills() {
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

  // Helper function to update background features
  function updateBackgroundFeatures() {
    if (!currentCharacterData.value || !currentCharacterData.value.background) return

    const backgroundData = DND_RULES.BACKGROUNDS[currentCharacterData.value.background]
    if (!backgroundData || !backgroundData.feature) return

    // Ensure features array exists
    if (!currentCharacterData.value.features) {
      currentCharacterData.value.features = []
    }

    // Remove existing background features
    // We identify background features by checking if they match any background feature title
    const allBackgroundFeatureTitles = new Set<string>()
    Object.values(DND_RULES.BACKGROUNDS).forEach((bg: unknown) => {
      const b = bg as Record<string, unknown>
      const feature = b.feature as Record<string, unknown> | undefined
      if (feature && typeof feature.title === 'string')
        allBackgroundFeatureTitles.add(feature.title)
    })

    currentCharacterData.value.features = currentCharacterData.value.features.filter(
      (feature) => !allBackgroundFeatureTitles.has(feature.title),
    )

    // Add the new background feature
    const newFeature = {
      title: backgroundData.feature.title,
      desc: backgroundData.feature.desc,
      key: backgroundData.feature.key || false,
      casterType: null,
    }

    currentCharacterData.value.features.push(newFeature)
  }

  // Helper function to update class features
  function updateClassFeatures() {
    if (!currentCharacterData.value || !currentCharacterData.value.class) return

    const classData = DND_RULES.CLASSES[currentCharacterData.value.class]
    if (!classData || !classData.features) return

    // Ensure features array exists
    if (!currentCharacterData.value.features) {
      currentCharacterData.value.features = []
    }

    // Remove existing class features
    // We identify class features by checking if they match any class feature title
    const allClassFeatureTitles = new Set<string>()
    Object.values(DND_RULES.CLASSES).forEach((cls: unknown) => {
      const clsData = cls as Record<string, unknown>
      const features = clsData.features as unknown
      if (Array.isArray(features)) {
        features.forEach((feature: unknown) => {
          const featureData = feature as Record<string, unknown>
          if (featureData && typeof featureData.title === 'string') {
            allClassFeatureTitles.add(featureData.title)
          }
        })
      }
    })

    currentCharacterData.value.features = currentCharacterData.value.features.filter(
      (feature) => !allClassFeatureTitles.has(feature.title),
    )

    // Add the new class features
    if (Array.isArray(classData.features)) {
      classData.features.forEach((feature: unknown) => {
        const f = feature as Record<string, unknown>
        const usesCandidate = f.uses as Record<string, unknown> | undefined
        let usesVal: { total: number; per: string } | undefined
        if (
          usesCandidate &&
          typeof usesCandidate.total === 'number' &&
          typeof usesCandidate.per === 'string'
        ) {
          usesVal = { total: usesCandidate.total as number, per: usesCandidate.per as string }
        }
        const newFeature = {
          title: (f.title as string) || '',
          desc: (f.desc as string) || '',
          key: (f.key as boolean) || false,
          casterType: (f.casterType as string) || null,
          uses: usesVal,
        }
        currentCharacterData.value?.features.push(newFeature)
      })
    }

    // Update spellcasting ability based on new class
    _setupSpellcasting()
  }

  // Helper function to update species traits
  function updateSpeciesTraits() {
    if (!currentCharacterData.value || !currentCharacterData.value.species) return

    const speciesData = DND_RULES.SPECIES[currentCharacterData.value.species]
    if (!speciesData || !speciesData.traits) return

    // Ensure features array exists
    if (!currentCharacterData.value.features) {
      currentCharacterData.value.features = []
    }

    // Remove existing species traits
    // We identify species traits by checking if they match any species trait title
    const allSpeciesTraitTitles = new Set()
    Object.values(DND_RULES.SPECIES).forEach((species: unknown) => {
      const s = species as Record<string, unknown>
      const traits = s.traits as unknown
      if (Array.isArray(traits)) {
        traits.forEach((trait: unknown) => {
          const t = trait as Record<string, unknown>
          if (t && typeof t.title === 'string') {
            allSpeciesTraitTitles.add(t.title)
          }
        })
      }
    })

    currentCharacterData.value.features = currentCharacterData.value.features.filter(
      (feature) => !allSpeciesTraitTitles.has(feature.title),
    )

    // Add the new species traits
    if (Array.isArray(speciesData.traits)) {
      speciesData.traits.forEach((trait: unknown) => {
        const t = trait as Record<string, unknown>
        const usesCandidate = t.uses as Record<string, unknown> | undefined
        let usesVal: { total: number; per: string } | undefined
        if (
          usesCandidate &&
          typeof usesCandidate.total === 'number' &&
          typeof usesCandidate.per === 'string'
        ) {
          usesVal = { total: usesCandidate.total as number, per: usesCandidate.per as string }
        }
        const newTrait = {
          title: (t.title as string) || '',
          desc: (t.desc as string) || '',
          key: (t.key as boolean) || false,
          casterType: null,
          uses: usesVal,
        }
        currentCharacterData.value?.features.push(newTrait)
      })
    }
  }

  // Watch for background changes and auto-update skills and features
  watch(
    () => currentCharacterData.value?.background,
    (newBackground, oldBackground) => {
      if (newBackground && newBackground !== oldBackground) {
        updateBackgroundSkills()
        updateBackgroundFeatures()
      }
    },
    { deep: false },
  )

  // Recalculate ability scores when background bonus selections change (+2 / +1)
  watch(
    () => currentCharacterData.value?.backgroundBonusSelections,
    () => {
      recalculateAbilityScores()
    },
    { deep: true },
  )

  // Watch for class changes and auto-update features and saving throws
  watch(
    () => currentCharacterData.value?.class,
    (newClass, oldClass) => {
      if (newClass && newClass !== oldClass) {
        updateClassFeatures()

        // Update saving throw proficiencies
        if (currentCharacterData.value && DND_RULES.CLASSES[newClass]?.savingThrows) {
          currentCharacterData.value.proficiencies.savingThrows =
            DND_RULES.CLASSES[newClass].savingThrows
        }

        // Recalculate derived stats including HP
        recalculateAbilityScores()
      }
    },
    { deep: false },
  )

  // Watch for species changes and auto-update traits
  watch(
    () => currentCharacterData.value?.species,
    (newSpecies, oldSpecies) => {
      if (newSpecies && newSpecies !== oldSpecies) {
        updateSpeciesTraits()

        // Update speed if available
        if (currentCharacterData.value && DND_RULES.SPECIES[newSpecies]?.speed) {
          currentCharacterData.value.combat.speed = DND_RULES.SPECIES[newSpecies].speed
        }
      }
    },
    { deep: false },
  )

  return {
    // State
    currentCharacterData,
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
    // Getters
    abilityMods,
    profBonus,
    maxHp,
    keyFeatures,
    otherFeatures,
    spellcastingAbility,
    spellMod,
    spellSaveDC,
    spellAttack,
    pointBuyPointsUsed,
    pointBuyPointsRemaining,
    // Helper functions
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
    // Modals
    closeErrorModal: () => (errorModal.value.show = false),
    closeShareModal: () => (shareModal.value.show = false),
  }
})
