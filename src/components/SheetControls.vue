<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import feather from 'feather-icons'

const store = useCharacterStore()

function handlePrint() {
  const wasEditing = store.isEditing
  if (wasEditing) {
    store.toggleEdit()
  }

  // Use setTimeout to ensure DOM is updated before printing
  setTimeout(() => {
    window.onbeforeprint = () => {
      // This logic is tricky. We'll set it back after print.
    }
    window.onafterprint = () => {
      if (wasEditing) {
        store.toggleEdit()
      }
      window.onafterprint = null
    }
    window.print()
  }, 100)
}
</script>

<template>
  <div class="flex flex-wrap justify-center items-center gap-2 mb-4 no-print z-10 px-2">
    <button
      @click="store.toggleEdit()"
      class="edit-toggle-btn active:scale-95"
      :class="store.isEditing ? 'edit-toggle-btn--active' : 'edit-toggle-btn--inactive'"
      :title="store.isEditing ? 'Exit Edit Mode' : 'Enter Edit Mode'"
      :aria-label="store.isEditing ? 'Exit Edit Mode' : 'Enter Edit Mode'"
    >
      <span v-if="store.isEditing" v-html="feather.icons['edit-3'].toSvg()"></span>
      <span v-else v-html="feather.icons['edit-2'].toSvg()"></span>
      <span class="hidden sm:inline">{{ store.isEditing ? 'Editing…' : 'Edit' }}</span>
    </button>
    <button
      @click="store.saveToLibrary()"
      class="icon-button"
      :title="store.sourceCharacterId ? 'Save a Local Copy' : 'Save to Browser Library'"
    >
      <span v-if="store.sourceCharacterId" v-html="feather.icons.copy.toSvg()"></span>
      <span v-else v-html="feather.icons.save.toSvg()"></span>
    </button>
    <button
      @click="store.shareCharacter()"
      class="icon-button"
      title="Share Online"
      :disabled="!store.supabaseClient"
    >
      <span v-html="feather.icons['share-2'].toSvg()"></span>
    </button>
    <button @click="store.exportCharacter()" class="icon-button" title="Export JSON">
      <span v-html="feather.icons.download.toSvg()"></span>
    </button>
    <button @click="handlePrint" class="icon-button" title="Print Sheet" aria-label="Print Sheet">
      <span v-html="feather.icons.printer.toSvg()"></span>
    </button>
  </div>
</template>