<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '@/stores/character'
import { useRulesStore } from '@/stores/rulesStore'
import { SPELL_SLOT_PROGRESSION } from '@/data/rules'

import draggable from 'vuedraggable'

function generateId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

// Define local Feature interface
interface Feature {
  casterType?: string | null
  title?: string
  description?: string
  grantsSpells?: boolean
  grantedSpellLevels?: number[]
  [key: string]: unknown
}

interface Spell {
  id?: string
  name: string
  level: number
  desc: string
  classes?: string[]
  [key: string]: unknown
}

const store = useCharacterStore()
const rulesStore = useRulesStore()
const showSpellLibrary = ref(false)
const searchFilter = ref('')
const filterByLevel = ref<number | null>(null)

// Check if character has spellcasting - show when casterType is set OR when any feature grants spells
const hasSpellcasting = computed(() => {
  const features = (store.currentCharacterData?.features || []) as Feature[]
  const hasFullCaster = features.some(
    (f: Feature) => typeof f.casterType === 'string' && f.casterType !== 'none',
  )
  const hasGranted = features.some((f: Feature) => !!f.grantsSpells)
  return hasFullCaster || hasGranted
})

// Get the caster type for spell slot calculation
const casterType = computed(() => {
  const features = (store.currentCharacterData?.features || []) as Feature[]
  const spellcastingFeature = features.find(
    (f: Feature) => typeof f.casterType === 'string' && f.casterType !== 'none',
  )
  if (spellcastingFeature) return spellcastingFeature.casterType || null

  // If no full caster type but there are granted-spell features, mark as 'granted' (handled in spellSlots)
  const hasGranted = features.some((f: Feature) => !!f.grantsSpells)
  return hasGranted ? 'granted' : null
})

// Calculate spell slots based on caster type and level
const spellSlots = computed(() => {
  const features = store.currentCharacterData?.features || []

  // Full/half/third/pact casters use the predefined progression
  if (casterType.value && casterType.value !== 'granted') {
    if (!store.currentCharacterData?.renownTier) return {}
    const level = store.currentCharacterData.renownTier
    const progression =
      SPELL_SLOT_PROGRESSION[casterType.value as keyof typeof SPELL_SLOT_PROGRESSION]
    return progression?.[level] || {}
  }

  // If casterType === 'granted' (feats that grant spells), build slots from grantedSpellLevels
  const grantedLevels = new Set<number>()
  for (const f of features as Feature[]) {
    if (f.grantsSpells && Array.isArray(f.grantedSpellLevels)) {
      for (const lvl of f.grantedSpellLevels || []) {
        // only consider numeric levels 0-9
        if (typeof lvl === 'number' && lvl >= 0 && lvl <= 9) grantedLevels.add(lvl)
      }
    }
  }

  // Build an object like { level1: 1, level2: 1 } - give one slot per granted level (exclude cantrips)
  const slots: Record<string, number> = {}
  for (const lvl of Array.from(grantedLevels).sort((a, b) => a - b)) {
    if (lvl === 0) continue // cantrips don't use slots
    slots[`level${lvl}`] = (slots[`level${lvl}`] || 0) + 1
  }

  return slots
})

// Computed property for draggable spells
const editableSpells = computed({
  get() {
    const arr = (store.currentCharacterData.spells || []) as Spell[]
    for (const s of arr) {
      if (!s.id) s.id = generateId()
    }
    return arr
  },
  set(value: Spell[]) {
    store.currentCharacterData.spells = value
  },
})

// Available spells from rulesStore
const availableSpells = computed(() => {
  return (rulesStore.allSpells as Spell[]) || []
})

// Get character's class for filtering
const characterClass = computed(() => {
  return store.currentCharacterData?.class || ''
})

// Filter spells by class and exclude already added spells
const librarySpells = computed(() => {
  const characterSpellNames = new Set(
    (store.currentCharacterData.spells || []).map((s: Spell) => s.name),
  )

  let filtered = availableSpells.value.filter((s: Spell) => {
    // Exclude spells already on character
    if (characterSpellNames.has(s.name)) return false

    // If spell has no class restriction, include it
    if (!s.classes || !Array.isArray(s.classes) || s.classes.length === 0) return true

    // If character has no class, show all spells
    if (!characterClass.value) return true

    // Check if character's class is in the spell's class list
    return s.classes.some(
      (spellClass: string) => spellClass.toLowerCase() === characterClass.value.toLowerCase(),
    )
  })

  // Apply search filter
  if (searchFilter.value.trim()) {
    const search = searchFilter.value.toLowerCase()
    filtered = filtered.filter(
      (s: Spell) =>
        s.name.toLowerCase().includes(search) ||
        (s.desc && s.desc.toLowerCase().includes(search)) ||
        (typeof s.school === 'string' && s.school.toLowerCase().includes(search)),
    )
  }

  // Apply level filter
  if (filterByLevel.value !== null) {
    filtered = filtered.filter((s: Spell) => s.level === filterByLevel.value)
  }

  // Sort by level, then name
  return filtered.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level
    return a.name.localeCompare(b.name)
  })
})

