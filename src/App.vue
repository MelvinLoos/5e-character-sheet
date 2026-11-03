<script setup lang="ts">
import { computed, onMounted, ref, defineAsyncComponent, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useCharacterStore } from './stores/character'
import { useRulesStore } from './stores/rulesStore'
import { useGuildContentSyncStore } from './stores/guildContentSyncStore'
import { useFeedbackStore } from './stores/feedbackStore'
import { useDiceTray } from './composables/useDiceTray'
import { useOnboardingTour } from './composables/useOnboardingTour'
import ImportModal from './components/modals/ImportModal.vue'
import MoreActionsMenu from './components/MoreActionsMenu.vue'
import UndoToast from './components/ui/UndoToast.vue'

// Lazy-load modals to reduce initial bundle size
const LoadingModal = defineAsyncComponent(() => import('./components/modals/LoadingModal.vue'))
const ErrorModal = defineAsyncComponent(() => import('./components/modals/ErrorModal.vue'))
const ShareModal = defineAsyncComponent(() => import('./components/modals/ShareModal.vue'))
const FeedbackModal = defineAsyncComponent(() => import('./components/modals/FeedbackModal.vue'))
const DiscordUnlockReminderModal = defineAsyncComponent(
  () => import('./components/modals/DiscordUnlockReminderModal.vue'),
)
const UpdateNotification = defineAsyncComponent(() => import('./components/UpdateNotification.vue'))
// The 3D dice engine (~700 KB) is only pulled in when the tray is first opened.
const DiceTray = defineAsyncComponent(() => import('./components/DiceTray.vue'))

const store = useCharacterStore()
const route = useRoute()
/** Pages such as Terms / Privacy that render without a loaded character. */
const isStandalonePage = computed(() => route.meta.standalone === true)
const showImportModal = ref(false)
const showImportCharacterModal = ref(false)
const showFeedbackModal = ref(false)
const showMoreMenu = ref(false)
// The tray lives in a module-level singleton so the initiative tracker can open
// it and roll through the same engine (see useDiceTray).
const { isMounted: diceTrayMounted, isOpen: showDiceTray, openTray: openDiceTray } = useDiceTray()
// First-time onboarding tour — also replayable from the More actions menus.
const { startTour, hasCompletedTour } = useOnboardingTour()

/**
 * Kick off the tour from the empty state. A fresh character must exist first so
 * the sheet views (and their `data-tour` anchors) are mounted before the tour
 * measures element coordinates.
 */
async function handleStartTourFromEmptyState(): Promise<void> {
  store.handleNewCharacter()
  await nextTick()
  await startTour()
}

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
          v-if="!store.hasCharacter && !isStandalonePage"
          class="bg-surface-container rounded-2xl border border-outline-variant shadow-elevation-2 p-10 max-w-2xl mx-auto text-center"
        >
          <h2 class="font-headline-lg text-headline-lg text-tertiary">Welcome, Adventurer</h2>
          <p class="mt-4 text-on-surface-variant font-body-md">
            Create your first character or import an existing character sheet from JSON.
          </p>
          <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              type="button"
              @click="store.handleNewCharacter"
              class="px-6 py-3 rounded-xl bg-tertiary text-on-tertiary font-label-md transition-all duration-200 active:scale-95 hover:bg-tertiary-fixed select-none"
            >
              Create Character
            </button>
            <button
              type="button"
              @click="showImportModal = true"
              class="px-6 py-3 rounded-xl bg-surface-variant text-on-surface font-label-md transition-all duration-200 active:scale-95 hover:bg-surface-bright select-none"
            >
              Import JSON
            </button>
          </div>
          <button
            type="button"
            @click="handleStartTourFromEmptyState"
            class="mt-6 text-primary font-label-md hover:underline select-none"
          >
            {{ hasCompletedTour ? 'Replay the tour' : 'Take a quick tour' }}
          </button>
        </div>

        <CharacterSheet v-if="store.hasCharacter || isStandalonePage" />
      </div>
    </main>

    <PrintableSheet v-if="store.hasCharacter" />

    <UndoToast />
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
      v-if="store.hasCharacter"
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

    <!-- Floating dice roller — visible whenever a character is loaded -->
    <button
      v-if="store.hasCharacter && !isStandalonePage"
      type="button"
      class="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-tertiary text-on-tertiary shadow-elevation-3 transition-all duration-200 hover:scale-105 active:scale-90 md:bottom-6 md:right-6 print:hidden"
      aria-label="Open dice roller"
      title="Open dice roller"
      data-testid="dice-fab"
      @click="openDiceTray"
    >
      <span class="material-symbols-outlined" aria-hidden="true">casino</span>
    </button>

    <!-- Mounted on first open and kept alive so the WebGL context is reused. -->
    <DiceTray v-if="diceTrayMounted" v-model:open="showDiceTray" />

    <CelebrationOverlay />

    <!-- First-time onboarding tour overlay (auto-imported component) -->
    <TourTooltip />

    <!-- Viewport grain overlay — non-interactive -->
    <div
      class="fixed inset-0 pointer-events-none z-[100] grain opacity-[0.03] mix-blend-overlay print:hidden"
      aria-hidden="true"
    ></div>
  </div>
</template>
