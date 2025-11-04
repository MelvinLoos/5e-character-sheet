<script setup>
import { useCharacterStore } from '@/stores/character'
import { formatMod } from '@/services/characterService.js'
import { watch } from 'vue'
import feather from 'feather-icons'

const store = useCharacterStore()

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

function addFeature() {
  const newFeature = {
    title: 'New Feature',
    desc: 'Enter feature description...',
    key: false,
    casterType: null,
  }

  if (props.title === 'Key Features') {
    store.currentCharacterData.features = store.currentCharacterData.features || []
    store.currentCharacterData.features.push({ ...newFeature, key: true })
  } else {
    store.currentCharacterData.features = store.currentCharacterData.features || []
    store.currentCharacterData.features.push(newFeature)
  }
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
    <div class="space-y-3 text-sm">
      <div
        v-for="(feature, index) in props.features"
        :key="feature.title + index"
        class="feature-box"
      >
        <div class="flex items-start justify-between">
          <div class="flex-grow">
            <div class="flex items-center flex-wrap">
              <input
                v-if="store.isEditing"
                v-model="feature.title"
                class="feature-title edit-mode-input font-bold"
                placeholder="Feature name"
              />
              <p v-else class="feature-title">{{ feature.title }}</p>
              <div v-if="feature.uses" class="usage-tracker ml-3">
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
            <textarea
              v-if="store.isEditing"
              v-model="feature.desc"
              class="feature-desc edit-mode-textarea w-full mt-2"
              placeholder="Feature description"
              rows="2"
            ></textarea>

            <!-- Edit mode options -->
            <div v-if="store.isEditing" class="grid grid-cols-2 gap-3 mt-2 text-xs">
              <div class="flex items-center gap-2">
                <input
                  v-model="feature.key"
                  type="checkbox"
                  class="usage-box"
                  :id="`key-${index}`"
                />
                <label :for="`key-${index}`" class="text-xs">
                  Key Feature (show on front page)
                </label>
              </div>

              <div>
                <label class="block text-xs mb-1">Spellcasting Type:</label>
                <select v-model="feature.casterType" class="edit-mode-select w-full">
                  <option :value="null">No Spellcasting</option>
                  <option value="full">Full Caster</option>
                  <option value="half">Half Caster</option>
                  <option value="third">Third Caster</option>
                  <option value="pact">Pact Magic</option>
                </select>
              </div>
            </div>

            <p
              v-else
              class="feature-desc"
              v-html="feature.desc.replace(/<li>/g, '<li class=\'list-disc list-inside\'>')"
            ></p>
          </div>
          <button
            v-if="store.isEditing && props.editable"
            @click="removeFeature(index)"
            class="icon-button text-xs p-1 ml-2 bg-red-600 hover:bg-red-700"
            title="Remove Feature"
          >
            <span v-html="feather.icons.x.toSvg({ width: 12, height: 12 })"></span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
