<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import feather from 'feather-icons'
import BaseModal from '@/components/ui/BaseModal.vue'
import { RULE_GLOSSARY, type GlossaryTopic } from '@/domain/rule-glossary'

const props = withDefaults(
  defineProps<{
    /** Predefined glossary topic — mutually exclusive with title+content */
    topic?: GlossaryTopic
    /** Custom title — used when topic is not provided */
    title?: string
    /** Custom content — used when topic is not provided */
    content?: string
    /**
     * When true, hovering or focusing the trigger shows a lightweight inline
     * tooltip instead of opening the topic dialog on click. Clicking (or
     * tapping) toggles the tooltip so touch users can still reach it.
     */
    popover?: boolean
  }>(),
  { popover: false },
)

/** Hover-intent delay that prevents tooltip flicker when sweeping the cursor. */
const HOVER_DELAY = 150

const isOpen = ref(false)
const visible = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)
const tooltipRef = ref<HTMLDivElement | null>(null)
const tooltipId = useId()
const position = ref({ top: 0, left: 0 })

let showTimer: ReturnType<typeof setTimeout> | null = null

const rule = computed(() => {
  if (props.topic) {
    return RULE_GLOSSARY[props.topic] ?? null
  }
  if (props.title || props.content) {
    return { title: props.title ?? '', content: props.content ?? '' }
  }
  return null
})

const tooltipText = computed(() => rule.value?.content ?? '')

const helpIcon = computed(() => feather.icons['help-circle']?.toSvg({ width: 16, height: 16 }))

const positionStyle = computed(() => ({
  top: `${position.value.top}px`,
  left: `${position.value.left}px`,
}))

function clearShowTimer(): void {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
}

function show(): void {
  clearShowTimer()
  visible.value = true
}

function scheduleShow(): void {
  clearShowTimer()
  showTimer = setTimeout(() => {
    visible.value = true
  }, HOVER_DELAY)
}

function hide(): void {
  clearShowTimer()
  visible.value = false
}

function handleClick(): void {
  if (!props.popover) {
    isOpen.value = true
    return
  }
  // Hover already opened it for pointer users; clicking toggles it closed.
  if (visible.value) hide()
  else show()
}

function handleEnter(): void {
  if (props.popover) scheduleShow()
}

function handleLeave(): void {
  if (props.popover) hide()
}

function handleFocus(): void {
  if (props.popover) show()
}

function handleBlur(): void {
  if (props.popover) hide()
}

/** Anchor the tooltip above the trigger, flipping below and clamping to viewport. */
function updatePosition(): void {
  const el = triggerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const gap = 8
  const width = tooltipRef.value?.offsetWidth || 256
  const height = tooltipRef.value?.offsetHeight || 0

  let top = rect.top - height - gap
  if (top < gap) top = rect.bottom + gap

  let left = rect.left + rect.width / 2 - width / 2
  const maxLeft = Math.max(gap, window.innerWidth - width - gap)
  left = Math.min(Math.max(gap, left), maxLeft)

  position.value = { top, left }
}

function handleDocumentClick(event: MouseEvent): void {
  const target = event.target as Node | null
  if (target && (triggerRef.value?.contains(target) || tooltipRef.value?.contains(target))) return
  hide()
}

watch(visible, (isVisible) => {
  if (isVisible) {
    document.addEventListener('click', handleDocumentClick)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    void nextTick(updatePosition)
  } else {
    document.removeEventListener('click', handleDocumentClick)
    window.removeEventListener('resize', updatePosition)
    window.removeEventListener('scroll', updatePosition, true)
  }
})

onBeforeUnmount(() => {
  clearShowTimer()
  document.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updatePosition, true)
})
</script>

<template>
  <div class="inline-flex items-center align-middle ml-2">
    <!-- Trigger: small glyph with an enlarged invisible hit area -->
    <button
      ref="triggerRef"
      type="button"
      @click.stop="handleClick"
      @mouseenter="handleEnter"
      @mouseleave="handleLeave"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown.esc="hide"
      class="relative rounded-full text-on-surface-variant transition-all duration-200 ease-out select-none hover:text-tertiary hover:scale-110 active:scale-95 after:absolute after:-inset-3 after:content-['']"
      :aria-label="rule?.title ? `More information: ${rule.title}` : 'More information'"
      :aria-haspopup="popover ? undefined : 'dialog'"
      :aria-expanded="popover ? visible : undefined"
      :aria-describedby="popover && visible ? tooltipId : undefined"
      v-html="helpIcon"
    ></button>

    <BaseModal
      :open="!popover && isOpen"
      :title="rule?.title"
      size="sm"
      @close="isOpen = false"
    >
      <div class="font-body-md text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">
        {{ rule?.content }}
      </div>
    </BaseModal>

    <Teleport to="body">
      <div
        v-if="popover && visible"
        :id="tooltipId"
        ref="tooltipRef"
        role="tooltip"
        class="tooltip-popover fixed z-[60] max-w-xs bg-surface-container p-3 rounded-lg border border-outline-variant shadow-elevation-3 text-xs text-on-surface pointer-events-none"
        :style="positionStyle"
      >
        {{ tooltipText }}
      </div>
    </Teleport>
  </div>
</template>

