<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted, onBeforeUnmount } from 'vue'
import feather from 'feather-icons'

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  feature: {
    type: Object,
    default: () => ({}),
  },
  isNew: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['save', 'cancel', 'delete'])

// Type definitions
interface ResourceData {
  resourceType: string
  value?: number
  scalingStat?: string | null
  reset: string
}

interface UsesData {
  total: number
  per: string
}

interface FeatureFormData {
  title: string
  desc: string
  key: boolean
  featureType: string
  actionType: string
  resource: ResourceData | null
  uses: UsesData | null
  casterType: string | null
  // For feats that grant individual spells (no full spellcasting)
  grantsSpells?: boolean
  grantedSpellLevels?: number[]
  abilityModifiers?: Record<string, number>
}

// Form data - reactive copy of the feature
const formData = reactive<FeatureFormData>({
  title: '',
  desc: '',
  key: false,
  featureType: 'Other',
  actionType: 'None',
  resource: null,
  uses: null,
  casterType: null,
  grantsSpells: false,
  grantedSpellLevels: [],
  abilityModifiers: {},
})

// Validation state
const errors = ref<string[]>([])

// Local visibility flags for info popups
const showHelp = ref({ key: false, grants: false, reset: false, ability: false })

function toggleHelp(type: 'key' | 'grants' | 'reset' | 'ability') {
  // Toggle selected, close others
  ;(Object.keys(showHelp.value) as Array<keyof typeof showHelp.value>).forEach((k) => {
    showHelp.value[k] = false
  })
  showHelp.value[type] = !showHelp.value[type]
}

// Close help popups when clicking outside of them or their buttons
function handleDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target) return

  // If the click is inside a help popup or on an info button, don't hide
  if (target.closest('.help-popup') || target.closest('.info-button')) return

  showHelp.value.key = false
  showHelp.value.grants = false
  showHelp.value.reset = false
  showHelp.value.ability = false
}

onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))

// Available options for dropdowns
const featureTypes = [
  'Class Feature',
  'Species Trait',
  'Background Feature',
  'Origin Feat',
  'General Feat',
  'Fighting Style',
  'Epic Boon',
  'Other',
]

const actionTypes = ['Action', 'Bonus Action', 'Reaction', 'Free Action', 'Passive', 'None']

const casterTypes = [
  { value: null, label: 'No Spellcasting' },
  { value: 'full', label: 'Full Caster' },
  { value: 'half', label: 'Half Caster' },
  { value: 'third', label: 'Third Caster' },
  { value: 'pact', label: 'Pact Magic' },
]

// Watch for prop changes to update form data
watch(
  () => props.feature,
  (newFeature) => {
    if (newFeature && Object.keys(newFeature).length > 0) {
      Object.assign(formData, {
        title: newFeature.title || '',
        desc: newFeature.desc || '',
        key: newFeature.key || false,
        featureType: newFeature.featureType || 'Other',
        actionType: newFeature.actionType || 'None',
        resource: newFeature.resource ? { ...newFeature.resource } : null,
        uses: newFeature.uses || null,
        casterType: newFeature.casterType || null,
        grantsSpells: newFeature.grantsSpells || false,
        grantedSpellLevels: newFeature.grantedSpellLevels ? [...newFeature.grantedSpellLevels] : [],
        abilityModifiers: newFeature.abilityModifiers ? { ...newFeature.abilityModifiers } : {},
      })
    } else if (props.isNew) {
      // Reset form for new feature
      Object.assign(formData, {
        title: 'New Feature',
        desc: 'Enter feature description...',
        key: false,
        featureType: 'Other',
        actionType: 'None',
        resource: null,
        uses: null,
        casterType: null,
        abilityModifiers: {},
      })
    }
  },
  { immediate: true },
)

// Validation
function validateForm() {
  errors.value = []

  if (!formData.title.trim()) {
    errors.value.push('Feature title is required')
  }

  if (!formData.desc.trim()) {
    errors.value.push('Feature description is required')
  }

  return errors.value.length === 0
}

import { normalizeFeatureForSave } from '../../utils/featureNormalizer'

// Event handlers
function handleSave() {
  if (!validateForm()) {
    return
  }

  const cleanedFeature = normalizeFeatureForSave(formData as FeatureFormData)
  emit('save', cleanedFeature)
}

