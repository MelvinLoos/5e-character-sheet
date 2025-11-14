<script setup>
import { useCharacterStore } from '@/stores/character'
import { watch, computed, ref } from 'vue'
import feather from 'feather-icons'
import draggable from 'vuedraggable'
import FeatureEditorModal from '@/components/modals/FeatureEditorModal.vue'

const store = useCharacterStore()

// Modal state
const isModalOpen = ref(false)
const editingFeature = ref({})
const isNewFeature = ref(false)
const editingIndex = ref(-1)

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
const editableFeatures = computed({
  get() {
    return props.features
  },
  set(value) {
    // Update the main features array in the store based on feature type
    if (props.title === 'Key Features') {
      const allFeatures = store.currentCharacterData.features || []
      const otherFeatures = allFeatures.filter((f) => !f.key)
      store.currentCharacterData.features = [...value, ...otherFeatures]
    } else {
      const allFeatures = store.currentCharacterData.features || []
      const keyFeatures = allFeatures.filter((f) => f.key)
      store.currentCharacterData.features = [...keyFeatures, ...value]
    }
  },
})

function addFeature() {
  editingFeature.value = {}
  isNewFeature.value = true
  editingIndex.value = -1
  isModalOpen.value = true
}

function editFeature(feature, index) {
  editingFeature.value = { ...feature }
  isNewFeature.value = false
  editingIndex.value = index
  isModalOpen.value = true
}

function handleModalSave(featureData) {
  if (isNewFeature.value) {
    // Add new feature
    if (props.title === 'Key Features') {
      featureData.key = true
    }
    
    store.currentCharacterData.features = store.currentCharacterData.features || []
    store.currentCharacterData.features.push(featureData)
  } else {
    // Update existing feature
    if (props.title === 'Key Features') {
      const allFeatures = store.currentCharacterData.features || []
      const keyFeatures = allFeatures.filter((f) => f.key)
      const featureToUpdate = keyFeatures[editingIndex.value]
      const featureIndex = allFeatures.findIndex((f) => f === featureToUpdate)
      if (featureIndex !== -1) {
        allFeatures[featureIndex] = { ...featureData, key: true }
      }
    } else {
      const allFeatures = store.currentCharacterData.features || []
      const otherFeatures = allFeatures.filter((f) => !f.key)
      const featureToUpdate = otherFeatures[editingIndex.value]
      const featureIndex = allFeatures.findIndex((f) => f === featureToUpdate)
      if (featureIndex !== -1) {
        allFeatures[featureIndex] = featureData
      }
    }
  }
  
  isModalOpen.value = false
  store.recalculateAbilityScores()
}

function handleModalCancel() {
  isModalOpen.value = false
}

function handleModalDelete() {
  if (!isNewFeature.value) {
    removeFeature(editingIndex.value)
  }
  isModalOpen.value = false
}

function removeFeature(index) {
  if (props.title === 'Key Features') {
    const allFeatures = store.currentCharacterData.features || []
    const keyFeatures = allFeatures.filter((f) => f.key)
    const featureToRemove = keyFeatures[index]
    const featureIndex = allFeatures.findIndex((f) => f === featureToRemove)
    if (featureIndex !== -1) {
      allFeatures.splice(featureIndex, 1)
    }
  } else {
    const allFeatures = store.currentCharacterData.features || []
    const otherFeatures = allFeatures.filter((f) => !f.key)
    const featureToRemove = otherFeatures[index]
    const featureIndex = allFeatures.findIndex((f) => f === featureToRemove)
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
      <button
        v-if="store.isEditing && props.editable"
        @click="addFeature"
        class="icon-button text-xs p-1"
        title="Add Feature"
      >
        <span v-html="feather.icons.plus.toSvg({ width: 14, height: 14 })"></span>
      </button>
    </div>
    <draggable
      v-model="editableFeatures"
      item-key="title"
      tag="div"
      class="space-y-3 text-sm"
      :disabled="!store.isEditing"
      handle=".drag-handle"
      ghost-class="ghost-item"
      chosen-class="chosen-item"
      drag-class="drag-item"
    >
      <template #item="{ element: feature, index }">
        <div class="feature-box relative">
          <!-- Drag handle - only show in edit mode -->
          <div
            v-if="store.isEditing"
            class="drag-handle absolute left-2 top-2 cursor-move opacity-40 hover:opacity-70 z-10"
            title="Drag to reorder"
          >
            <span v-html="feather.icons['move'].toSvg({ width: 16, height: 16 })"></span>
          </div>

          <div class="flex items-start justify-between" :class="{ 'ml-6': store.isEditing }">
            <div class="flex-grow">
              <div class="flex items-center flex-wrap">
                <p class="feature-title">{{ feature.title }}</p>
                <!-- Resource usage display - using new schema format -->
                <div v-if="feature.resource" class="usage-tracker ml-3">
                  <div class="flex items-center gap-2">
                    <input
                      v-for="n in store.getFeatureMaxUses(feature)"
                      :key="n"
                      type="checkbox"
                      class="usage-box"
                    />
                    <span class="text-xs italic text-gray-500">per {{ feature.resource.resetPer }}</span>
                  </div>
                </div>
                <!-- Legacy uses format for backward compatibility -->
                <div v-else-if="feature.uses" class="usage-tracker ml-3">
                  <div class="flex items-center gap-2">
                    <input
                      v-for="n in feature.uses.total"
                      :key="n"
                      type="checkbox"
                      class="usage-box"
                    />
                    <span class="text-xs italic text-gray-500">per {{ feature.uses.per }}</span>
                  </div>
                </div>
              </div>

              <p
                class="feature-desc"
                v-html="feature.desc.replace(/<li>/g, '<li class=\'list-disc list-inside\'>')"
              ></p>
            </div>
            
            <!-- Action buttons -->
            <div v-if="store.isEditing && props.editable" class="flex items-center gap-1 ml-2">
              <button
                @click="editFeature(feature, index)"
                class="icon-button text-xs p-1 bg-blue-600 hover:bg-blue-700"
                title="Edit Feature"
              >
                <span v-html="feather.icons.edit2.toSvg({ width: 12, height: 12 })"></span>
              </button>
              <button
                @click="removeFeature(index)"
                class="icon-button text-xs p-1 bg-red-600 hover:bg-red-700"
                title="Remove Feature"
              >
                <span v-html="feather.icons.x.toSvg({ width: 12, height: 12 })"></span>
              </button>
            </div>
          </div>
        </div>
      </template>
    </draggable>

    <div
      v-if="store.isEditing && props.features.length === 0"
      class="text-center text-gray-500 italic py-4"
    >
      No {{ props.title.toLowerCase() }} defined. Click the + button to add
      {{ props.title.toLowerCase() }}.
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
