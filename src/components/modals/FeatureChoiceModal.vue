<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import PressableButton from '@/components/ui/PressableButton.vue'
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

function handleClose() {
  emit('close')
}
</script>

<template>
  <BaseModal :open="isOpen && !!choice" :title="choice?.label" size="lg" @close="handleClose">
    <p v-if="choice?.description" class="mb-4 text-sm text-on-surface-variant">
      {{ choice.description }}
    </p>

    <!-- Selection Counter -->
    <div
      class="mb-4 flex items-center gap-2 text-sm font-semibold"
      :class="remainingCount === 0 ? 'text-primary' : 'text-on-surface-variant'"
      role="status"
    >
      <span
        v-if="remainingCount === 0"
        class="material-symbols-outlined text-base"
        aria-hidden="true"
        >check_circle</span
      >
      <span v-else class="material-symbols-outlined text-base" aria-hidden="true">info</span>
      <span data-test="remaining-count">
        {{ selectedIds.length }} / {{ maxCount }} selected
        <template v-if="remainingCount > 0"> — {{ remainingCount }} remaining </template>
      </span>
    </div>

    <!-- Feature Choice Options -->
    <div class="space-y-3" role="group" :aria-label="choice?.label">
      <div
        v-for="option in choice?.options"
        :key="option.id"
        :data-test="'feature-choice-option'"
        :data-id="option.id"
        role="checkbox"
        tabindex="0"
        :aria-checked="isSelected(option.id)"
        :class="[
          'p-4 rounded-lg border-2 cursor-pointer transition-all duration-200',
          isSelected(option.id)
            ? 'border-tertiary bg-tertiary-container/20 selected'
            : 'border-sheet-border hover:border-tertiary/50 hover:bg-surface-container-high',
        ]"
        @click="toggleOption(option.id)"
        @keydown.enter.prevent="toggleOption(option.id)"
        @keydown.space.prevent="toggleOption(option.id)"
      >
        <div class="mb-1 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div
              :class="[
                'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2',
                isSelected(option.id)
                  ? 'border-tertiary bg-tertiary text-on-tertiary'
                  : 'border-sheet-border',
              ]"
              aria-hidden="true"
            >
              <span v-if="isSelected(option.id)" class="text-xs font-bold">&#10003;</span>
            </div>
            <h3 class="text-lg font-bold text-on-surface">{{ option.label }}</h3>
          </div>
          <span
            v-if="isSelected(option.id)"
            class="rounded-full bg-tertiary px-2 py-0.5 text-xs font-bold text-on-tertiary"
          >
            Selected
          </span>
        </div>

        <!-- Prerequisite indicator -->
        <div v-if="option.prerequisite" class="mb-2 ml-7 mt-1">
          <span
            class="inline-block rounded border border-primary/20 bg-primary-container/30 px-2 py-0.5 font-label-md text-label-sm text-secondary-fixed-dim"
          >
            Prerequisite: {{ option.prerequisite }}
          </span>
        </div>

        <p v-if="option.description" class="ml-7 text-sm text-on-surface-variant">
          {{ option.description }}
        </p>
      </div>
    </div>

    <template #footer>
      <span class="mr-auto self-center text-sm text-on-surface-variant">
        {{ choice?.options?.length ?? 0 }} options available
      </span>
      <PressableButton data-test="modal-cancel-btn" variant="ghost" @click="handleClose">
        Cancel
      </PressableButton>
      <PressableButton
        data-test="modal-confirm-btn"
        variant="primary"
        :disabled="!canConfirm"
        @click="handleConfirm"
      >
        Confirm Selections
      </PressableButton>
    </template>
  </BaseModal>
</template>
