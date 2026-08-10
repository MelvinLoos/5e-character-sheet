<script setup lang="ts">
import { computed } from 'vue'
import feather from 'feather-icons'
import * as DND_RULES from '@/data/rules'
import type { SubChoice } from '@/types/rules'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  speciesKey: {
    type: String,
    default: '',
  },
  currentSubChoice: {
    type: String as () => string | null,
    default: null,
  },
})

const emit = defineEmits(['select', 'close'])

const subChoices = computed<SubChoice[]>(() => {
  if (!props.speciesKey) return []
  const speciesData = DND_RULES.SPECIES[props.speciesKey]
  return speciesData?.subChoices ?? []
})

const speciesLabel = computed(() => {
  return props.speciesKey || 'Species'
})

function handleSelect(subChoiceId: string) {
  emit('select', subChoiceId)
}

function handleBackdropClick(event: MouseEvent) {
  if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
    emit('close')
  }
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen && subChoices.length > 0"
    class="modal-backdrop"
    @click="handleBackdropClick"
  >
    <div class="modal-content max-w-2xl w-full mx-4">
      <!-- Modal Header -->
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-fell text-sheet-red">
          Choose Your {{ speciesLabel }} Lineage
        </h2>
        <button
          data-test="modal-close-btn"
          @click="handleClose"
          class="info-button"
          title="Close"
        >
          <span v-html="feather.icons?.x?.toSvg({ width: 20, height: 20 })"></span>
        </button>
      </div>

      <!-- Sub-Choice Options -->
      <div class="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        <div
          v-for="option in subChoices"
          :key="option.id"
          :data-test="'subchoice-option'"
          :data-id="option.id"
          :class="[
            'p-4 rounded-lg border-2 cursor-pointer transition-all duration-200',
            currentSubChoice === option.id
              ? 'border-sheet-red bg-red-50 selected'
              : 'border-sheet-border hover:border-sheet-red/50 hover:bg-surface-container-high',
          ]"
          @click="handleSelect(option.id)"
        >
          <div class="flex items-center justify-between mb-1">
            <h3 class="text-lg font-bold text-on-surface">{{ option.label }}</h3>
            <span
              v-if="currentSubChoice === option.id"
              class="text-xs font-bold text-sheet-red bg-red-100 px-2 py-0.5 rounded-full"
            >
              Selected
            </span>
          </div>
          <p
            v-if="option.description"
            class="text-sm text-on-surface-variant mb-2"
          >
            {{ option.description }}
          </p>
          <div v-if="option.traits.length > 0" class="mt-2 space-y-1">
            <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              Grants
            </p>
            <ul class="list-disc list-inside text-sm text-on-surface space-y-0.5">
              <li v-for="trait in option.traits" :key="trait.title">
                <span class="font-medium">{{ trait.title }}</span>
                <span v-if="trait.desc" class="text-on-surface-variant">
                  — {{ trait.desc }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>