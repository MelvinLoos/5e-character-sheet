<script setup lang="ts">
/**
 * Reusable pressable primitive.
 *
 * Centralizes the tactile micro-interactions used across the app:
 * - subtle lift on hover (only on devices that can hover)
 * - scale-down on press
 * - flat, disabled state
 *
 * Variants: `primary` (one per screen), `secondary`, `ghost`, `danger`, or `plain`
 * for an unstyled surface the caller colours itself. `loading` disables the button
 * and shows a spinner (aria-busy).
 *
 * Usage:
 *   <PressableButton variant="primary" :loading="saving" @click="save">Save</PressableButton>
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    loading?: boolean
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'plain'
    size?: 'sm' | 'md'
  }>(),
  { variant: 'plain', size: 'md' },
)

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const isDisabled = computed(() => props.disabled || props.loading)

const variantClass = computed(
  () =>
    ({
      primary: 'bg-tertiary text-on-tertiary hover:bg-tertiary/90',
      secondary:
        'bg-surface-variant text-on-surface-variant border border-outline-variant hover:bg-surface-container-highest',
      ghost: 'bg-transparent text-on-surface hover:bg-surface-variant',
      danger: 'bg-error text-on-error hover:bg-error/90',
      plain: '',
    })[props.variant],
)

const sizeClass = computed(() =>
  props.variant === 'plain' ? '' : props.size === 'md' ? 'min-h-11 px-4 py-2' : 'min-h-9 px-3 py-1',
)

function onClick(event: MouseEvent): void {
  if (!isDisabled.value) emit('click', event)
}
</script>

<template>
  <button
    type="button"
    :disabled="isDisabled"
    :aria-busy="loading || undefined"
    class="pressable-button"
    :class="[
      variantClass,
      sizeClass,
      variant !== 'plain'
        ? 'inline-flex items-center justify-center gap-2 rounded font-label-md text-label-md'
        : '',
    ]"
    @click="onClick"
  >
    <span
      v-if="loading"
      class="material-symbols-outlined animate-spin text-base"
      aria-hidden="true"
      >progress_activity</span
    >
    <slot />
  </button>
</template>

<style scoped>
.pressable-button {
  @apply transition-all duration-200 ease-out select-none;
}

.pressable-button:not(:disabled) {
  @apply active:translate-y-0 active:shadow-sm active:scale-95;
}

@media (hover: hover) {
  .pressable-button:not(:disabled) {
    @apply hover:-translate-y-0.5 hover:shadow-md;
  }
}

.pressable-button:disabled {
  @apply scale-100 shadow-none opacity-50 cursor-not-allowed;
}
</style>
