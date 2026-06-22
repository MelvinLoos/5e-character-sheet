<script setup lang="ts">
import { onMounted, defineAsyncComponent } from 'vue'
import { useCharacterStore } from './stores/character'
import { useRulesStore } from './stores/rulesStore'
import ControlPanel from './components/ControlPanel.vue'
import CharacterSheet from './components/CharacterSheet.vue'

// Lazy-load modals to reduce initial bundle size
const LoadingModal = defineAsyncComponent(() => import('./components/modals/LoadingModal.vue'))
const ErrorModal = defineAsyncComponent(() => import('./components/modals/ErrorModal.vue'))
const ShareModal = defineAsyncComponent(() => import('./components/modals/ShareModal.vue'))

const store = useCharacterStore()

onMounted(async () => {
  await useRulesStore().loadFromStorage()
  store.initStore()
})
</script>

<template>
  <div class="antialiased min-h-screen flex text-on-background bg-background">
    <ControlPanel />

    <main
      class="flex-grow ml-0 md:ml-64 pt-20 md:pt-0 p-container-padding flex flex-col gap-8 max-w-7xl mx-auto w-full px-gutter"
    >
      <div
        v-if="!store.currentCharacterData"
        class="text-center p-10 max-w-4xl mx-auto bg-surface-container rounded-xl shadow-sm border border-primary-container"
      >
        <h2 class="font-headline-lg text-headline-lg text-tertiary">Welcome, Gamemaster!</h2>
        <p class="mt-4 text-on-surface-variant font-body-md">
          Start by creating a
          <button @click="store.handleNewCharacter" class="text-primary font-bold hover:underline">
            new character</button
          >, loading one from your library, or using the AI generator.
        </p>
      </div>

      <CharacterSheet v-if="store.currentCharacterData" />
    </main>

    <LoadingModal />
    <ErrorModal />
    <ShareModal />
  </div>
</template>
