<script setup lang="ts">
/**
 * StatusBanner — inline message with icon + text (never colour alone).
 * `error` uses role="alert"; `warning` / `info` use role="status".
 * Callers control visibility with classes, e.g. class="md:hidden".
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    tone?: 'error' | 'warning' | 'info'
    icon?: string
  }>(),
  { tone: 'warning' },
)

const toneClass = computed(
  () =>
    ({
      error: 'border-error/40 bg-error/10 [&_.banner-icon]:text-error',
      warning: 'border-tertiary/40 bg-tertiary/10 [&_.banner-icon]:text-tertiary',
      info: 'border-primary/40 bg-primary/10 [&_.banner-icon]:text-primary',
    })[props.tone],
)
const iconName = computed(
  () => props.icon ?? { error: 'error', warning: 'warning', info: 'info' }[props.tone],
)
</script>

<template>
  <div
    :role="tone === 'error' ? 'alert' : 'status'"
    class="flex items-center gap-2 rounded-lg border p-3 text-on-surface"
    :class="toneClass"
  >
    <span class="banner-icon material-symbols-outlined" aria-hidden="true">{{ iconName }}</span>
    <p class="font-label-md text-label-md"><slot /></p>
  </div>
</template>
