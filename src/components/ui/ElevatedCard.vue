<script setup lang="ts">
/** Full class strings so Tailwind's scanner emits every elevation (no dynamic interpolation). */
const ELEVATION_CLASS = {
  1: 'shadow-elevation-1',
  2: 'shadow-elevation-2',
  3: 'shadow-elevation-3',
  4: 'shadow-elevation-4',
} as const

/**
 * Default surface background. Kept as a full static class string so Tailwind's
 * scanner emits it. Applied only when `surface` is true, so callers that supply
 * their own background (e.g. spell cards) can opt out of the opaque gradient.
 */
const SURFACE_CLASS = 'border-outline-variant/30 bg-gradient-to-br from-surface-container-high to-surface-container'

withDefaults(
  defineProps<{
    elevation?: 1 | 2 | 3 | 4
    hover?: boolean
    /** When false, the card renders no background/border tint and callers own those. */
    surface?: boolean
  }>(),
  {
    elevation: 1,
    hover: true,
    surface: true,
  },
)
</script>

<template>
  <div
    class="rounded-xl border transition-all duration-200"
    :class="[
      surface ? SURFACE_CLASS : '',
      ELEVATION_CLASS[elevation],
      hover ? 'hover:shadow-elevation-3 hover:-translate-y-0.5' : '',
    ]"
  >
    <slot />
  </div>
</template>