function toggleSpellLibrary() {
  showSpellLibrary.value = !showSpellLibrary.value
  // Reset filters when opening
  if (showSpellLibrary.value) {
    searchFilter.value = ''
    filterByLevel.value = null
  }
}

function addSpellFromLibrary(spell: Spell) {
  const newSpell = {
    ...spell,
    id: generateId(),
  }

  store.currentCharacterData.spells = store.currentCharacterData.spells || []
  store.currentCharacterData.spells.push(newSpell)
}

function addManualSpell() {
  const newSpell = {
    id: generateId(),
    name: 'New Spell',
    level: 1,
    desc: 'Enter spell description...',
  }

  store.currentCharacterData.spells = store.currentCharacterData.spells || []
  store.currentCharacterData.spells.push(newSpell)

  // Close the library modal
  showSpellLibrary.value = false
}

function clearFilters() {
  searchFilter.value = ''
  filterByLevel.value = null
}

function addSpell() {
  // Only allow adding spells if there's a valid casterType
  if (!hasSpellcasting.value) return

  // If we have spells in the library, show the library instead
  if (availableSpells.value.length > 0) {
    showSpellLibrary.value = true
    return
  }

  // Otherwise, add a blank spell for manual entry
  const newSpell = {
    id: generateId(),
    name: 'New Spell',
    level: 1,
    desc: 'Enter spell description...',
  }

  store.currentCharacterData.spells = store.currentCharacterData.spells || []
  store.currentCharacterData.spells.push(newSpell)
}

function removeSpell(index: number) {
  store.currentCharacterData.spells.splice(index, 1)
}
</script>

