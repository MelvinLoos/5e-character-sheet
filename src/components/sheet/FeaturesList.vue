<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import { useRulesStore } from '@/stores/rulesStore'
import { watch, computed, ref } from 'vue'
import feather from 'feather-icons'
import draggable from 'vuedraggable'
import FeatureEditorModal from '@/components/modals/FeatureEditorModal.vue'
import ActionBadge from '@/components/ui/ActionBadge.vue'

// Define Feature interface
interface LocalFeature {
  title: string
  desc: string
  key?: boolean
  source?: string
  featureType?: string
  actionType?: string
  // Match store.Feature typing: casterType may be string|null
  casterType?: string | null
  // Resource follows store shape or can be null/undefined
  resource?: { resourceType: string; value?: number; scalingStat?: string | null; reset?: string } | null
  // uses legacy shape
  uses?: { total?: number; per?: string } | null
  grantsSpells?: boolean
  grantedSpellLevels?: number[]
  [key: string]: unknown
}

const store = useCharacterStore()
const rulesStore = useRulesStore()

// Modal state
const isModalOpen = ref(false)
const showFeatureLibrary = ref(false)
const searchFilter = ref('')
const editingFeature = ref<Record<string, unknown>>({})
const isNewFeature = ref(false)
const editingFeatureRef = ref<LocalFeature | null>(null) // Direct reference to the feature being edited

const props = defineProps({
  features: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: 'Features',
  },
  editable: {
    type: Boolean,
    default: true,
  },
})

// Create a computed property for draggable features
const editableFeatures = computed<LocalFeature[]>({
  get() {
    return props.features as LocalFeature[]
  },
  set(value: LocalFeature[]) {
    // Update the main features array in the store based on feature type
    if (props.title === 'Key Features') {
      const allFeatures = store.currentCharacterData.features || []
      const otherFeatures = allFeatures.filter((f: LocalFeature) => !f.key)
      const normalized = value.map((v) => ({
        ...v,
        uses: v.uses ? { total: (v.uses.total as number) || 0, per: (v.uses.per as string) || '' } : undefined,
      })) as unknown as typeof store.currentCharacterData.features
      store.currentCharacterData.features = [...normalized, ...otherFeatures]
    } else {
      const allFeatures = store.currentCharacterData.features || []
      const keyFeatures = allFeatures.filter((f: LocalFeature) => f.key)
      const normalized = value.map((v) => ({
        ...v,
        uses: v.uses ? { total: (v.uses.total as number) || 0, per: (v.uses.per as string) || '' } : undefined,
      })) as unknown as typeof store.currentCharacterData.features
      store.currentCharacterData.features = [...keyFeatures, ...normalized]
    }
  },
})

// Available features from rulesStore
const availableFeatures = computed(() => {
  return (rulesStore.allFeats as LocalFeature[]) || []
})

// Filter features
const libraryFeatures = computed(() => {
  let filtered = availableFeatures.value

  // Apply search filter
  if (searchFilter.value.trim()) {
    const search = searchFilter.value.toLowerCase()
    filtered = filtered.filter((f: LocalFeature) =>
      f.title.toLowerCase().includes(search) ||
      (f.desc && f.desc.toLowerCase().includes(search))
    )
  }

  // Sort by name
  return filtered.sort((a, b) => a.title.localeCompare(b.title))
})

function addFeature() {
  // If we have features in the library, show the library instead
  if (availableFeatures.value.length > 0) {
    showFeatureLibrary.value = true
    searchFilter.value = '' // Reset filter
    return
  }

  addManualFeature()
}

function addManualFeature() {
  editingFeature.value = {}
  editingFeatureRef.value = null
  isNewFeature.value = true
  isModalOpen.value = true
  showFeatureLibrary.value = false
}

function addFeatureFromLibrary(feature: LocalFeature) {
  // Create a copy of the feature
  const newFeature = { ...feature }

  // If adding to Key Features, mark it as key
  if (props.title === 'Key Features') {
    newFeature.key = true
  }

  store.currentCharacterData.features = store.currentCharacterData.features || []
  store.currentCharacterData.features.push(newFeature as any)

  // Trigger recalculation
  store.recalculateAbilityScores()

  // Close library
  showFeatureLibrary.value = false
}

function editFeature(feature: LocalFeature) {
  editingFeature.value = { ...feature }
  editingFeatureRef.value = feature // Keep direct reference to original feature
  isNewFeature.value = false
  isModalOpen.value = true
}

