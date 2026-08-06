<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'

const store = useCharacterStore()
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
        <span class="material-symbols-outlined">edit</span>
        <span class="hidden sm:inline">{{ store.isEditing ? 'Editing…' : 'Edit' }}</span>
      </button>
    </div>
  </header>
</template>
