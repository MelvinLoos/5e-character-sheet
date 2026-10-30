<script setup lang="ts">
/**
 * LibraryModal — shared shell for the spell / feat / feature "archive" pickers.
 *
 * Provides the dialog (BaseModal sheet variant), a labelled search box, an
 * optional filter row (`#filters`), a result area (default slot) and a footer
 * with a live result count plus extra actions (`#actions`). Callers own the
 * filtering and the result cards.
 */
import BaseModal from '@/components/ui/BaseModal.vue'
import TextField from '@/components/ui/TextField.vue'

defineProps<{
  open: boolean
  title: string
  searchLabel: string
  searchPlaceholder?: string
  /** e.g. "12 spells found" — announced politely when it changes. */
  countLabel: string
}>()

const search = defineModel<string>('search', { default: '' })

defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <BaseModal :open="open" :title="title" size="xl" variant="sheet" @close="$emit('close')">
    <div v-if="$slots.notice" class="mb-4"><slot name="notice" /></div>

    <div class="mb-4 grid grid-cols-1 gap-4" :class="$slots.filters ? 'md:grid-cols-2' : ''">
      <TextField
        v-model="search"
        type="search"
        data-autofocus
        hide-label
        :label="searchLabel"
        :placeholder="searchPlaceholder"
      />
      <div v-if="$slots.filters" class="flex flex-wrap items-center gap-1">
        <slot name="filters" />
      </div>
    </div>

    <slot />

    <template #footer>
      <span class="mr-auto self-center text-sm text-on-surface-variant" role="status">{{
        countLabel
      }}</span>
      <slot name="actions" />
    </template>
  </BaseModal>
</template>
