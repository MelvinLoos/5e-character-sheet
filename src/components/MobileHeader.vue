<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import IconButton from '@/components/ui/IconButton.vue'
import ThemeToggle from './ThemeToggle.vue'

const store = useCharacterStore()

defineEmits<{ showMore: [] }>()
</script>

<template>
  <header
    class="md:hidden fixed inset-x-0 top-0 z-nav flex items-center justify-between gap-2 bg-primary-container px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] shadow-sm print:hidden"
  >
    <span class="font-headline-md text-tertiary">Heroes Guild</span>
    <div class="flex items-center gap-1">
      <ThemeToggle />
      <button
        v-if="store.currentCharacterData"
        @click="store.toggleEdit()"
        class="edit-toggle-btn min-h-11 active:scale-95"
        :class="store.isEditing ? 'edit-toggle-btn--active' : 'edit-toggle-btn--inactive'"
        :title="store.isEditing ? 'Exit Edit Mode' : 'Enter Edit Mode'"
        :aria-label="store.isEditing ? 'Exit Edit Mode' : 'Enter Edit Mode'"
        :aria-pressed="store.isEditing"
      >
        <span class="material-symbols-outlined" aria-hidden="true">edit</span>
        <span class="hidden sm:inline">{{ store.isEditing ? 'Editing…' : 'Edit' }}</span>
      </button>
      <!-- Without a character there is no tab bar, so the menu lives here -->
      <IconButton v-else icon="menu" label="Open menu" @click="$emit('showMore')" />
    </div>
  </header>
</template>
