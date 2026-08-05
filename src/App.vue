<script setup lang="ts">
import { onMounted, ref, defineAsyncComponent } from 'vue'
import { useCharacterStore } from './stores/character'
import { useRulesStore } from './stores/rulesStore'
import ImportModal from './components/modals/ImportModal.vue'

// Lazy-load modals to reduce initial bundle size
const LoadingModal = defineAsyncComponent(() => import('./components/modals/LoadingModal.vue'))
const ErrorModal = defineAsyncComponent(() => import('./components/modals/ErrorModal.vue'))
const ShareModal = defineAsyncComponent(() => import('./components/modals/ShareModal.vue'))
const UpdateNotification = defineAsyncComponent(() => import('./components/UpdateNotification.vue'))

const store = useCharacterStore()
const showImportModal = ref(false)

onMounted(async () => {
  await useRulesStore().loadFromStorage()
  store.initStore()
})
</script>

<template>
  <div
    class="antialiased min-h-screen flex text-on-background bg-background print:bg-white print:block print:min-h-0 select-none"
  >
    <ControlPanel @show-import="showImportModal = true" />
    <MobileHeader v-if="store.currentCharacterData" @show-import="showImportModal = true" />

    <main
      class="flex-grow ml-0 md:ml-64 pt-20 md:pt-0 pb-20 md:pb-0 p-container-padding flex flex-col gap-8 max-w-7xl mx-auto w-full px-gutter print:hidden"
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

    <PrintableSheet v-if="store.currentCharacterData" />

    <LoadingModal />
    <ErrorModal />
    <ShareModal />
    <ImportModal :show="showImportModal" @close="showImportModal = false" />

    <MobileTabBar v-if="store.currentCharacterData" class="md:hidden" />

    <ThemeToggle />
    <UpdateNotification />

    <!-- Viewport grain overlay — non-interactive -->
    <div
      class="fixed inset-0 pointer-events-none z-[100] grain opacity-[0.03] mix-blend-overlay"
      aria-hidden="true"
    ></div>
  </div>
</template>
