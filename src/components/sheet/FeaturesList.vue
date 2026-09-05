<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import { useRulesStore } from '@/stores/rulesStore'
import { watch, computed, ref } from 'vue'
import draggable from 'vuedraggable'
import type { CharacterFeature } from '@/types/character'
import ElevatedCard from '@/components/ui/ElevatedCard.vue'
import ExpandableText from '@/components/ui/ExpandableText.vue'

const store = useCharacterStore()
const rulesStore = useRulesStore()

// Modal state
const isModalOpen = ref(false)
const showFeatureLibrary = ref(false)
const searchFilter = ref('')
const editingFeature = ref<Record<string, unknown>>({})
const isNewFeature = ref(false)
const editingFeatureRef = ref<CharacterFeature | null>(null) // Direct reference to the feature being edited

// Expansion state
const expandedFeatures = ref<Set<string>>(new Set())

function toggleExpand(title: string) {
  if (expandedFeatures.value.has(title)) {
    expandedFeatures.value.delete(title)
  } else {
    expandedFeatures.value.add(title)
  }
}

function formattedDesc(feature: CharacterFeature): string {
  return feature.desc
    .replace(
      /<li>/g,
      "<li class='pl-4 relative before:content-[\\'\\'] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-tertiary before:rounded-full'>",
    )
    .replace(/<ul>/g, "<ul class='list-none space-y-2 relative my-2'>")
}

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
const editableFeatures = computed<CharacterFeature[]>({
  get() {
    return props.features as CharacterFeature[]
  },
  set(value: CharacterFeature[]) {
    // Update the main features array in the store based on feature type
    if (props.title === 'Key Features') {
      const allFeatures = store.currentCharacterData.features || []
      const otherFeatures = allFeatures.filter((f: CharacterFeature) => !f.key)
      const normalized = value.map((v) => ({
        ...v,
        uses: v.uses
          ? { total: (v.uses.total as number) || 0, per: (v.uses.per as string) || '' }
          : undefined,
      })) as unknown as typeof store.currentCharacterData.features
      store.currentCharacterData.features = [...normalized, ...otherFeatures]
    } else {
      const allFeatures = store.currentCharacterData.features || []
      const keyFeatures = allFeatures.filter((f: CharacterFeature) => f.key)
      const normalized = value.map((v) => ({
        ...v,
        uses: v.uses
          ? { total: (v.uses.total as number) || 0, per: (v.uses.per as string) || '' }
          : undefined,
      })) as unknown as typeof store.currentCharacterData.features
      store.currentCharacterData.features = [...keyFeatures, ...normalized]
    }
  },
})

// Available features from rulesStore
const availableFeatures = computed(() => {
  return (rulesStore.allFeats as CharacterFeature[]) || []
})

