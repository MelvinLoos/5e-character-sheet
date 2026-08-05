<script setup lang="ts">
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
      `shadow-elevation-${elevation}`,
      hover ? 'hover:shadow-elevation-3 hover:-translate-y-0.5' : '',
    ]"
  >
    <slot />
  </div>
</template>
