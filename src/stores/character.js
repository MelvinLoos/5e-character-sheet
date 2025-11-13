import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import * as DND_RULES from '../data/rules.js'
import { createClient } from '@supabase/supabase-js'
import { generateCharacterViaGemini } from '../services/apiService.js'
import {
  getLibrary as getLocalLibrary,
  saveLibrary as saveLocalLibrary,
  createBlankCharacter,
  getMod,
  formatMod,
  pointBuyCosts,
} from '../services/characterService.js'

export const useCharacterStore = defineStore('character', () => {
  // --- STATE ---
  const currentCharacterData = ref(null)
  const isEditing = ref(false)
  const characterLibrary = ref(getLocalLibrary())
  const sessionName = ref('Uncategorized')
  const schema = ref(null)
  const ajv = ref(null)
  const supabaseClient = ref(null)
  const sourceCharacterId = ref(null) // For shared characters

  // Modal states
  const isLoading = ref(false)
  const loadingText = ref('')
  const errorModal = ref({ show: false, errors: [] })
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
    const { level, class: className, abilityScores } = currentCharacterData.value
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

  // --- ACTIONS (Methods) ---

  async function initStore() {
    // Init Supabase
    const SUPABASE_URL = 'https://hqnxqotwtzeheydnaaio.supabase.co'
    const SUPABASE_ANON_KEY =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhxbnhxb3R3dHplaGV5ZG5hYWlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTk5MjIsImV4cCI6MjA3NjE3NTkyMn0.0zB-cPMBx-SJkZyu0_MgGoz71xvrp-83r1tUEVg9MeQ'

    if (SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL') {
      try {
        supabaseClient.value = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        console.log('Supabase client initialized.')
      } catch (e) {
        console.error('Error initializing Supabase client:', e.message)
      }
    } else {
      console.warn('Supabase credentials not found. Online sharing will be disabled.')
    }

    // Init AJV
    if (typeof window !== 'undefined' && window.Ajv && window.ajvErrors) {
      ajv.value = new window.Ajv.default({ allErrors: true })
      window.ajvErrors.default(ajv.value)
    } else {
      console.warn('Ajv not loaded. Validation will be limited.')
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

    // Load character from URL if present
    await loadCharacterFromUrl()
  }

  function validateCharacter(data) {
    if (!ajv.value || !schema.value) {
      console.warn('AJV or schema not initialized, skipping validation.')
      return { valid: true }
    }
    const validate = ajv.value.compile(schema.value)
    const valid = validate(data)
    if (valid) {
      return { valid: true, errors: [] }
    }
    const errorMessages = validate.errors.map((error) => error.message)
    return { valid: false, errors: [...new Set(errorMessages)] }
  }

  function _showLoading(text) {
    isLoading.value = true
    loadingText.value = text
  }
  function _hideLoading() {
    isLoading.value = false
  }

  function _showErrorModal(errors) {
    errorModal.value.errors = errors
    errorModal.value.show = true
  }

  function _setCharacter(data) {
    // Migrate legacy character data to new format
    const migratedData = _migrateLegacyCharacter(data)

    currentCharacterData.value = migratedData
    isEditing.value = false
    sourceCharacterId.value = null // Reset source unless it's set by sharing

    // Setup spellcasting object if character has valid casterType
    _setupSpellcasting()

    // Ensure background skills are properly applied
    updateBackgroundSkills()
  }

  function _migrateLegacyCharacter(data) {
    // Create a copy to avoid mutating the original
    const migrated = { ...data }

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
        migrated.pointBuyBaseScores = { ...migrated.abilityScores }

        // Subtract background bonuses if we can determine them
        const background = migrated.background
        if (background && DND_RULES.BACKGROUNDS[background]) {
          const bonusOptions = DND_RULES.BACKGROUNDS[background].abilityScoreIncrease || []
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
      migrated.abilityScores = { ...migrated.pointBuyBaseScores }
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
      const hasSpellcastingFeature = migrated.features.some(
        (f) => f.title && f.title.toLowerCase().includes('spellcasting') && f.casterType,
      )

      if (!hasSpellcastingFeature) {
        // Determine caster type based on class
        let casterType = 'full'
        const className = migrated.class.replace(/\s*\(.*\)/, '') // Remove subclass info

        if (['Ranger', 'Paladin'].includes(className)) {
          casterType = 'half'
        } else if (['Eldritch Knight', 'Arcane Trickster'].includes(className)) {
          casterType = 'third'
        } else if (className === 'Warlock') {
          casterType = 'pact'
        }

        // Add spellcasting feature
        migrated.features.push({
          title: `Spellcasting (${className})`,
          desc: `You can cast ${className.toLowerCase()} spells. ${migrated.spellcasting.ability.toUpperCase()} is your spellcasting ability.`,
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
        speed: '30ft',
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
        const { data, error } = await supabaseClient.value
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
        _showErrorModal([`Could not load character: ${error.message}`])
        // Clear the URL query param to avoid confusion
        history.replaceState({}, '', window.location.pathname)
      } finally {
        _hideLoading()
      }
    }
  }

  function loadCharacterFromLibrary(key) {
    const [session, charName] = key.split('|')
    if (!session || !charName) return

    const data = characterLibrary.value[session]?.find((c) => c.name === charName)
    if (data) {
      _setCharacter(data)
      sessionName.value = session
    }
  }

  function handleFileLoad(event) {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        const { valid, errors } = validateCharacter(data)

        if (!valid) {
          _showErrorModal(errors)
          return
        }
        _setCharacter(data)
        saveToLibrary() // Auto-save imported char
      } catch (error) {
        _showErrorModal([`Error loading file: ${error.message}`])
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
      (c) => c.name === currentCharacterData.value.name,
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

  async function generateCharacter(userPrompt) {
    if (!userPrompt) {
      _showErrorModal(['Please describe the character you want to generate.'])
      return
    }
    if (!schema.value) {
      _showErrorModal(['Character schema is not loaded. AI generation is disabled.'])
      return
    }

    _showLoading('The mists of creation are swirling...')
    try {
      const generatedData = await generateCharacterViaGemini(userPrompt, schema.value)
      const { valid, errors } = validateCharacter(generatedData)
      if (!valid) {
        console.error('AI generated invalid data:', errors)
        _showErrorModal(
          ['The AI generated a character with some inconsistencies, but here it is:'].concat(
            errors,
          ),
        )
      }

      _setCharacter({ ...createBlankCharacter(), ...generatedData })
      saveToLibrary()
    } catch (error) {
      console.error('Error generating character:', error)
      _showErrorModal([`Error generating character: ${error.message}`])
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
      const { data, error } = await supabaseClient.value
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
      _showErrorModal([`Could not share character: ${error.message}`])
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

  function updateCharacter(key, value) {
    if (currentCharacterData.value) {
      currentCharacterData.value[key] = value
    }
  }

  function updateNested(key1, key2, value) {
    if (currentCharacterData.value) {
      currentCharacterData.value[key1][key2] = value
    }
  }

  function adjustPointBuyScore(key, delta) {
    if (!currentCharacterData.value) return
    const currentScore = currentCharacterData.value.pointBuyBaseScores[key]
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
    const finalScores = { ...data.pointBuyBaseScores }
    if (data.backgroundBonusSelections.plusTwo) {
      finalScores[data.backgroundBonusSelections.plusTwo] += 2
    }
    if (data.backgroundBonusSelections.plusOne) {
      finalScores[data.backgroundBonusSelections.plusOne] += 1
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
    const backgroundSkills = backgroundData.skills.map((skill) =>
      skill.toLowerCase().replace(/ /g, ''),
    )

    // Add background skills to proficiencies if not already there
    backgroundSkills.forEach((skill) => {
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
    const allBackgroundFeatureTitles = new Set(
      Object.values(DND_RULES.BACKGROUNDS)
        .map((bg) => bg.feature?.title)
        .filter(Boolean),
    )

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
    const allClassFeatureTitles = new Set()
    Object.values(DND_RULES.CLASSES).forEach((cls) => {
      if (cls.features) {
        cls.features.forEach((feature) => {
          if (feature.title) {
            allClassFeatureTitles.add(feature.title)
          }
        })
      }
    })

    currentCharacterData.value.features = currentCharacterData.value.features.filter(
      (feature) => !allClassFeatureTitles.has(feature.title),
    )

    // Add the new class features
    classData.features.forEach((feature) => {
      const newFeature = {
        title: feature.title,
        desc: feature.desc,
        key: feature.key || false,
        casterType: feature.casterType || null,
        uses: feature.uses || undefined,
      }
      currentCharacterData.value.features.push(newFeature)
    })

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
    Object.values(DND_RULES.SPECIES).forEach((species) => {
      if (species.traits) {
        species.traits.forEach((trait) => {
          if (trait.title) {
            allSpeciesTraitTitles.add(trait.title)
          }
        })
      }
    })

    currentCharacterData.value.features = currentCharacterData.value.features.filter(
      (feature) => !allSpeciesTraitTitles.has(feature.title),
    )

    // Add the new species traits
    speciesData.traits.forEach((trait) => {
      const newTrait = {
        title: trait.title,
        desc: trait.desc,
        key: trait.key || false,
        casterType: null,
        uses: trait.uses || undefined,
      }
      currentCharacterData.value.features.push(newTrait)
    })
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
