<script setup lang="ts">
/**
 * IconButton — icon-only button with a required accessible name.
 *
 * `label` becomes aria-label and the tooltip; the glyph is hidden from assistive
 * tech. The hit area is 44px (`md`) or 36px (`sm`, for dense rows) regardless of
 * the glyph size. Pass `pressed` for toggle buttons (sets aria-pressed).
 */
withDefaults(
  defineProps<{
    /** Material Symbols ligature name, e.g. "close". */
    icon: string
    label: string
    size?: 'sm' | 'md'
    variant?: 'ghost' | 'danger'
    pressed?: boolean
  }>(),
  { size: 'md', variant: 'ghost', pressed: undefined },
)
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    :title="label"
    :aria-pressed="pressed === undefined ? undefined : pressed"
    class="inline-flex items-center justify-center rounded-full transition-colors duration-150 select-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      size === 'md' ? 'min-h-11 min-w-11' : 'min-h-9 min-w-9',
      variant === 'danger'
        ? 'text-error hover:bg-error/10'
        : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface',
      pressed ? 'bg-surface-variant text-on-surface' : '',
    ]"
  >
    <span class="material-symbols-outlined" :class="size === 'md' ? 'text-2xl' : 'text-xl'" aria-hidden="true">{{
      icon
    }}</span>
  </button>
</template>
