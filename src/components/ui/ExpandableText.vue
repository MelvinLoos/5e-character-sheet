<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { renderMarkdown } from '@/utils/markdown'

/**
 * Renders text clamped to a fixed number of lines with a "Show more /
 * Show less" toggle when the content overflows.
 *
 * Fixes #212: spell descriptions were permanently cut off with no way to
 * read them in full.
 *
 * With `markdown` enabled (fixes #215), the text is rendered as safe
 * Markdown: formatting is applied, legacy HTML is normalized, and raw HTML
 * is escaped.
 *
 * This is the single interface for rendering descriptions (#224): use it
 * instead of calling `renderMarkdown()` + `v-html` directly. Set
 * `:collapsible="false"` where the full text must always be visible (e.g.
 * accordion bodies or the printable sheet); the safe Markdown rendering is
 * kept, but no clamp or toggle is applied.
 */
const props = withDefaults(
  defineProps<{
    /** The text to display. */
    text: string
    /** Maximum number of visible lines while collapsed. */
    lines?: number
    /** Extra classes forwarded to the description paragraph. */
    textClass?: string | string[] | Record<string, boolean>
    /** Render `text` as Markdown (safe: raw HTML is escaped, legacy HTML is normalized). */
    markdown?: boolean
    /** Clamp overflowing text and offer a "Show more / Show less" toggle. */
    collapsible?: boolean
  }>(),
  {
    lines: 4,
    textClass: '',
    markdown: false,
    collapsible: true,
  },
)

const contentRef = ref<HTMLElement | null>(null)
const isOverflowing = ref(false)
const isExpanded = ref(false)
const contentId = useId()
let resizeObserver: ResizeObserver | null = null

/** Whether the clamp is currently applied to the content. */
const isClamped = computed(() => props.collapsible && !isExpanded.value)

/** Rendered Markdown HTML (only used when the `markdown` prop is enabled). */
const renderedHtml = computed(() => (props.markdown ? renderMarkdown(props.text) : ''))

function textClassSignature(
  value: string | string[] | Record<string, boolean>,
): string {
  if (Array.isArray(value)) {
    return value.map((item) => textClassSignature(item)).join('|')
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, enabled]) => `${key}:${enabled ? '1' : '0'}`)
      .join('|')
  }
  return value
}

const normalizedTextClass = computed(() => textClassSignature(props.textClass))

/**
 * Line-clamp styles applied while collapsed.
 *
 * Markdown mode uses a `max-height` based on the `lh` (line-height) unit
 * instead of `-webkit-line-clamp`, which is unreliable when the element
 * contains block children like <p>/<ul>.
 */
const clampStyle = computed<CSSProperties>(() => {
  if (props.markdown) {
    return {
      maxHeight: `${props.lines}lh`,
      overflow: 'hidden',
    }
  }
  return {
    display: '-webkit-box',
    WebkitLineClamp: props.lines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }
})

/** Detect whether the rendered text exceeds the visible clamp height. */
function measureOverflow(): void {
  const el = contentRef.value
  if (!props.collapsible) {
    isOverflowing.value = false
    return
  }
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
  // Re-measure when the content box resizes (container width changes reflow
  // the text). Fall back to window resizes where ResizeObserver is missing.
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => measureOverflow())
    if (contentRef.value) resizeObserver.observe(contentRef.value)
  } else {
    window.addEventListener('resize', measureOverflow)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', measureOverflow)
})

// The content element is swapped when toggling `markdown`; keep observing it.
watch(contentRef, (el, previous) => {
  if (!resizeObserver) return
  if (previous) resizeObserver.unobserve(previous)
  if (el) resizeObserver.observe(el)
})

watch(
  () => [props.text, props.lines, normalizedTextClass.value, props.markdown, props.collapsible],
  async () => {
    isExpanded.value = false
    await nextTick()
    measureOverflow()
  },
)
</script>

<template>
  <div>
    <p
      v-if="!markdown"
      ref="contentRef"
      :id="contentId"
      :class="textClass"
      :style="isClamped ? clampStyle : undefined"
    >
      {{ text }}
    </p>
    <div
      v-else
      ref="contentRef"
      :id="contentId"
      :class="[textClass, 'markdown-content']"
      :style="isClamped ? clampStyle : undefined"
      v-html="renderedHtml"
    ></div>
    <button
      v-if="isOverflowing"
      type="button"
      :aria-expanded="isExpanded"
      :aria-controls="contentId"
      class="mt-1 mb-3 text-xs font-bold text-tertiary hover:text-tertiary-fixed hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 ease-out cursor-pointer select-none"
      @click.stop="toggle"
    >
      {{ isExpanded ? 'Show less' : 'Show more' }}
    </button>
  </div>
</template>
