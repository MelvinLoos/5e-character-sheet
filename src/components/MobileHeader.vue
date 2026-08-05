<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'

const store = useCharacterStore()

defineEmits<{
  showImport: []
}>()
</script>

<template>
  <header
    class="md:hidden flex justify-between items-center px-4 py-3 w-full top-0 bg-primary-container dark:bg-primary-container shadow-sm z-40 fixed print:hidden"
  >
    <span class="font-headline-md text-tertiary">Character Sheet</span>
    <div class="flex items-center gap-2">
      <button
        @click="store.toggleEdit()"
        class="edit-toggle-btn active:scale-95"
        :class="store.isEditing ? 'edit-toggle-btn--active' : 'edit-toggle-btn--inactive'"
        :title="store.isEditing ? 'Exit Edit Mode' : 'Enter Edit Mode'"
        :aria-label="store.isEditing ? 'Exit Edit Mode' : 'Enter Edit Mode'"
      >
        <span class="material-symbols-outlined">{{ store.isEditing ? 'edit' : 'visibility' }}</span>
        <span class="hidden sm:inline">{{ store.isEditing ? 'Editing…' : 'Edit' }}</span>
      </button>

      <button
        @click="$emit('showImport')"
        class="p-2 rounded-lg bg-surface-variant hover:bg-surface-bright hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:shadow-sm active:scale-95 text-on-surface transition-all duration-200 ease-out select-none"
        title="Import Data"
        aria-label="Import Data"
      >
        <span class="material-symbols-outlined">file_upload</span>
      </button>
    </div>
  </header>
</template>