function handleCancel() {
  errors.value = []
  emit('cancel')
}

function handleDelete() {
  if (confirm('Are you sure you want to delete this feature?')) {
    emit('delete')
  }
}

// Close modal on backdrop click
function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    handleCancel()
  }
}

// Computed property for modal title
const modalTitle = computed(() => {
  return props.isNew ? 'Add New Feature' : 'Edit Feature'
})

// Computed property for resource toggle
const hasResource = computed({
  get() {
    return formData.resource !== null
  },
  set(value) {
    if (value) {
      formData.resource = {
        resourceType: 'static',
        value: 1,
        scalingStat: null,
        reset: 'Long Rest',
      }
    } else {
      formData.resource = null
    }
  },
})

// Computed property for hybrid max uses type
const maxUsesType = computed({
  get() {
    if (!formData.resource) {
      // For legacy features with 'uses', convert to fixed value
      if (formData.uses && formData.uses.total) {
        return 'fixed'
      }
      return 'fixed'
    }

    // If it's static scaling, it's a fixed value
    if (formData.resource.resourceType === 'static') return 'fixed'

    // If it's proficiency scaling, return 'pb'
    if (formData.resource.resourceType === 'scaling' && formData.resource.scalingStat === 'pb')
      return 'pb'

    // If it's level scaling, return 'level' (note: level scaling not supported in current schema)
    if (formData.resource.resourceType === 'scaling' && formData.resource.scalingStat === 'level')
      return 'level'

    // If it's ability scaling, return the specific ability
    if (formData.resource.resourceType === 'scaling' && formData.resource.scalingStat) {
      return formData.resource.scalingStat
    }

    return 'fixed'
  },
  set(value) {
    // Initialize resource if it doesn't exist
    if (!formData.resource) {
      formData.resource = {
        resourceType: 'static',
        value: formData.uses?.total || 1,
        scalingStat: null,
        reset: formData.uses?.per || 'Long Rest',
      }
      // Clear legacy uses when converting to resource
      formData.uses = null
    }

    if (value === 'fixed') {
      formData.resource.resourceType = 'static'
      formData.resource.scalingStat = null
    } else if (value === 'pb') {
      formData.resource.resourceType = 'scaling'
      formData.resource.scalingStat = 'pb'
      formData.resource.value = undefined // Not used for scaling
    } else if (value === 'level') {
      // Note: Level scaling not in schema, but we'll handle it for future compatibility
      formData.resource.resourceType = 'scaling'
      formData.resource.scalingStat = 'level'
      formData.resource.value = undefined
    } else {
      // Ability score (str, dex, con, int, wis, cha)
      formData.resource.resourceType = 'scaling'
      formData.resource.scalingStat = value
      formData.resource.value = undefined
    }
  },
})

// Safe computed property for base amount to handle v-model
const baseAmount = computed({
  get() {
    return formData.resource?.value || formData.uses?.total || 1
  },
  set(value) {
    if (formData.resource) {
      formData.resource.value = value
    }
  },
})

// Ability Modifiers Management
const abilityOptions = [
  { value: 'str', label: 'Strength' },
  { value: 'dex', label: 'Dexterity' },
  { value: 'con', label: 'Constitution' },
  { value: 'int', label: 'Intelligence' },
  { value: 'wis', label: 'Wisdom' },
  { value: 'cha', label: 'Charisma' },
]

const newModifier = reactive({ stat: 'str', value: 1 })

function addModifier() {
  if (!formData.abilityModifiers) formData.abilityModifiers = {}
  const val = Number(newModifier.value)
  if (!isNaN(val)) {
    formData.abilityModifiers[newModifier.stat] = val
  }
  // Reset to default
  newModifier.stat = 'str'
  newModifier.value = 1
}