// Filter features
const libraryFeatures = computed(() => {
  let filtered = availableFeatures.value

  // Apply search filter
  if (searchFilter.value.trim()) {
    const search = searchFilter.value.toLowerCase()
    filtered = filtered.filter(
      (f: CharacterFeature) =>
        f.title.toLowerCase().includes(search) || (f.desc && f.desc.toLowerCase().includes(search)),
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

function addFeatureFromLibrary(feature: CharacterFeature): void {
  // Create a copy of the feature
  const newFeature = { ...feature }

  // If adding to Key Features, mark it as key
  if (props.title === 'Key Features') {
    newFeature.key = true
  }

  store.currentCharacterData.features = store.currentCharacterData.features || []
  store.currentCharacterData.features.push(
    newFeature as unknown as (typeof store.currentCharacterData.features)[number],
  )

  // Trigger recalculation
  store.recalculateAbilityScores()

  // Close library
  showFeatureLibrary.value = false
}

function editFeature(feature: CharacterFeature): void {
  editingFeature.value = { ...feature }
  editingFeatureRef.value = feature // Keep direct reference to original feature
  isNewFeature.value = false
  isModalOpen.value = true
}

function handleModalSave(featureData: CharacterFeature): void {
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
        ? {
            total: (featureData.uses.total as number) || 0,
            per: (featureData.uses.per as string) || '',
          }
        : undefined,
    } as unknown as (typeof store.currentCharacterData.features)[number]
    store.currentCharacterData.features.push(normalizedFeature)
  } else {
    // Update existing feature using direct reference
    if (editingFeatureRef.value) {
      // Find the feature in the main array and update it
      const allFeatures = store.currentCharacterData.features || []
      const featureIndex = allFeatures.findIndex((f: CharacterFeature) => f === editingFeatureRef.value)
      if (featureIndex !== -1) {
        // Preserve the key property for Key Features
        if (props.title === 'Key Features') {
          featureData.key = true
        }
        const normalizedFeature = {
          ...featureData,
          uses: featureData.uses
            ? {
                total: (featureData.uses.total as number) || 0,
                per: (featureData.uses.per as string) || '',
              }
            : undefined,
        } as unknown as (typeof store.currentCharacterData.features)[number]
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

function handleModalDelete(): void {
  if (!isNewFeature.value && editingFeatureRef.value) {
    const allFeatures = store.currentCharacterData.features || []
    const featureIndex = allFeatures.findIndex((f: CharacterFeature) => f === editingFeatureRef.value)
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
    const keyFeatures = allFeatures.filter((f: CharacterFeature) => f.key)
    const featureToRemove = keyFeatures[index]
    const featureIndex = allFeatures.findIndex((f: CharacterFeature) => f === featureToRemove)
    if (featureIndex !== -1) {
      allFeatures.splice(featureIndex, 1)
    }
  } else {
    const allFeatures = store.currentCharacterData.features || []
    const otherFeatures = allFeatures.filter((f: CharacterFeature) => !f.key)
    const featureToRemove = otherFeatures[index]
    const featureIndex = allFeatures.findIndex((f: CharacterFeature) => f === featureToRemove)
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
    <div class="flex items-center justify-between mb-4 border-b border-outline-variant/50 pb-2">
      <h2
        class="font-headline-md text-headline-md text-primary flex items-center gap-2 m-0 bg-transparent select-none"
      >
        <span class="material-symbols-outlined">{{
          props.title === 'Key Features' ? 'star' : 'library_books'
        }}</span>
        {{ props.title }}
      </h2>
      <button
        v-if="store.isEditing && props.editable"
        @click="addFeature"
        class="w-8 h-8 rounded-full bg-primary-container border border-primary/50 text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 transition-all duration-200 ease-out shadow-sm select-none"
        title="Add Feature"
      >
        <span class="material-symbols-outlined text-[18px]">add</span>
      </button>
    </div>

    <draggable
      v-model="editableFeatures"
      item-key="title"
      tag="div"
      class="space-y-4"
      :disabled="!store.isEditing"
      handle=".drag-handle"
      ghost-class="ghost-item"
      chosen-class="chosen-item"
      drag-class="drag-item"
    >
      <template #item="{ element: feature, index }">
        <ElevatedCard :elevation="1">
          <div
            class="border border-primary-container p-4 rounded-lg hover:border-tertiary/50 transition-colors group relative"
          >
            <!-- Drag handle - only show in edit mode -->
            <div
              v-if="store.isEditing"
              class="drag-handle absolute -left-2 top-4 lg:-left-4 lg:hidden group-hover:flex cursor-move text-outline-variant hover:text-primary z-10 bg-surface-container rounded-full shadow-sm"
              title="Drag to reorder"
            >
              <span class="material-symbols-outlined text-[20px]">drag_indicator</span>
            </div>

            <div class="flex flex-col gap-2 relative z-0">
              <!-- Header section -->
              <div class="flex items-start justify-between">
                <div class="flex-1 cursor-pointer select-none" @click="toggleExpand(feature.title)">
                  <div
                    class="flex items-center gap-2 group-hover:text-tertiary transition-colors mb-2"
                  >
                    <span
                      class="material-symbols-outlined text-outline text-[20px] transition-transform"
                      :class="{ 'rotate-90': expandedFeatures.has(feature.title) }"
                      >chevron_right</span
                    >
                    <h3 class="font-headline-md text-headline-md text-tertiary m-0">
                      {{ feature.title }}
                    </h3>
                  </div>

                  <!-- Chips section -->
                  <div class="flex flex-wrap gap-2 pl-7">
                    <ActionBadge
                      v-if="feature.actionType"
                      :action-type="feature.actionType"
                      size="sm"
                      class="inline-block bg-primary-container/30 border border-primary/20 px-2 py-0.5 rounded text-secondary-fixed-dim font-label-md text-[12px]"
                    />

                    <!-- Resource usage display -->
                    <div
                      v-if="feature.resource"
                      class="inline-flex items-center gap-1.5 bg-primary-container/30 border border-primary/20 px-2 py-0.5 rounded text-secondary-fixed-dim font-label-md text-[12px]"
                    >
                      <div class="flex items-center gap-1" @click.stop>
                        <input
                          v-for="n in store.getFeatureMaxUses(feature)"
                          :key="n"
                          type="checkbox"
                          class="usage-box w-3 h-3 appearance-none border border-secondary-fixed-dim/50 rounded-sm checked:bg-tertiary checked:border-tertiary focus:ring-1 focus:ring-tertiary focus:ring-offset-1 focus:ring-offset-surface-container"
                        />
                      </div>
                      <span v-if="feature.resource.reset" class="opacity-80"
                        >/ {{ feature.resource.reset }}</span
                      >
                    </div>
                    <!-- Legacy uses format -->
                    <div
                      v-else-if="feature.uses"
                      class="inline-flex items-center gap-1.5 bg-primary-container/30 border border-primary/20 px-2 py-0.5 rounded text-secondary-fixed-dim font-label-md text-[12px]"
                    >
                      <div class="flex items-center gap-1" @click.stop>
                        <input
                          v-for="n in feature.uses.total"
                          :key="n"
                          type="checkbox"
                          class="usage-box w-3 h-3 appearance-none border border-secondary-fixed-dim/50 rounded-sm checked:bg-tertiary checked:border-tertiary focus:ring-1 focus:ring-tertiary focus:ring-offset-1 focus:ring-offset-surface-container"
                        />
                      </div>
                      <span v-if="feature.uses.per" class="opacity-80">/ {{ feature.uses.per }}</span>
                    </div>
                  </div>
                </div>

                <!-- Action buttons -->
                <div
                  v-if="store.isEditing && props.editable"
                  class="flex flex-col sm:flex-row items-center gap-2 ml-4"
                >
                  <button
                    @click.stop="editFeature(feature)"
                    class="w-8 h-8 rounded-full bg-surface-variant/50 border border-outline-variant/30 text-on-surface-variant flex items-center justify-center hover:bg-surface-variant hover:text-primary hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:scale-95 transition-all duration-200 ease-out select-none"
                    title="Edit Feature"
                  >
                    <span class="material-symbols-outlined text-[16px]">edit</span>
                  </button>
                  <button
                    @click.stop="removeFeature(index)"
                    class="w-8 h-8 rounded-full bg-surface-variant/50 border border-outline-variant/30 text-on-surface-variant flex items-center justify-center hover:bg-error/20 hover:text-error hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:bg-error/30 active:scale-95 transition-all duration-200 ease-out select-none"
                    title="Remove Feature"
                  >
                    <span class="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>

              <!-- Description (Expandable) -->
              <div
                v-show="expandedFeatures.has(feature.title)"
                class="pl-7 pt-2 font-body-md text-body-md text-on-surface-variant leading-relaxed"
              >
                <div
                  v-html="formattedDesc(feature)"
                ></div>
              </div>
            </div>
          </div>
        </ElevatedCard>
      </template>
    </draggable>

    <div
      v-if="store.isEditing && props.features.length === 0"
      class="text-center font-body-md text-on-surface-variant italic py-8 border border-dashed border-outline-variant/30 rounded-lg mt-4 select-none"
    >
      No {{ props.title.toLowerCase() }} transcribed. Click the + icon to catalog a new entry.
    </div>

    <!-- Feature Editor Modal -->
    <FeatureEditorModal
      :is-open="isModalOpen"
      :feature="editingFeature"
      :is-new="isNewFeature"
      @save="handleModalSave"
      @cancel="handleModalCancel"
      @delete="handleModalDelete"
    />

    <!-- Feature Library Modal -->
    <div
      v-if="showFeatureLibrary"
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-surface-container rounded-lg shadow-elevation-4 border border-outline-variant/30 w-full max-w-2xl max-h-[80vh] flex flex-col"
      >
        <div
          class="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low rounded-t-lg"
        >
          <h3
            class="font-headline-md text-headline-md text-tertiary flex items-center gap-2 m-0 bg-transparent select-none"
          >
            <span class="material-symbols-outlined">library_books</span>
            Feature Archives
          </h3>
          <button
            @click="showFeatureLibrary = false"
            class="text-outline-variant hover:text-on-surface hover:-translate-y-0.5 hover:bg-surface-variant/50 active:translate-y-0 active:scale-95 transition-all duration-200 ease-out flex items-center justify-center p-1 rounded select-none"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="p-4 border-b border-outline-variant/30 bg-surface-container-low">
          <div class="relative">
            <span
              class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
              >search</span
            >
            <input
              v-model="searchFilter"
              type="text"
              placeholder="Search the archives..."
              class="w-full bg-surface-container border border-outline-variant rounded py-2 pl-10 pr-4 text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none font-body-md text-body-md placeholder:text-outline-variant transition-colors shadow-sm"
              autofocus
            />
          </div>
        </div>

        <div class="overflow-y-auto flex-grow p-4 bg-surface-container">
          <div
            v-if="libraryFeatures.length === 0"
            class="text-center py-8 font-body-md text-on-surface-variant select-none"
          >
            <p>No archives match your inquiry.</p>
            <button
              @click="addManualFeature"
              class="mt-4 text-tertiary hover:text-tertiary-fixed hover:-translate-y-0.5 active:translate-y-0 active:scale-95 underline underline-offset-4 transition-all duration-200 ease-out select-none"
            >
              Transcribe a Custom Entry
            </button>
          </div>

          <div v-else class="space-y-4">
            <ElevatedCard
              v-for="(feature, index) in libraryFeatures"
              :key="index"
              :elevation="1"
              :class="[
                'border border-primary-container p-4 rounded-lg flex flex-col gap-2 hover:border-tertiary/50 transition-colors group relative cursor-pointer',
                'bg-surface-container-low',
              ]"
              @click="addFeatureFromLibrary(feature)"
            >
              <div class="flex justify-between items-start gap-4">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-1">
                    <h4 class="font-headline-md text-tertiary m-0">{{ feature.title }}</h4>
                    <span
                      v-if="feature.source"
                      class="text-[12px] bg-primary-container/30 border border-primary/20 px-2 py-0.5 rounded text-secondary-fixed-dim font-label-md select-none"
                    >
                      {{ feature.source }}
                    </span>
                  </div>
                  <ExpandableText
                    :text="feature.desc"
                    :lines="2"
                    text-class="font-body-md text-body-md text-on-surface-variant leading-relaxed"
                  />
                </div>
                <button
                  class="w-8 h-8 rounded-full bg-primary-container border border-primary/50 text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 transition-all duration-200 ease-out shadow-sm opacity-0 group-hover:opacity-100 flex-shrink-0 select-none"
                  title="Transcribe Feat"
                >
                  <span class="material-symbols-outlined">add</span>
                </button>
              </div>
            </ElevatedCard>
          </div>
        </div>

        <div
          class="p-4 border-t border-outline-variant/30 bg-surface-container-low flex justify-between items-center rounded-b-lg"
        >
          <span class="font-label-md text-on-surface-variant select-none"
            >{{ libraryFeatures.length }} entries available</span
          >
          <button
            @click="addManualFeature"
            class="px-4 py-2 bg-surface-variant text-on-surface hover:bg-surface-bright hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:scale-95 border border-outline-variant/50 hover:border-outline font-label-md rounded transition-all duration-200 ease-out shadow-sm select-none"
          >
            Create Custom Entry
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
  background: var(--color-surface-container-high);
  border: 1px dashed var(--color-tertiary);
}

.chosen-item {
  transform: scale(1.01);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  z-index: 10;
}

.drag-item {
  opacity: 0.9;
}
</style>
