<script setup lang="ts">
/**
 * Labelled numeric input.
 *
 * `v-model` is `number | null` (empty → null), so values are never stored as
 * strings. Uses type="number"; `inputmode="numeric"` is added when negatives are
 * not allowed so mobile keyboards show a digit pad (iOS digit pads have no minus
 * key, hence `allowNegative` leaves the default keyboard). `min`/`max` clamp on
 * commit and the visible value is corrected too.
 */
import { computed, ref, useAttrs } from 'vue'
import FormField from '@/components/ui/FormField.vue'
import { fieldBorderClass, fieldInputClass } from '@/components/ui/fieldStyles'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  label: string
  hint?: string
  error?: string
  required?: boolean
  hideLabel?: boolean
  min?: number
  max?: number
  step?: number
  allowNegative?: boolean
}>()

const model = defineModel<number | null>({ default: null })

const input = ref<HTMLInputElement | null>(null)
const attrs = useAttrs()
const rootClass = computed(() => attrs.class)
const inputAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class')),
)

function clamp(value: number): number {
  let result = value
  if (props.min !== undefined) result = Math.max(props.min, result)
  if (props.max !== undefined) result = Math.min(props.max, result)
  return result
}

function onInput(event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  const parsed = raw === '' ? NaN : Number(raw)
  model.value = Number.isNaN(parsed) ? null : parsed
}

function onCommit(): void {
  if (model.value === null) return
  const clamped = clamp(model.value)
  model.value = clamped
  if (input.value) input.value.value = String(clamped)
}
</script>

<template>
  <FormField
    v-slot="{ id, describedby, invalid }"
    :label="label"
    :hint="hint"
    :error="error"
    :required="required"
    :hide-label="hideLabel"
    :class="rootClass"
  >
    <input
      :id="id"
      ref="input"
      type="number"
      :inputmode="allowNegative ? undefined : 'numeric'"
      :value="model ?? ''"
      :min="min"
      :max="max"
      :step="step"
      :required="required"
      :aria-describedby="describedby"
      :aria-invalid="invalid || undefined"
      :class="[fieldInputClass, fieldBorderClass(invalid)]"
      v-bind="inputAttrs"
      @input="onInput"
      @change="onCommit"
      @blur="onCommit"
    />
  </FormField>
</template>
