<script setup lang="ts">
import { computed, onMounted, ref, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useCharacterStore } from './stores/character'
import { useRulesStore } from './stores/rulesStore'
import { useGuildContentSyncStore } from './stores/guildContentSyncStore'
import { useFeedbackStore } from './stores/feedbackStore'
import ImportModal from './components/modals/ImportModal.vue'
import MoreActionsMenu from './components/MoreActionsMenu.vue'

// Lazy-load modals to reduce initial bundle size
const LoadingModal = defineAsyncComponent(() => import('./components/modals/LoadingModal.vue'))
const ErrorModal = defineAsyncComponent(() => import('./components/modals/ErrorModal.vue'))
const ShareModal = defineAsyncComponent(() => import('./components/modals/ShareModal.vue'))
const FeedbackModal = defineAsyncComponent(() => import('./components/modals/FeedbackModal.vue'))
const DiscordUnlockReminderModal = defineAsyncComponent(
  () => import('./components/modals/DiscordUnlockReminderModal.vue'),
)
const UpdateNotification = defineAsyncComponent(() => import('./components/UpdateNotification.vue'))

const store = useCharacterStore()
const route = useRoute()
/** Pages such as Terms / Privacy that render without a loaded character. */
const isStandalonePage = computed(() => route.meta.standalone === true)
const showImportModal = ref(false)
const showImportCharacterModal = ref(false)
const showFeedbackModal = ref(false)
const showMoreMenu = ref(false)

onMounted(async () => {
  await useRulesStore().loadFromStorage()
  store.initStore()
  // Initialize guild content sync — sets up watchers on activeGuildId
  useGuildContentSyncStore()
  // Probe the feedback service so unavailable entry points never render
  // (logs a console error for devs when the service is unconfigured).
  useFeedbackStore().checkAvailability()
})
</script>

<template>
  <div
    class="antialiased min-h-dvh flex flex-col text-on-background bg-background print:bg-white print:block print:min-h-0 select-none print:overflow-visible"
  >
    <ControlPanel
      @show-import="showImportModal = true"
      @show-character-import="showImportCharacterModal = true"
      @show-feedback="showFeedbackModal = true"
    />
    <MobileHeader @show-more="showMoreMenu = true" />

    <main
      class="flex-1 min-h-0 w-full md:pl-64 pt-[calc(4.5rem+env(safe-area-inset-top,0px))] md:pt-0 pb-mobile-safe md:pb-0 print:hidden"
    >
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-gutter">
        <div
          v-if="!store.currentCharacterData && !isStandalonePage"
          class="text-center p-10 max-w-4xl mx-auto bg-surface-container rounded-xl shadow-sm border border-primary-container"
        >
          <h1 class="font-headline-lg text-headline-lg text-tertiary">Welcome, Gamemaster!</h1>
          <p class="mt-4 text-on-surface-variant font-body-md">
            Start by creating a
            <button @click="store.handleNewCharacter" class="text-primary font-bold hover:underline">
              new character</button
            >, or open the menu to load one from your library or import a character file.
          </p>
        </div>

        <CharacterSheet v-if="store.currentCharacterData || isStandalonePage" />
      </div>
    </main>

    <PrintableSheet v-if="store.currentCharacterData" />

    <LoadingModal />
    <ErrorModal />
    <ShareModal />
    <ImportModal :show="showImportModal" @close="showImportModal = false" />
    <ImportCharacterModal
      :show="showImportCharacterModal"
      @close="showImportCharacterModal = false"
    />
    <FeedbackModal :is-open="showFeedbackModal" @close="showFeedbackModal = false" />
    <DiscordUnlockReminderModal />
    <ConfirmDialog />

    <MobileTabBar
      v-if="store.currentCharacterData"
      class="md:hidden print:hidden"
      @show-more="showMoreMenu = true"
    />

    <MoreActionsMenu
      v-model="showMoreMenu"
      class="print:hidden"
      @show-import="showImportModal = true"
      @show-character-import="showImportCharacterModal = true"
      @show-feedback="showFeedbackModal = true"
    />

    <UpdateNotification class="print:hidden" />

    <!-- Viewport grain overlay — non-interactive -->
    <div
      class="fixed inset-0 pointer-events-none z-[100] grain opacity-[0.03] mix-blend-overlay print:hidden"
      aria-hidden="true"
    ></div>
  </div>
</template>
