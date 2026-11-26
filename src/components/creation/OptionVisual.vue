<script setup lang="ts">
/**
 * OptionVisual — decorative media for a creation option card (not interactive).
 * Falls back: local portrait, then emblem SVG, then a monogram.
 */
import { computed } from 'vue'
import {
  getFallbackEmblemSvg,
  getLocalPortraitUrl,
  type OptionCategory,
} from '@/utils/optionVisuals'

const props = defineProps<{
  name: string
  category: OptionCategory
  selected?: boolean
  instance?: string
}>()

const url = computed(() => getLocalPortraitUrl(props.name, props.category))
const svg = computed(() => (url.value ? null : getFallbackEmblemSvg(props.name, props.category, props.instance)))
const initial = computed(() => props.name.trim().charAt(0).toUpperCase())
</script>

<template>
  <div
    aria-hidden="true"
    class="aspect-[4/3] w-full overflow-hidden rounded-lg bg-surface-container-high"
    :class="selected ? 'ring-2 ring-tertiary' : ''"
    data-testid="option-visual"
  >
    <img v-if="url" :src="url" alt="" loading="lazy" class="h-full w-full object-cover" />
    <div
      v-else-if="svg"
      class="flex h-full w-full items-center justify-center [&>svg]:h-full [&>svg]:w-auto"
      data-visual="emblem"
      v-html="svg"
    ></div>
    <div
      v-else
      class="flex h-full w-full flex-col items-center justify-center gap-1"
      data-visual="monogram"
    >
      <span
        class="flex size-14 items-center justify-center rounded-full border-2 border-tertiary bg-surface-container-high font-headline-lg text-headline-lg text-tertiary"
        >{{ initial }}</span
      >
      <span class="font-label-sm text-label-sm capitalize text-on-surface-variant">{{ category }}</span>
    </div>
  </div>
</template>
