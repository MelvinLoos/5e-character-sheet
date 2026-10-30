<script setup lang="ts">
/** Full class strings so Tailwind's scanner emits every elevation (no dynamic interpolation). */
const ELEVATION_CLASS = {
  1: 'shadow-elevation-1',
  2: 'shadow-elevation-2',
  3: 'shadow-elevation-3',
  4: 'shadow-elevation-4',
} as const

withDefaults(
  defineProps<{
    elevation?: 1 | 2 | 3 | 4
    hover?: boolean
  }>(),
  {
    elevation: 1,
    hover: true,
  },
)
</script>

<template>
  <div
    class="rounded-xl border border-outline-variant/30 bg-gradient-to-br from-surface-container-high to-surface-container transition-all duration-200"
    :class="[
      ELEVATION_CLASS[elevation],
      hover ? 'hover:shadow-elevation-3 hover:-translate-y-0.5' : '',
    ]"
  >
    <slot />
  </div>
</template>
