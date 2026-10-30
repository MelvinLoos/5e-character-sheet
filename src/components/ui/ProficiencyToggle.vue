<script setup lang="ts">
/**
 * ProficiencyToggle — named checkbox for skill / saving-throw proficiency.
 *
 * The state is shown by a check mark as well as fill colour, and the native
 * checkbox carries the accessible name (`label`). `title` is the hover hint
 * (e.g. "Granted by class").
 */
defineProps<{
  label: string
  title?: string
  disabled?: boolean
}>()

const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label
    class="relative inline-flex min-h-11 min-w-11 items-center justify-center"
    :class="disabled ? 'cursor-default' : 'cursor-pointer'"
    :title="title"
  >
    <input
      v-model="model"
      type="checkbox"
      class="peer sr-only"
      :aria-label="label"
      :disabled="disabled"
    />
    <span
      class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-tertiary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
      :class="model ? 'border-tertiary bg-tertiary text-on-tertiary' : 'border-outline bg-surface'"
      aria-hidden="true"
    >
      <svg v-if="model" class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
      </svg>
    </span>
  </label>
</template>
