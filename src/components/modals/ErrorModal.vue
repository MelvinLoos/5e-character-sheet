<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import feather from 'feather-icons'

const store = useCharacterStore()
</script>

<template>
  <div v-if="store.errorModal.show" class="modal-backdrop">
    <div class="modal-content">
      <h2 class="text-xl font-bold text-sheet-red mb-4">Error</h2>
      <ul class="text-left list-disc list-inside space-y-1 mb-6">
        <li v-for="error in store.errorModal.errors" :key="error">{{ error }}</li>
      </ul>
      <button @click="store.closeErrorModal" class="icon-button">
        <span v-html="feather.icons.x.toSvg()"></span>
        Close
      </button>
    </div>
  </div>
</template>
