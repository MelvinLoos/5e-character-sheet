<script setup lang="ts">
/**
 * UsageTracker — row of spend-able boxes for limited-use features.
 *
 * `v-model` is the number of uses spent. Clicking box n spends up to n; clicking
 * the last spent box refunds it. Each box is a 24px target with a check mark
 * when spent, and is named "<label>: use n of total".
 */
const props = defineProps<{
  total: number
  /** Feature / feat name, used for accessible names. */
  label: string
  disabled?: boolean
}>()

const used = defineModel<number>({ default: 0 })

function toggle(n: number): void {
  used.value = used.value === n ? n - 1 : n
}
</script>

<template>
  <div role="group" :aria-label="`${props.label} uses`" class="flex items-center">
    <label
      v-for="n in props.total"
      :key="n"
      class="relative inline-flex h-6 w-6 items-center justify-center"
      :class="disabled ? 'cursor-default' : 'cursor-pointer'"
    >
      <input
        type="checkbox"
        class="peer sr-only"
        :checked="n <= used"
        :disabled="disabled"
        :aria-label="`${props.label}: use ${n} of ${props.total}`"
        @change="toggle(n)"
      />
      <span
        class="flex h-4 w-4 items-center justify-center rounded-sm border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-tertiary peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-surface-container"
        :class="n <= used ? 'border-tertiary bg-tertiary text-on-tertiary' : 'border-outline bg-transparent'"
        aria-hidden="true"
      >
        <svg v-if="n <= used" class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    </label>
  </div>
</template>
