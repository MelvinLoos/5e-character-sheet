<script setup>
import { useCharacterStore } from '@/stores/character'

const store = useCharacterStore()
</script>

<template>
  <div v-if="store.isLoading" class="modal-backdrop">
    <div class="modal-content">
      <div class="loading-spinner mx-auto mb-4"></div>
      <p class="text-lg font-bold text-sheet-red">{{ store.loadingText }}</p>
    </div>
  </div>
</template>
