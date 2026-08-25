<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import feather from 'feather-icons'

const store = useCharacterStore()

function copyToClipboard() {
  navigator.clipboard
    .writeText(store.shareModal.url)
    .then(() => {
      alert('Link copied to clipboard!')
    })
    .catch(() => {
      alert('Failed to copy link.')
    })
}
</script>

<template>
  <div v-if="store.shareModal.show" class="modal-backdrop backdrop-blur-sm bg-black/40">
    <div class="modal-content rounded-xl">
      <h2 class="text-xl font-bold text-tertiary mb-4">Character Shared!</h2>
      <p class="mb-4">Your character has been saved to the archives. Share this link:</p>
      <div class="flex items-center gap-2 mb-6">
        <input
          type="text"
          readonly
          :value="store.shareModal.url"
          class="flex-grow p-2 border border-sheet-border bg-sheet-input-bg text-sm select-text"
        />
        <button @click="copyToClipboard" class="icon-button" title="Copy to clipboard">
          <span v-html="feather.icons.copy.toSvg()"></span>
        </button>
      </div>
      <button @click="store.closeShareModal" class="icon-button">
        <span v-html="feather.icons.x.toSvg()"></span>
        Close
      </button>
    </div>
  </div>
</template>