<template>
  <section v-if="hasSpellcasting" class="mt-4 flex-grow flex flex-col">
    <h2 class="section-header">Spellcasting</h2>
    <div class="text-sm">
      <p class="mb-2">
        <strong>Spell Save DC:</strong> {{ store.spellSaveDC }} | <strong>Spell Attack:</strong>
        {{ store.spellAttack >= 0 ? '+' : '' }}{{ store.spellAttack }}
      </p>

      <!-- Spell Slots -->
      <div v-if="Object.keys(spellSlots).length > 0" class="mb-4">
        <h3 class="font-bold mb-2">Spell Slots</h3>
        <div class="space-y-1">
          <div
            v-for="[level, count] in Object.entries(spellSlots)"
            :key="level"
            class="flex items-center"
          >
            <span class="w-20 font-bold">{{ level.replace('level', 'Level ') }}:</span>
            <div class="flex space-x-1">
              <input v-for="n in count" :key="n" type="checkbox" class="spell-slot-box" />
            </div>
          </div>
        </div>
      </div>

      <!-- Spells List -->
      <div v-if="store.currentCharacterData.spells?.length > 0 || hasSpellcasting">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold mb-0">Spells</h3>
          <button
            v-if="store.isEditing && hasSpellcasting"
            @click="addSpell"
            class="icon-button text-xs p-1"
            title="Add Spell"
          >
            <span class="material-symbols-outlined text-[14px]">add<></span>
          </button>
        </div>

        <div
          v-if="
            store.currentCharacterData.spells?.length === 0 && hasSpellcasting && store.isEditing
          "
          class="italic text-center text-gray-500 py-4"
        >
          No spells known. Click the + button to add spells.
        </div>

        <div
          v-else-if="store.currentCharacterData.spells?.length === 0"
          class="italic text-center text-gray-500 py-8"
        >
          No spells known.
        </div>

        <draggable
          v-else
          v-model="editableSpells"
          item-key="id"
          tag="div"
          class="space-y-3"
          :disabled="!store.isEditing"
          handle=".spell-drag-handle"
          ghost-class="ghost-item"
          chosen-class="chosen-item"
          drag-class="drag-item"
        >
          <template #item="{ element: spell, index }">
            <div class="spell-box relative">
              <!-- Drag handle - only show in edit mode -->
              <div
                v-if="store.isEditing"
                class="spell-drag-handle absolute left-2 top-2 cursor-move opacity-40 hover:opacity-70 z-10"
                title="Drag to reorder"
              >
                <span class="material-symbols-outlined text-[16px]">drag_indicator<></span>
              </div>

              <div class="flex justify-between items-start" :class="{ 'ml-6': store.isEditing }">
                <div class="flex-grow">
                  <div class="flex items-baseline flex-wrap gap-2 mb-2">
                    <input
                      v-if="store.isEditing"
                      v-model="spell.name"
                      class="edit-mode-input font-bold text-base flex-grow"
                      placeholder="Spell name"
                    />
                    <p v-else class="spell-title font-bold">{{ spell.name }}</p>

                    <input
                      v-if="store.isEditing"
                      v-model.number="spell.level"
                      type="number"
                      min="0"
                      max="9"
                      class="edit-mode-input w-16 text-xs"
                      placeholder="Level"
                    />
                    <span v-else class="text-xs font-normal italic">(Level {{ spell.level }})</span>
                  </div>

                  <textarea
                    v-if="store.isEditing"
                    v-model="spell.desc"
                    class="edit-mode-textarea w-full"
                    placeholder="Spell description"
                    rows="3"
                  ></textarea>
                  <p v-else class="spell-desc text-sm">{{ spell.desc }}</p>
                </div>

                <button
                  v-if="store.isEditing"
                  @click="removeSpell(index)"
                  class="icon-button text-xs p-1 ml-2 bg-red-600 hover:bg-red-700"
                  title="Remove Spell"
                >
                  <span class="material-symbols-outlined text-[12px]">close<></span>
                </button>
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <!-- Spell Library Modal -->
    <div
      v-if="showSpellLibrary && store.isEditing"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="toggleSpellLibrary"
    >
      <div
        class="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-hidden flex flex-col w-full mx-4"
      >
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">Spell Library</h3>
          <button @click="toggleSpellLibrary" class="icon-button" title="Close">
            <span class="material-symbols-outlined">close<></span>
          </button>
        </div>

        <div v-if="characterClass" class="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
          <p class="text-sm text-blue-800">
            <strong>Filtering for {{ characterClass }} spells</strong>
            <br />
            Showing only spells available to the {{ characterClass }} class.
          </p>
        </div>

        <!-- Search and Filter Controls -->
        <div class="mb-4 space-y-3">
          <div class="flex gap-2">
            <div class="flex-grow relative">
              <input
                v-model="searchFilter"
                type="text"
                placeholder="Search spells by name, description, or school..."
                class="w-full p-2 pr-8 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span
                v-if="searchFilter"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600"
                @click="searchFilter = ''"
              >
                <span class="material-symbols-outlined text-[16px]">close<></span>
              </span>
            </div>
          </div>

          <div class="flex gap-2 items-center">
            <label class="text-sm font-medium text-gray-700">Level:</label>
            <div class="flex gap-1 flex-wrap">
              <button
                v-for="level in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]"
                :key="level"
                @click="filterByLevel = filterByLevel === level ? null : level"
                :class="[
                  'px-2 py-1 text-xs rounded border',
                  filterByLevel === level
                    ? 'bg-blue-500 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
                ]"
              >
                {{ level === 0 ? 'Cantrip' : level }}
              </button>
            </div>
            <button
              v-if="searchFilter || filterByLevel !== null"
              @click="clearFilters"
              class="ml-auto text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Clear filters
            </button>
          </div>

          <div class="text-sm text-gray-600">
            Showing {{ librarySpells.length }} spell{{ librarySpells.length !== 1 ? 's' : '' }}
          </div>
        </div>

        <!-- Spell List -->
        <div class="flex-grow overflow-y-auto">
          <div v-if="librarySpells.length === 0" class="text-center text-gray-500 py-8">
            <p class="mb-2">No spells match your filters.</p>
            <p class="text-sm" v-if="searchFilter || filterByLevel !== null">
              Try adjusting your search or filter criteria.
            </p>
            <p class="text-sm" v-else-if="characterClass">
              All {{ characterClass }} spells have been added to your character, or no
              {{ characterClass }} spells have been imported yet.
            </p>
            <p class="text-sm" v-else>
              All imported spells have been added to your character, or no spells have been imported
              yet.
            </p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="spell in librarySpells"
              :key="spell.name"
              class="border rounded p-3 hover:bg-gray-50"
            >
              <div class="flex justify-between items-start">
                <div class="flex-grow">
                  <div class="flex items-baseline gap-2 mb-1">
                    <span class="font-bold">{{ spell.name }}</span>
                    <span class="text-xs italic text-gray-600">
                      {{ spell.level === 0 ? 'Cantrip' : `Level ${spell.level}` }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-700 line-clamp-2">{{ spell.desc }}</p>
                  <div
                    v-if="spell.school || spell.castingTime || spell.range"
                    class="text-xs text-gray-500 mt-1"
                  >
                    <span v-if="spell.school">{{ spell.school }}</span>
                    <span v-if="spell.castingTime"> • {{ spell.castingTime }}</span>
                    <span v-if="spell.range"> • {{ spell.range }}</span>
                  </div>
                </div>
                <button
                  @click="addSpellFromLibrary(spell)"
                  class="ml-3 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  title="Add to character"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Add Manual Spell Button -->
        <div class="mt-4 pt-4 border-t border-gray-200">
          <button
            @click="addManualSpell"
            class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined text-[16px]">add<></span>
            <span>Add Custom Spell (Manual Entry)</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Drag and drop styling */
.spell-drag-handle {
  transition: opacity 0.2s ease;
}

.ghost-item {
  opacity: 0.5;
  background: rgba(59, 130, 246, 0.1);
  border: 2px dashed #3b82f6;
}

.chosen-item {
  transform: scale(1.02);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.drag-item {
  transform: rotate(2deg);
  opacity: 0.8;
}
</style>
