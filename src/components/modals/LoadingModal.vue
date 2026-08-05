<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'

const store = useCharacterStore()
</script>

<template>
  <div v-if="store.isLoading" class="modal-backdrop backdrop-blur-sm bg-black/40">
    <div class="modal-content rounded-xl">
      <div class="loading-spinner mx-auto mb-4"></div>
      <p class="text-lg font-bold text-sheet-red">{{ store.loadingText }}</p>
    </div>
  </div>
</template>