function handleModalSave(featureData: LocalFeature) {
  if (isNewFeature.value) {
    // Add new feature
    if (props.title === 'Key Features') {
      featureData.key = true
    }

    store.currentCharacterData.features = store.currentCharacterData.features || []
    // Normalize legacy uses shape to ensure required properties
    const normalizedFeature = {
      ...featureData,
      uses: featureData.uses
        ? { total: (featureData.uses.total as number) || 0, per: (featureData.uses.per as string) || '' }
        : undefined,
    } as unknown as typeof store.currentCharacterData.features[number]
    store.currentCharacterData.features.push(normalizedFeature)
  } else {
    // Update existing feature using direct reference
    if (editingFeatureRef.value) {
      // Find the feature in the main array and update it
      const allFeatures = store.currentCharacterData.features || []
      const featureIndex = allFeatures.findIndex((f: LocalFeature) => f === editingFeatureRef.value)
      if (featureIndex !== -1) {
        // Preserve the key property for Key Features
        if (props.title === 'Key Features') {
          featureData.key = true
        }
        const normalizedFeature = {
          ...featureData,
          uses: featureData.uses
            ? { total: (featureData.uses.total as number) || 0, per: (featureData.uses.per as string) || '' }
            : undefined,
        } as unknown as typeof store.currentCharacterData.features[number]
        allFeatures[featureIndex] = normalizedFeature
      }
    }
  }

  isModalOpen.value = false
  editingFeatureRef.value = null
  store.recalculateAbilityScores()
}
function handleModalCancel() {
  isModalOpen.value = false
  editingFeatureRef.value = null
}

function handleModalDelete() {
  if (!isNewFeature.value && editingFeatureRef.value) {
    const allFeatures = store.currentCharacterData.features || []
    const featureIndex = allFeatures.findIndex((f: LocalFeature) => f === editingFeatureRef.value)
    if (featureIndex !== -1) {
      allFeatures.splice(featureIndex, 1)
    }
    store.recalculateAbilityScores()
  }
  isModalOpen.value = false
  editingFeatureRef.value = null
}

function removeFeature(index: number) {
  if (props.title === 'Key Features') {
    const allFeatures = store.currentCharacterData.features || []
    const keyFeatures = allFeatures.filter((f: LocalFeature) => f.key)
    const featureToRemove = keyFeatures[index]
    const featureIndex = allFeatures.findIndex((f: LocalFeature) => f === featureToRemove)
    if (featureIndex !== -1) {
      allFeatures.splice(featureIndex, 1)
    }
  } else {
    const allFeatures = store.currentCharacterData.features || []
    const otherFeatures = allFeatures.filter((f: LocalFeature) => !f.key)
    const featureToRemove = otherFeatures[index]
    const featureIndex = allFeatures.findIndex((f: LocalFeature) => f === featureToRemove)
    if (featureIndex !== -1) {
      allFeatures.splice(featureIndex, 1)
    }
  }

  // Trigger spellcasting recalculation when features change
  store.recalculateAbilityScores()
}

// Watch for changes in features to trigger spellcasting updates
watch(
  () => store.currentCharacterData?.features,
  () => {
    if (store.currentCharacterData) {
      store.recalculateAbilityScores()
    }
  },
  { deep: true },
)
</script>

