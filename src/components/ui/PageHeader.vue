<script setup lang="ts">
/** Page title block shared by every view. Renders the page's single <h1>. */
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header
    class="mb-8 flex flex-col gap-4 border-b border-surface-variant pb-4 sm:flex-row sm:items-end sm:justify-between"
  >
    <div>
      <h1 class="font-display-lg text-display-lg text-tertiary">{{ title }}</h1>
      <p v-if="subtitle" class="mt-2 font-body-lg text-body-lg text-on-surface-variant">
        {{ subtitle }}
      </p>
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-4">
      <slot name="actions" />
    </div>
  </header>
</template>
