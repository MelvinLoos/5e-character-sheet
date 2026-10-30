<script setup lang="ts">
/**
 * FormField — visible label, hint and error wiring for a single control.
 *
 * Exposes `id` and `describedby` to the control through the default slot so the
 * label is linked (`for`) and hint/error text is announced (`aria-describedby`).
 * Errors render with an icon and role="alert", never colour alone.
 */
import { computed, useId } from 'vue'

const props = defineProps<{
  label: string
  id?: string
  hint?: string
  error?: string
  required?: boolean
  /** Keep the label for screen readers but hide it visually (e.g. inside a table row). */
  hideLabel?: boolean
}>()

const generatedId = useId()
const fieldId = computed(() => props.id ?? generatedId)
const hintId = computed(() => `${fieldId.value}-hint`)
const errorId = computed(() => `${fieldId.value}-error`)
const describedby = computed(
  () =>
    [props.hint ? hintId.value : '', props.error ? errorId.value : '']
      .filter(Boolean)
      .join(' ') || undefined,
)
</script>

<template>
  <div class="flex flex-col gap-1">
    <label
      :for="fieldId"
      :class="hideLabel ? 'sr-only' : 'font-label-md text-label-md text-on-surface-variant'"
    >
      {{ label }}<span v-if="required" class="text-error" aria-hidden="true"> *</span>
    </label>
    <slot :id="fieldId" :describedby="describedby" :invalid="!!error" />
    <p v-if="hint" :id="hintId" class="font-body-sm text-body-sm text-on-surface-variant">
      {{ hint }}
    </p>
    <p
      v-if="error"
      :id="errorId"
      role="alert"
      class="flex items-start gap-1 font-body-sm text-body-sm text-error"
    >
      <span class="material-symbols-outlined text-base" aria-hidden="true">error</span>
      {{ error }}
    </p>
  </div>
</template>
