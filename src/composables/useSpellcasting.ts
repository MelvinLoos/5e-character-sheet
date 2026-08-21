import { computed, ref, watch } from 'vue'
import { useCharacterStore } from '@/stores/character'
import { useProgressionStore } from '@/stores/progression'
import { useRulesStore } from '@/stores/rulesStore'
import { computeGrantedSpellSlots } from '@/domain'
import type { Ref, ComputedRef, WritableComputedRef } from 'vue'
import type { CharacterFeature, CharacterSpell } from '@/types/character'
import type { CasterType } from '@/types/enums'

/**
 * Pure utility: generate short unique IDs for spells and other entities.
 */
export function generateSpellId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

/**
 * Pure utility: format a spell level into a human-readable ordinal label.
 *
 * @example
 * formatLevel(0) // 'Cantrip'
 * formatLevel(1) // '1st'
 * formatLevel(2) // '2nd'
 * formatLevel(3) // '3rd'
 * formatLevel(4) // '4th'
 */
export function formatLevel(level: number): string {
  if (level === 0) return 'Cantrip'
  if (level === 1) return '1st'
  if (level === 2) return '2nd'
  if (level === 3) return '3rd'
  return `${level}th`
}

/**
 * Composable encapsulating all D&D 5.5e spellcasting logic from
 * SpellcastingBlock.vue (~180 lines of script):
 *
 * - Caster type detection (full/half/third/pact/granted)
 * - Granted-spell slot aggregation from feats/traits
 * - Slot tracking with defensive clamping on tier downgrade
 * - Spellbook CRUD and library search/filter
 *
 * @param characterStore - Optional pre-existing character store instance.
 * @param rulesStore - Optional pre-existing rules store instance.
 */
