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
    <!-- With a character: its name leads, class beneath. Otherwise the brand lockup. -->
    <span v-if="store.currentCharacterData" class="flex min-w-0 flex-col leading-tight" data-testid="mobile-character-name">
      <span class="truncate font-headline-md text-headline-md text-tertiary">{{
        store.currentCharacterData.name || 'Unnamed character'
      }}</span>
      <span class="truncate font-label-sm text-label-sm text-on-surface-variant">{{
        store.currentCharacterData.class || 'Heroes Guild'
      }}</span>
    </span>
    <!-- Organisation over app name: "Heroes Guild" / "Character Sheet" -->
    <span v-else class="flex flex-col leading-tight">
      <span class="font-label-sm text-label-sm uppercase text-on-surface-variant">Heroes Guild</span>
      <span class="font-headline-md text-headline-md text-tertiary">Character Sheet</span>
    </span>
    <div class="flex shrink-0 items-center gap-1">
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
