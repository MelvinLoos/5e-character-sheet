<script setup>
import { ref, reactive, watch, computed } from 'vue'
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

// Form data - reactive copy of the feature
const formData = reactive({
  title: '',
  desc: '',
  key: false,
  featureType: 'Other',
  actionType: 'None',
  resource: null,
  uses: null,
  casterType: null,
})

// Validation state
const errors = ref([])

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

// Event handlers
function handleSave() {
  if (!validateForm()) {
    return
  }

  // Clean up the data before emitting
  const cleanedFeature = {
    title: formData.title.trim(),
    desc: formData.desc.trim(),
    key: formData.key,
    featureType: formData.featureType,
    actionType: formData.actionType,
    casterType: formData.casterType,
  }

  // Only include resource if it exists
  if (formData.resource) {
    cleanedFeature.resource = { ...formData.resource }
  }

  // Keep legacy uses for backward compatibility
  if (formData.uses) {
    cleanedFeature.uses = { ...formData.uses }
  }

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
function handleBackdropClick(event) {
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
        baseAmount: 1,
        scaling: 'static',
        scalingAbility: 'str',
        resetPer: 'long rest',
      }
    } else {
      formData.resource = null
    }
  },
})
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click="handleBackdropClick">
    <div class="modal-content max-w-4xl w-full mx-4">
      <!-- Modal Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-fell text-sheet-red">{{ modalTitle }}</h2>
        <button @click="handleCancel" class="info-button" title="Close">
          <span v-html="feather.icons.x.toSvg({ width: 20, height: 20 })"></span>
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
              <button class="info-button" title="Key features appear on the front page">
                <span v-html="feather.icons['help-circle'].toSvg({ width: 16, height: 16 })"></span>
              </button>
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
              <option v-for="type in casterTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>

          <!-- Resource Usage -->
          <div>
            <label for="has-resource" class="block text-sm font-bold mb-1">Resource Usage:</label>
            <div class="space-y-3">
              <div class="flex items-center gap-2">
                <input id="has-resource" v-model="hasResource" type="checkbox" class="usage-box" />
                <label for="has-resource" class="text-sm">Has limited uses</label>
              </div>

              <div v-if="hasResource" class="space-y-2 ml-6">
                <!-- Base Amount -->
                <div>
                  <label for="base-amount" class="block text-xs font-bold mb-1">Base Amount:</label>
                  <input
                    id="base-amount"
                    v-model="formData.resource.baseAmount"
                    type="number"
                    min="1"
                    class="edit-mode-input text-sm w-full"
                    placeholder="1"
                  />
                </div>

                <!-- Scaling Type -->
                <div>
                  <label for="scaling-type" class="block text-xs font-bold mb-1">Scaling:</label>
                  <select
                    id="scaling-type"
                    v-model="formData.resource.scaling"
                    class="edit-mode-select text-sm w-full"
                  >
                    <option value="static">Static (no scaling)</option>
                    <option value="proficiency">Proficiency Bonus</option>
                    <option value="ability">Ability Modifier</option>
                    <option value="level">Character Level</option>
                  </select>
                </div>

                <!-- Scaling Ability (only show if scaling by ability) -->
                <div v-if="formData.resource.scaling === 'ability'">
                  <label for="scaling-ability" class="block text-xs font-bold mb-1"
                    >Scaling Ability:</label
                  >
                  <select
                    id="scaling-ability"
                    v-model="formData.resource.scalingAbility"
                    class="edit-mode-select text-sm w-full"
                  >
                    <option value="str">Strength</option>
                    <option value="dex">Dexterity</option>
                    <option value="con">Constitution</option>
                    <option value="int">Intelligence</option>
                    <option value="wis">Wisdom</option>
                    <option value="cha">Charisma</option>
                  </select>
                </div>

                <!-- Reset Period -->
                <div>
                  <label for="reset-per" class="block text-xs font-bold mb-1">Resets:</label>
                  <select
                    id="reset-per"
                    v-model="formData.resource.resetPer"
                    class="edit-mode-select text-sm w-full"
                  >
                    <option value="turn">Per Turn</option>
                    <option value="round">Per Round</option>
                    <option value="encounter">Per Encounter</option>
                    <option value="short rest">Per Short Rest</option>
                    <option value="long rest">Per Long Rest</option>
                    <option value="day">Per Day</option>
                    <option value="week">Per Week</option>
                  </select>
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
            <span v-html="feather.icons.trash2.toSvg({ width: 16, height: 16 })"></span>
            Delete
          </button>
        </div>
        <div class="flex items-center gap-3">
          <button @click="handleCancel" class="icon-button">
            <span v-html="feather.icons.x.toSvg({ width: 16, height: 16 })"></span>
            Cancel
          </button>
          <button
            @click="handleSave"
            class="icon-button bg-green-600 text-white hover:bg-green-700"
          >
            <span v-html="feather.icons.save.toSvg({ width: 16, height: 16 })"></span>
            {{ isNew ? 'Add Feature' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.usage-box {
  @apply w-4 h-4 border border-sheet-border bg-white;
}
</style>
