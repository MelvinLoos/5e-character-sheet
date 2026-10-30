<script setup lang="ts">
/** Labelled single-line text input. `v-model` is a string; extra attrs go to the <input>. */
import { computed, useAttrs } from 'vue'
import FormField from '@/components/ui/FormField.vue'
import { fieldBorderClass, fieldInputClass } from '@/components/ui/fieldStyles'

defineOptions({ inheritAttrs: false })

defineProps<{
  label: string
  hint?: string
  error?: string
  required?: boolean
  hideLabel?: boolean
  type?: 'text' | 'email' | 'search' | 'url' | 'tel' | 'password'
}>()

const model = defineModel<string>({ default: '' })

const attrs = useAttrs()
const rootClass = computed(() => attrs.class)
const inputAttrs = computed(() =>
  Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== 'class')),
)
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
      v-model="model"
      :type="type ?? 'text'"
      :required="required"
      :aria-describedby="describedby"
      :aria-invalid="invalid || undefined"
      :class="[fieldInputClass, fieldBorderClass(invalid)]"
      v-bind="inputAttrs"
    />
  </FormField>
</template>
