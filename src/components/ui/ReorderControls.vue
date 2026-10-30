<script setup lang="ts">
/**
 * Move up / Move down buttons — the keyboard and single-pointer alternative to a
 * drag handle (WCAG 2.5.7). Emits `move` with -1 or +1; the parent reorders.
 */
import IconButton from '@/components/ui/IconButton.vue'

defineProps<{
  index: number
  count: number
  /** Item name, used in the accessible labels. */
  label: string
}>()

defineEmits<{ (e: 'move', delta: -1 | 1): void }>()
</script>

<template>
  <div class="inline-flex items-center" role="group" :aria-label="`Reorder ${label}`">
    <IconButton
      icon="arrow_upward"
      size="sm"
      :label="`Move ${label} up`"
      :disabled="index === 0"
      @click.stop="$emit('move', -1)"
    />
    <IconButton
      icon="arrow_downward"
      size="sm"
      :label="`Move ${label} down`"
      :disabled="index >= count - 1"
      @click.stop="$emit('move', 1)"
    />
  </div>
</template>