function removeModifier(stat: string) {
  if (formData.abilityModifiers) {
    delete formData.abilityModifiers[stat]
  }
}
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click="handleBackdropClick">
    <div class="modal-content max-w-4xl w-full mx-4">
      <!-- Modal Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-fell text-sheet-red">{{ modalTitle }}</h2>
        <button @click="handleCancel" class="info-button" title="Close">
          <span v-html="feather.icons?.x?.toSvg({ width: 20, height: 20 })"></span>
        </button>
      </div>

      <!-- Error Messages -->
      <div
        v-if="errors.length > 0"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
      >
        <ul class="list-disc list-inside">
          <li v-for="error in errors" :key="error">{{ error }}</li>
        </ul>
      </div>

      <!-- Main Form -->
      <div class="grid md:grid-cols-3 gap-6">
        <!-- Left Column - Main Details -->
        <div class="md:col-span-2 space-y-4">
          <!-- Title and Key Feature Toggle -->
          <div class="flex items-center gap-4">
            <div class="flex-grow">
              <label for="feature-title" class="block text-sm font-bold mb-1">Feature Title:</label>
              <input
                id="feature-title"
                v-model="formData.title"
                type="text"
                class="edit-mode-input"
                placeholder="Enter feature name"
              />
            </div>
            <div class="flex items-center gap-2 mt-6">
              <input id="key-feature" v-model="formData.key" type="checkbox" class="usage-box" />
              <label for="key-feature" class="text-sm font-bold">Key Feature</label>
              <div class="relative inline-flex items-center">
                <button
                  class="info-button"
                  title="Key features appear on the front page"
                  @click.prevent="toggleHelp('key')"
                >
                  <span
                    v-html="feather.icons?.['help-circle']?.toSvg({ width: 16, height: 16 })"
                  ></span>
                </button>
                <div
                  v-if="showHelp.key"
                  class="absolute top-full right-0 mt-2 p-3 bg-white border-2 border-sheet-border rounded-lg shadow-lg z-20 w-64 text-sm"
                >
                  <div class="font-bold mb-1">Key Feature</div>
                  <div class="text-xs">Key features appear on the front page.</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div>
            <label for="feature-desc" class="block text-sm font-bold mb-1">Description:</label>
            <textarea
              id="feature-desc"
              v-model="formData.desc"
              class="edit-mode-textarea"
              rows="6"
              placeholder="Describe what this feature does..."
            ></textarea>
          </div>
        </div>

        <!-- Right Column - Categorization -->
        <div class="space-y-4">
          <h3 class="font-bold text-lg border-b border-sheet-border pb-1">Categorization</h3>

          <!-- Feature Type -->
          <div>
            <label for="feature-type" class="block text-sm font-bold mb-1">Feature Type:</label>
            <select id="feature-type" v-model="formData.featureType" class="edit-mode-select">
              <option v-for="type in featureTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>

          <!-- Action Type -->
          <div>
            <label for="action-type" class="block text-sm font-bold mb-1">Action Type:</label>
            <select id="action-type" v-model="formData.actionType" class="edit-mode-select">
              <option v-for="type in actionTypes" :key="type" :value="type">
                {{ type }}
              </option>
            </select>
          </div>

          <!-- Spellcasting Type -->
          <div>
            <label for="caster-type" class="block text-sm font-bold mb-1">Spellcasting:</label>
            <select id="caster-type" v-model="formData.casterType" class="edit-mode-select">
              <option
                v-for="(type, index) in casterTypes"
                :key="`caster-${index}`"
                :value="type.value"
              >
                {{ type.label }}
              </option>
            </select>
          </div>

          <!-- Ability Score Modifiers -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-sm font-bold">Ability Modifiers:</label>
              <div class="relative inline-flex items-center">
                <button
                  class="info-button"
                  title="Add ability score increases granted by this feature."
                  @click.prevent="toggleHelp('ability')"
                >
                  <span
                    v-html="feather.icons?.['help-circle']?.toSvg({ width: 14, height: 14 })"
                  ></span>
                </button>
                <div
                  v-if="showHelp.ability"
                  class="absolute top-full right-0 mt-2 p-3 bg-white border-2 border-sheet-border rounded-lg shadow-lg z-20 w-64 text-sm"
                >
                  <div class="font-bold mb-1">Ability Modifiers</div>
                  <div class="text-xs">
                    Add ability score increases granted by this feature (e.g., +1 Strength).
                  </div>
                </div>
              </div>
            </div>

            <div class="space-y-2 bg-gray-50 p-2 rounded border border-gray-200">
              <!-- Existing Modifiers -->
              <div
                v-if="
                  formData.abilityModifiers && Object.keys(formData.abilityModifiers).length > 0
                "
                class="space-y-1 mb-2"
              >
                <div
                  v-for="(val, stat) in formData.abilityModifiers"
                  :key="stat"
                  class="flex items-center justify-between bg-white px-2 py-1 rounded border border-gray-200 text-sm"
                >
                  <span>
                    <span class="font-bold uppercase">{{ stat }}</span
                    >: {{ val > 0 ? '+' : '' }}{{ val }}
                  </span>
                  <button
                    @click="removeModifier(stat as string)"
                    class="text-red-500 hover:text-red-700"
                  >
                    <span v-html="feather.icons?.x?.toSvg({ width: 14, height: 14 })"></span>
                  </button>
                </div>
              </div>

              <!-- Add New Modifier -->
              <div class="flex items-center gap-1">
                <select v-model="newModifier.stat" class="edit-mode-select text-xs py-1 px-1 w-20">
                  <option v-for="opt in abilityOptions" :key="opt.value" :value="opt.value">
                    {{ opt.value.toUpperCase() }}
                  </option>
                </select>
                <input
                  v-model.number="newModifier.value"
                  type="number"
                  class="edit-mode-input text-xs py-1 px-1 w-12"
                />
                <button
                  @click="addModifier"
                  class="bg-blue-500 text-white rounded p-1 hover:bg-blue-600"
                  title="Add Modifier"
                >
                  <span v-html="feather.icons?.plus?.toSvg({ width: 14, height: 14 })"></span>
                </button>
              </div>
            </div>
          </div>

          <!-- Grants Spells (for feats that provide specific spells but not full casting) -->
          <div>
            <label class="block text-sm font-bold mb-1">Grant Spells:</label>
            <div class="flex items-center gap-2">
              <input
                id="grants-spells"
                v-model="formData.grantsSpells"
                type="checkbox"
                class="usage-box"
              />
              <label for="grants-spells" class="text-sm"
                >This feature grants specific spells (no full spellcasting)</label
              >
            </div>

            <div v-if="formData.grantsSpells" class="mt-2 ml-4 text-xs">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold mb-1">Granted Spell Levels</label>
                <div class="relative inline-flex items-center">
                  <button
                    class="info-button"
                    title="Select one or more spell levels granted by this feature."
                    @click.prevent="toggleHelp('grants')"
                  >
                    <span
                      v-html="feather.icons?.['help-circle']?.toSvg({ width: 14, height: 14 })"
                    ></span>
                  </button>
                  <div
                    v-if="showHelp.grants"
                    class="absolute top-full right-0 mt-2 p-3 bg-white border-2 border-sheet-border rounded-lg shadow-lg z-20 w-64 text-sm"
                  >
                    <div class="font-bold mb-1">Granted Spell Levels</div>
                    <div class="text-xs">
                      Select one or more spell levels granted by this feature.
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 mt-2">
                <label
                  v-for="lvl in [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]"
                  :key="lvl"
                  class="inline-flex items-center gap-1"
                >
                  <input type="checkbox" :value="lvl" v-model="formData.grantedSpellLevels" />
                  <span>{{ lvl === 0 ? 'Cantrip (0)' : 'Level ' + lvl }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Resource Usage -->
          <div>
            <label for="has-resource" class="block text-sm font-bold mb-1">Resource Usage:</label>
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <input id="has-resource" v-model="hasResource" type="checkbox" class="usage-box" />
                <label for="has-resource" class="text-sm">Has limited uses</label>
              </div>

              <div v-if="hasResource" class="space-y-3 ml-6">
                <!-- Max Uses (Hybrid Input) -->
                <div>
                  <label for="max-uses-type" class="block text-xs font-bold mb-1">Max Uses:</label>
                  <select
                    id="max-uses-type"
                    v-model="maxUsesType"
                    class="edit-mode-select text-sm w-full"
                  >
                    <option value="fixed">Fixed Value</option>
                    <option value="pb">Equal to Proficiency Bonus</option>
                    <option value="str">Equal to STR Modifier</option>
                    <option value="dex">Equal to DEX Modifier</option>
                    <option value="con">Equal to CON Modifier</option>
                    <option value="int">Equal to INT Modifier</option>
                    <option value="wis">Equal to WIS Modifier</option>
                    <option value="cha">Equal to CHA Modifier</option>
                    <option value="level">Equal to Character Level</option>
                  </select>
                </div>

                <!-- Manual Input (only show if "Fixed Value" selected) -->
                <div v-if="maxUsesType === 'fixed'">
                  <label for="fixed-amount" class="block text-xs font-bold mb-1"
                    >Enter Amount:</label
                  >
                  <input
                    id="fixed-amount"
                    v-model="baseAmount"
                    type="number"
                    min="1"
                    class="edit-mode-input text-sm w-full"
                    placeholder="Enter number of uses"
                  />
                </div>

                <!-- Reset Condition -->
                <div>
                  <label for="reset-condition" class="block text-xs font-bold mb-1">Resets:</label>
                  <div class="flex items-center gap-2">
                    <select
                      id="reset-condition"
                      v-model="formData.resource!.reset"
                      class="edit-mode-select text-sm w-full"
                    >
                      <option value="Long Rest">Long Rest</option>
                      <option value="Short Rest">Short Rest</option>
                      <option value="Dawn">Dawn</option>
                      <option value="Initiative">Initiative</option>
                      <option value="Turn">Turn</option>
                      <option value="Round">Round</option>
                      <option value="Encounter">Encounter</option>
                      <option value="Day">Day</option>
                      <option value="Week">Week</option>
                      <option value="Special">Special</option>
                      <option value="None">None</option>
                    </select>
                    <div class="relative inline-flex items-center">
                      <button
                        class="info-button"
                        title="Choose when this feature's uses refresh. Use 'Special' for custom conditions."
                        @click.prevent="toggleHelp('reset')"
                      >
                        <span
                          v-html="feather.icons?.['help-circle']?.toSvg({ width: 14, height: 14 })"
                        ></span>
                      </button>
                      <div
                        v-if="showHelp.reset"
                        class="absolute top-full right-0 mt-2 p-3 bg-white border-2 border-sheet-border rounded-lg shadow-lg z-20 w-64 text-sm"
                      >
                        <div class="font-bold mb-1">Reset Condition</div>
                        <div class="text-xs">
                          Choose when this feature's uses refresh. Use 'Special' for custom
                          conditions.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Preview -->
                <div class="bg-blue-50 p-2 rounded text-xs">
                  <strong>Preview:</strong>
                  <span v-if="maxUsesType === 'fixed'">
                    {{ baseAmount || 0 }} use{{ (baseAmount || 0) !== 1 ? 's' : '' }}
                  </span>
                  <span v-else-if="maxUsesType === 'pb'"> Proficiency Bonus uses </span>
                  <span v-else-if="maxUsesType === 'level'"> Character Level uses </span>
                  <span v-else> {{ maxUsesType.toUpperCase() }} modifier uses </span>
                  per {{ formData.resource?.reset || formData.uses?.per || 'long rest' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Actions -->
      <div class="flex items-center justify-between mt-8 pt-4 border-t border-sheet-border">
        <div>
          <button
            v-if="!isNew"
            @click="handleDelete"
            class="icon-button bg-red-600 text-white hover:bg-red-700"
          >
            <span v-html="feather.icons?.trash?.toSvg({ width: 16, height: 16 })"></span>
            Delete
          </button>
        </div>
        <div class="flex items-center gap-3">
          <button @click="handleCancel" class="icon-button">
            <span v-html="feather.icons?.x?.toSvg({ width: 16, height: 16 })"></span>
            Cancel
          </button>
          <button
            @click="handleSave"
            class="icon-button bg-green-600 text-white hover:bg-green-700"
          >
            <span v-html="feather.icons?.save?.toSvg({ width: 16, height: 16 })"></span>
            {{ isNew ? 'Add Feature' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.usage-box {
  width: 1rem;
  height: 1rem;
  border: 1px solid var(--sheet-border, #d1d5db);
  background-color: white;
}

.help-popup {
  min-width: 220px;
  max-width: 420px;
  word-break: break-word;
}

.help-popup p {
  margin: 0;
}
</style>
