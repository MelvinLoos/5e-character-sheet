<script setup lang="ts">
import { onMounted, defineAsyncComponent } from 'vue'
import { useCharacterStore } from './stores/character'
import ControlPanel from './components/ControlPanel.vue'
import CharacterSheet from './components/CharacterSheet.vue'

// Lazy-load modals to reduce initial bundle size
const LoadingModal = defineAsyncComponent(() => import('./components/modals/LoadingModal.vue'))
const ErrorModal = defineAsyncComponent(() => import('./components/modals/ErrorModal.vue'))
const ShareModal = defineAsyncComponent(() => import('./components/modals/ShareModal.vue'))

const store = useCharacterStore()

onMounted(() => {
  store.initStore()
})
</script>

<template>
  <div class="min-h-screen bg-sheet-bg">
    <div class="container mx-auto px-4 py-4 max-w-7xl">
      <ControlPanel />

      <div v-if="!store.currentCharacterData"
        class="text-center p-10 max-w-4xl mx-auto bg-amber-50 rounded shadow-md border border-amber-200">
        <h2 class="font-fell text-2xl">Welcome, Gamemaster!</h2>
        <p class="mt-2">
          Start by creating a
          <button @click="store.handleNewCharacter" class="text-sheet-red font-bold underline">
            new character</button>, loading one from your library, or using the AI generator.
        </p>
      </div>

      <CharacterSheet v-if="store.currentCharacterData" />
    </div>

    <LoadingModal />
    <ErrorModal />
    <ShareModal />
  </div>
</template>
