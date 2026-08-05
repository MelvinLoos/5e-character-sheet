<script setup lang="ts">
/**
 * Reusable pressable primitive.
 *
 * Centralizes the tactile micro-interactions used across the app:
 * - subtle lift on hover
 * - scale-down on press
 * - flat, disabled state
 *
 * Usage:
 *   <PressableButton @click="doSomething" title="Save">
 *     <span>Save</span>
 *   </PressableButton>
 */
defineOptions({
  inheritAttrs: true,
})

const props = defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()
</script>

<template>
  <button
    type="button"
    :disabled="props.disabled"
    class="pressable-button"
    @click="emit('click', $event)"
  >
    <slot />
  </button>
</template>

<style scoped>
.pressable-button {
  @apply transition-all duration-200 ease-out select-none;
}

.pressable-button:not(:disabled) {
  @apply hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm active:scale-95;
}

.pressable-button:disabled {
  @apply scale-100 shadow-none opacity-50 cursor-not-allowed;
}
</style>
