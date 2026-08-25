<script setup lang="ts">
import type { CompletionBadge } from '@/composables/useCharacterCompletion'

defineProps<{
  badge: CompletionBadge
}>()
</script>

<template>
  <span
    class="inline-flex items-center justify-center rounded-full bg-red-600 text-white font-bold leading-none select-none"
    :class="
      badge.type === 'count'
        ? 'min-w-[18px] h-[18px] px-1 text-[10px]'
        : 'w-[18px] h-[18px] text-[12px]'
    "
    :title="badge.label"
    aria-hidden="true"
  >
    {{ badge.type === 'count' ? badge.count : '!' }}
  </span>
</template>