<template>
  <section v-if="props.features.length > 0 || store.isEditing">
    <div class="flex items-center justify-between mb-3">
      <h2 class="section-header mb-0">{{ props.title }}</h2>
      <button v-if="store.isEditing && props.editable" @click="addFeature" class="icon-button text-xs p-1"
        title="Add Feature">
        <span v-html="feather.icons?.plus?.toSvg({ width: 14, height: 14 })"></span>
      </button>
    </div>
    <draggable v-model="editableFeatures" item-key="title" tag="div" class="space-y-3 text-sm"
      :disabled="!store.isEditing" handle=".drag-handle" ghost-class="ghost-item" chosen-class="chosen-item"
      drag-class="drag-item">
      <template #item="{ element: feature, index }">
        <div class="feature-box relative">
          <!-- Drag handle - only show in edit mode -->
          <div v-if="store.isEditing"
            class="drag-handle absolute left-2 top-2 cursor-move opacity-40 hover:opacity-70 z-10"
            title="Drag to reorder">
            <span v-html="feather.icons?.['move']?.toSvg({ width: 16, height: 16 })"></span>
          </div>

          <div class="flex items-start justify-between" :class="{ 'ml-6': store.isEditing }">
            <div class="flex-grow">
              <div class="flex items-center flex-wrap gap-2">
                <p class="feature-title">{{ feature.title }}</p>
                <!-- Action Economy Badge -->
                <ActionBadge v-if="feature.actionType" :action-type="feature.actionType" size="md" />
                <!-- Resource usage display - using new schema format -->
                <div v-if="feature.resource" class="usage-tracker">
                  <div class="flex items-center gap-2">
                    <input v-for="n in store.getFeatureMaxUses(feature)" :key="n" type="checkbox" class="usage-box" />
                    <span class="text-xs italic text-gray-500">per {{ feature.resource.reset }}</span>
                  </div>
                </div>
                <!-- Legacy uses format for backward compatibility -->
                <div v-else-if="feature.uses" class="usage-tracker">
                  <div class="flex items-center gap-2">
                    <input v-for="n in feature.uses.total" :key="n" type="checkbox" class="usage-box" />
                    <span class="text-xs italic text-gray-500">per {{ feature.uses.per }}</span>
                  </div>
                </div>
              </div>

              <p class="feature-desc" v-html="feature.desc.replace(/<li>/g, '<li class=\'list-disc list-inside\'>')">
              </p>
            </div>

            <!-- Action buttons -->
            <div v-if="store.isEditing && props.editable" class="flex items-center gap-1 ml-2">
              <button @click="editFeature(feature)" class="icon-button text-xs p-1 bg-blue-600 hover:bg-blue-700"
                title="Edit Feature">
                <span v-html="feather.icons?.['edit-2']?.toSvg({ width: 12, height: 12 })"></span>
              </button>
              <button @click="removeFeature(index)" class="icon-button text-xs p-1 bg-red-600 hover:bg-red-700"
                title="Remove Feature">
                <span v-html="feather.icons?.x?.toSvg({ width: 12, height: 12 })"></span>
              </button>
            </div>
          </div>
        </div>
      </template>
    </draggable>

    <div v-if="store.isEditing && props.features.length === 0" class="text-center text-gray-500 italic py-4">
      No {{ props.title.toLowerCase() }} defined. Click the + button to add
      {{ props.title.toLowerCase() }}.
    </div>

    <!-- Feature Editor Modal -->
    <FeatureEditorModal :is-open="isModalOpen" :feature="editingFeature" :is-new="isNewFeature" @save="handleModalSave"
      @cancel="handleModalCancel" @delete="handleModalDelete" />

    <!-- Feature Library Modal -->
    <div v-if="showFeatureLibrary" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div class="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
          <h3 class="font-bold text-lg">Feature Library</h3>
          <button @click="showFeatureLibrary = false" class="text-gray-500 hover:text-gray-700">
            <span v-html="feather.icons.x.toSvg()"></span>
          </button>
        </div>

        <div class="p-4 border-b bg-gray-50">
          <div class="relative">
            <input
              v-model="searchFilter"
              type="text"
              placeholder="Search features..."
              class="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              autofocus
            />
            <span class="absolute left-3 top-2.5 text-gray-400" v-html="feather.icons.search.toSvg({ width: 18, height: 18 })"></span>
          </div>
        </div>

        <div class="overflow-y-auto flex-grow p-4">
          <div v-if="libraryFeatures.length === 0" class="text-center py-8 text-gray-500">
            <p>No features found matching your search.</p>
            <button @click="addManualFeature" class="mt-4 text-purple-600 hover:text-purple-800 underline">
              Add Custom Feature Manually
            </button>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(feature, index) in libraryFeatures"
              :key="index"
              class="border rounded-lg p-3 hover:bg-purple-50 cursor-pointer transition-colors group"
              @click="addFeatureFromLibrary(feature)"
            >
              <div class="flex justify-between items-start">
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="font-bold text-purple-700 group-hover:text-purple-900">{{ feature.title }}</h4>
                    <span v-if="feature.source" class="text-xs bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                      {{ feature.source }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 mt-1 line-clamp-2">{{ feature.desc }}</p>
                </div>
                <button class="text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span v-html="feather.icons['plus-circle'].toSvg()"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 border-t bg-gray-50 flex justify-between items-center rounded-b-lg">
          <span class="text-sm text-gray-500">{{ libraryFeatures.length }} features available</span>
          <button
            @click="addManualFeature"
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded transition-colors text-sm font-medium"
          >
            Create Custom Feature
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Drag and drop styling */
.drag-handle {
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
