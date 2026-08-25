<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import feather from 'feather-icons'
import type { FeatureChoice } from '@/types/rules'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  choice: {
    type: Object as () => FeatureChoice | null,
    default: null,
  },
  currentSelections: {
    type: Array as () => string[],
    default: () => [] as string[],
  },
  /** The effective max count, accounting for tier scaling. */
  effectiveMaxCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['select', 'close'])

const choice = computed<FeatureChoice | null>(() => props.choice)

const selectedIds = ref<string[]>([...props.currentSelections])

// Reset selections whenever the modal opens with new data
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      selectedIds.value = [...props.currentSelections]
    }
  },
)

const maxCount = computed(() => {
  return props.effectiveMaxCount
})

const remainingCount = computed(() => {
  return Math.max(0, maxCount.value - selectedIds.value.length)
})

const canConfirm = computed(() => {
  return selectedIds.value.length <= maxCount.value
})

function isSelected(optionId: string): boolean {
  return selectedIds.value.includes(optionId)
}

function toggleOption(optionId: string) {
  if (isSelected(optionId)) {
    selectedIds.value = selectedIds.value.filter((id) => id !== optionId)
  } else if (selectedIds.value.length < maxCount.value) {
    selectedIds.value = [...selectedIds.value, optionId]
  }
}

function handleConfirm() {
  // Snapshot selected IDs before emitting to prevent reactive
  // side effects from overwriting them during parent re-renders.
  const snapshot = [...selectedIds.value]
  emit('select', snapshot)
  emit('close')
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
  <Teleport to="body">
    <div
      v-if="isOpen && choice"
      class="modal-backdrop"
      @click="handleBackdropClick"
    >
      <div class="modal-content max-w-2xl w-full mx-4">
        <!-- Modal Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-fell text-tertiary">
              {{ choice.label }}
            </h2>
            <p
              v-if="choice.description"
              class="text-sm text-on-surface-variant mt-1"
            >
              {{ choice.description }}
            </p>
          </div>
          <button
            data-test="modal-close-btn"
            @click="handleClose"
            class="info-button"
            title="Close"
          >
            <span v-html="feather.icons?.x?.toSvg({ width: 20, height: 20 })"></span>
          </button>
        </div>

        <!-- Selection Counter -->
        <div
          class="mb-4 flex items-center gap-2 text-sm font-semibold"
          :class="remainingCount === 0 ? 'text-green-400' : 'text-on-surface-variant'"
        >
          <span
            v-if="remainingCount === 0"
            class="material-symbols-outlined text-base"
          >check_circle</span>
          <span v-else class="material-symbols-outlined text-base">info</span>
          <span data-test="remaining-count">
            {{ selectedIds.length }} / {{ maxCount }} selected
            <template v-if="remainingCount > 0">
              — {{ remainingCount }} remaining
            </template>
          </span>
        </div>

        <!-- Feature Choice Options -->
        <div class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div
            v-for="option in choice.options"
            :key="option.id"
            :data-test="'feature-choice-option'"
            :data-id="option.id"
            :class="[
              'p-4 rounded-lg border-2 cursor-pointer transition-all duration-200',
              isSelected(option.id)
                ? 'border-tertiary bg-tertiary-container/20 selected'
                : 'border-sheet-border hover:border-tertiary/50 hover:bg-surface-container-high',
            ]"
            @click="toggleOption(option.id)"
          >
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <div
                  :class="[
                    'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                    isSelected(option.id)
                      ? 'bg-tertiary border-tertiary text-on-tertiary'
                      : 'border-sheet-border',
                  ]"
                >
                  <span v-if="isSelected(option.id)" class="text-xs font-bold">&#10003;</span>
                </div>
                <h3 class="text-lg font-bold text-on-surface">{{ option.label }}</h3>
              </div>
              <span
                v-if="isSelected(option.id)"
                class="text-xs font-bold text-on-tertiary bg-tertiary px-2 py-0.5 rounded-full"
              >
                Selected
              </span>
            </div>

            <!-- Prerequisite indicator -->
            <div v-if="option.prerequisite" class="mb-2 mt-1 ml-7">
              <span class="inline-block bg-primary-container/30 border border-primary/20 px-2 py-0.5 rounded text-secondary-fixed-dim font-label-md text-[11px]">
                Prerequisite: {{ option.prerequisite }}
              </span>
            </div>

            <p v-if="option.description" class="text-sm text-on-surface-variant ml-7">
              {{ option.description }}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-between items-center mt-6 pt-4 border-t border-sheet-border">
          <span class="text-sm text-on-surface-variant">
            {{ choice.options?.length ?? 0 }} invocations available
          </span>
          <div class="flex gap-3">
            <button
              data-test="modal-cancel-btn"
              @click="handleClose"
              class="px-4 py-2 rounded-lg border border-sheet-border text-on-surface-variant hover:bg-surface-container-high font-label-md"
            >
              Cancel
            </button>
            <button
              data-test="modal-confirm-btn"
              @click="handleConfirm"
              :disabled="!canConfirm"
              class="px-4 py-2 rounded-lg bg-tertiary text-on-tertiary font-label-md hover:bg-tertiary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Selections
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>