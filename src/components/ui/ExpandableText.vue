<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import type { CSSProperties } from 'vue'

/**
 * Renders text clamped to a fixed number of lines with a "Show more /
 * Show less" toggle when the content overflows.
 *
 * Fixes #212: spell descriptions were permanently cut off with no way to
 * read them in full.
 */
const props = withDefaults(
  defineProps<{
    /** The text to display. */
    text: string
    /** Maximum number of visible lines while collapsed. */
    lines?: number
    /** Extra classes forwarded to the description paragraph. */
    textClass?: string | string[] | Record<string, boolean>
  }>(),
  {
    lines: 4,
    textClass: '',
  },
)

const contentRef = ref<HTMLElement | null>(null)
const isOverflowing = ref(false)
const isExpanded = ref(false)
const contentId = useId()

/** Line-clamp styles applied while collapsed. */
const clampStyle = computed<CSSProperties>(() => ({
  display: '-webkit-box',
  WebkitLineClamp: props.lines,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}))

/** Detect whether the rendered text exceeds the visible clamp height. */
function measureOverflow(): void {
  const el = contentRef.value
  // Only measure while collapsed; when expanded the element will typically not overflow.
  if (!el || isExpanded.value) return
  isOverflowing.value = el.scrollHeight > el.clientHeight + 1
}

async function toggle(): Promise<void> {
  isExpanded.value = !isExpanded.value
  if (!isExpanded.value) {
    await nextTick()
    measureOverflow()
  }
}

onMounted(async () => {
  await nextTick()
  measureOverflow()
  window.addEventListener('resize', measureOverflow)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureOverflow)
})

watch(
  () => [props.text, props.lines, props.textClass],
  async () => {
    isExpanded.value = false
    await nextTick()
    measureOverflow()
  },
  { deep: true },
)
</script>

<template>
  <div>
    <p
      ref="contentRef"
      :id="contentId"
      :class="textClass"
      :style="!isExpanded ? clampStyle : undefined"
    >
      {{ text }}
    </p>
    <button
      v-if="isOverflowing"
      type="button"
      :aria-expanded="isExpanded"
      :aria-controls="contentId"
      class="mt-1 mb-3 text-xs font-bold text-tertiary hover:text-tertiary-fixed hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 ease-out cursor-pointer select-none"
      @click="toggle"
    >
      {{ isExpanded ? 'Show less' : 'Show more' }}
    </button>
  </div>
</template>