export function useSpellcasting(
  characterStore?: ReturnType<typeof useCharacterStore>,
  rulesStore?: ReturnType<typeof useRulesStore>,
) {
  const store = characterStore ?? useCharacterStore()
  const rules = rulesStore ?? useRulesStore()
  const progression = useProgressionStore()

  // ---------------------------------------------------------------------------
  // UI Filters (local state — not global)
  // ---------------------------------------------------------------------------

  const showSpellLibrary: Ref<boolean> = ref(false)
  const searchFilter: Ref<string> = ref('')
  const filterByLevel: Ref<number | null> = ref(null)

  // ---------------------------------------------------------------------------
  // Spell Sorting
  // ---------------------------------------------------------------------------

  /** Sort mode for spell display. 'manual' preserves user drag-and-drop order. */
  const spellSortMode: Ref<'manual' | 'level' | 'name' | 'school' | 'prepared'> = ref('level')

  /** Spells sorted according to the active sort mode. */
  const sortedSpells: ComputedRef<CharacterSpell[]> = computed(() => {
    const spells = [...editableSpells.value]

    if (spellSortMode.value === 'manual') return spells

    if (spellSortMode.value === 'level') {
      return spells.sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level
        return a.name.localeCompare(b.name)
      })
    }

    if (spellSortMode.value === 'name') {
      return spells.sort((a, b) => a.name.localeCompare(b.name))
    }

    if (spellSortMode.value === 'school') {
      return spells.sort((a, b) => {
        const schoolA = (typeof a.school === 'string' ? a.school : '\uffff') || '\uffff'
        const schoolB = (typeof b.school === 'string' ? b.school : '\uffff') || '\uffff'
        if (schoolA !== schoolB) return schoolA.localeCompare(schoolB)
        return a.name.localeCompare(b.name)
      })
    }

    // 'prepared' - prepared spells first, then by level, then by name
    return spells.sort((a, b) => {
      if (a.prepared && !b.prepared) return -1
      if (!a.prepared && b.prepared) return 1
      if (a.level !== b.level) return a.level - b.level
      return a.name.localeCompare(b.name)
    })
  })

  // ---------------------------------------------------------------------------
  // Caster Detection
  // ---------------------------------------------------------------------------

  /**
   * True when the character has a casterType on at least one feature,
   * OR any feature grants spells (e.g. Magic Initiate).
   */
  const hasSpellcasting: ComputedRef<boolean> = computed(() => {
    const features = (store.currentCharacterData?.features || [])
    const hasFullCaster = features.some(
      (f) => typeof f.casterType === 'string' && f.casterType !== 'none',
    )
    const hasGranted = features.some((f) => !!f.grantsSpells)
    return hasFullCaster || hasGranted
  })

  /**
   * Returns the caster progression type of the first spellcasting feature,
   * or 'granted' if the character only gains spells via feats/traits.
   */
  const casterType: ComputedRef<CasterType | 'granted' | null> = computed(() => {
    const features = (store.currentCharacterData?.features || []) as CharacterFeature[]
    const spellcastingFeature = features.find(
      (f) => typeof f.casterType === 'string' && f.casterType !== 'none',
    )
    if (spellcastingFeature) {
      return (spellcastingFeature.casterType || null) as CasterType | null
    }

    const hasGranted = features.some((f) => !!f.grantsSpells)
    return hasGranted ? 'granted' : null
  })

  // ---------------------------------------------------------------------------
  // Slot Calculation
  // ---------------------------------------------------------------------------

  /**
   * Slot map for feat/trait-granted spells (e.g. Magic Initiate).
   *
   * Delegates to the spell slot service so the aggregation rules are shared
   * with the progression store. Returns the raw granted contribution (does not
   * include class-based slots); use `displaySpellSlots` for the total.
   */
  const grantedSpellSlots: ComputedRef<Record<string, number>> = computed(() => {
    const features = (store.currentCharacterData?.features || []) as CharacterFeature[]
    return computeGrantedSpellSlots(features)
  })

  /**
   * Total spell slots — class-based + feat/trait-granted, additively merged.
   *
   * This is the single source of truth (progressionStore.spellSlots) used by
   * both the interactive sheet and the printable sheet, so they can never
   * diverge.
   */
  const displaySpellSlots: ComputedRef<Record<string, number>> = computed(() => {
    return progression.spellSlots
  })

  /**
   * The highest spell level for which the character has at least one slot.
   * Returns 0 when there are no slots at all (only cantrips are allowed).
   */
  const maxSpellSlotLevel: ComputedRef<number> = computed(() => {
    const keys = Object.keys(displaySpellSlots.value)
    if (keys.length === 0) return 0
    return Math.max(...keys.map((k) => parseInt(k.replace('level', ''))))
  })

  // ---------------------------------------------------------------------------
  // Slot Tracking
  // ---------------------------------------------------------------------------

  /** Lazy-init helper to ensure `slotsSpent` exists on the character data. */
  function ensureSlotsSpent(): void {
    if (
      store.currentCharacterData.spellcasting &&
      !store.currentCharacterData.spellcasting.slotsSpent
    ) {
      store.currentCharacterData.spellcasting.slotsSpent = {}
    }
  }

  /**
   * Currently spent slots, keyed by level (e.g. 'level1' → 2).
   */
  const slotsSpent: ComputedRef<Record<string, number>> = computed(() => {
    ensureSlotsSpent()
    if (!store.currentCharacterData.spellcasting) return {}
    return store.currentCharacterData.spellcasting.slotsSpent as Record<string, number>
  })

  /**
   * Get the number of spent slots for a given spell level.
   */
  function getSpent(level: number): number {
    return slotsSpent.value[`level${level}`] || 0
  }

  /**
   * Set the number of spent slots for a given spell level.
   * Automatically clamps to [0, max available] for that level.
   */
  function setSpent(level: number, val: number): void {
    if (!store.currentCharacterData.spellcasting) return
    if (!store.currentCharacterData.spellcasting.slotsSpent) {
      store.currentCharacterData.spellcasting.slotsSpent = {}
    }
    const max = displaySpellSlots.value[`level${level}`] || 0
    const validated = Math.min(max, Math.max(0, val))
    store.currentCharacterData.spellcasting.slotsSpent[`level${level}`] = validated
  }

  // Defensive clamp: when tier decreases, max slots shrink → clamp spent
  watch(displaySpellSlots, (newSlots) => {
    if (!store.currentCharacterData.spellcasting?.slotsSpent) return
    for (const [key, max] of Object.entries(newSlots)) {
      const spent = store.currentCharacterData.spellcasting.slotsSpent[key] || 0
      if (spent > max) {
        store.currentCharacterData.spellcasting.slotsSpent[key] = max
      }
    }
  })

  // ---------------------------------------------------------------------------
  // Spellbook
  // ---------------------------------------------------------------------------

  /** Writable computed for draggable spells (via vuedraggable). */
  const editableSpells: WritableComputedRef<CharacterSpell[]> = computed({
    get(): CharacterSpell[] {
      const arr = (store.currentCharacterData.spells || []) as CharacterSpell[]
      for (const s of arr) {
        if (!s.id) {
          s.id = generateSpellId()
        }
      }
      return arr
    },
    set(value: CharacterSpell[]): void {
      store.currentCharacterData.spells = value
    },
  })

  /** Character class name for spell library filtering. */
  const characterClass: ComputedRef<string> = computed(() => {
    return store.currentCharacterData?.class || ''
  })

  /** Raw spell list from the rules store. */
  const availableSpells: ComputedRef<CharacterSpell[]> = computed(() => {
    return (rules.allSpells as CharacterSpell[]) || []
  })

  /**
   * Filtered spells available for the character to learn.
   * Filters by: not already known, class restriction, search query, level.
   */
  const librarySpells: ComputedRef<CharacterSpell[]> = computed(() => {
    const characterSpellNames = new Set(
      (store.currentCharacterData.spells || []).map((s) => s.name),
    )

    let filtered = availableSpells.value.filter((s) => {
      // Exclude already-learned spells
      if (characterSpellNames.has(s.name)) return false

      // If spell has no class restriction, include it
      if (!s.classes || !Array.isArray(s.classes) || s.classes.length === 0) return true

      // If character has no class, show all
      if (!characterClass.value) return true

      return s.classes.some(
        (spellClass) =>
          spellClass.toLowerCase() === characterClass.value.toLowerCase(),
      )
    })

    // Search filter
    if (searchFilter.value.trim()) {
      const search = searchFilter.value.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          (s.desc && s.desc.toLowerCase().includes(search)) ||
          (typeof s.school === 'string' && s.school.toLowerCase().includes(search)),
      )
    }

    // Level filter
    if (filterByLevel.value !== null) {
      filtered = filtered.filter((s) => s.level === filterByLevel.value)
    }

    // Auto-filter: exclude spells above the character's max spell slot level
    filtered = filtered.filter((s) => s.level <= maxSpellSlotLevel.value)

    // Sort by level, then name
    return filtered.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level
      return a.name.localeCompare(b.name)
    })
  })

  /** Filtered version of the character's own spells (when search is active). */
  const filteredActiveSpells: ComputedRef<CharacterSpell[]> = computed(() => {
    if (!searchFilter.value) return sortedSpells.value
    const query = searchFilter.value.toLowerCase()
    return sortedSpells.value.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.desc.toLowerCase().includes(query) ||
        s.school?.toLowerCase().includes(query),
    )
  })

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  function toggleSpellLibrary(): void {
    showSpellLibrary.value = !showSpellLibrary.value
    if (showSpellLibrary.value) {
      searchFilter.value = ''
      filterByLevel.value = null
    }
  }

  function addSpellFromLibrary(spell: CharacterSpell): void {
    const newSpell: CharacterSpell = {
      ...spell,
      id: generateSpellId(),
      prepared: false,
    }
    store.currentCharacterData.spells = store.currentCharacterData.spells || []
    store.currentCharacterData.spells.push(newSpell)
  }

  function addManualSpell(): void {
    const newSpell: CharacterSpell = {
      id: generateSpellId(),
      name: 'New Spell',
      level: 1,
      desc: 'Enter spell description...',
      prepared: false,
    }
    store.currentCharacterData.spells = store.currentCharacterData.spells || []
    store.currentCharacterData.spells.push(newSpell)
    showSpellLibrary.value = false
  }

  function addSpell(): void {
    if (!hasSpellcasting.value) return

    if (availableSpells.value.length > 0) {
      showSpellLibrary.value = true
      return
    }
    addManualSpell()
  }

  function removeSpell(id: string): void {
    const idx = store.currentCharacterData.spells.findIndex((s) => s.id === id)
    if (idx !== -1) {
      store.currentCharacterData.spells.splice(idx, 1)
    }
  }

  function togglePrepared(spell: CharacterSpell): void {
    spell.prepared = !spell.prepared
  }

  function clearFilters(): void {
    searchFilter.value = ''
    filterByLevel.value = null
  }

  return {
    // UI state
    showSpellLibrary,
    searchFilter,
    filterByLevel,
    spellSortMode,
    sortedSpells,
    // Caster detection
    hasSpellcasting,
    casterType,
    // Slot calculation
    grantedSpellSlots,
    displaySpellSlots,
    maxSpellSlotLevel,
    // Slot tracking
    ensureSlotsSpent,
    slotsSpent,
    getSpent,
    setSpent,
    // Spellbook
    editableSpells,
    characterClass,
    availableSpells,
    librarySpells,
    filteredActiveSpells,
    // Actions
    toggleSpellLibrary,
    addSpellFromLibrary,
    addManualSpell,
    addSpell,
    removeSpell,
    togglePrepared,
    clearFilters,
    formatLevel,
  }
}