<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useCharacterStore } from '@/stores/character'
import AuthButton from './AuthButton.vue'
import GuildSelector from './GuildSelector.vue'
import GuildManagementModal from './modals/GuildManagementModal.vue'
import { useGuildStore } from '@/stores/guildStore'
import { useFeedbackStore } from '@/stores/feedbackStore'
import CompletionBadge from './ui/CompletionBadge.vue'
import { usesLevels, getCharacterLevel } from '@/domain'
import { useConfirm } from '@/composables/useConfirm'
import { useCharacterCompletion } from '@/composables/useCharacterCompletion'
import { useCharacterActions } from '@/composables/useCharacterActions'
import { useOnboardingTour } from '@/composables/useOnboardingTour'
import { NAV_LINKS } from '@/constants/navigation'
import ThemeToggle from './ThemeToggle.vue'

const store = useCharacterStore()
const guildStore = useGuildStore()
const feedbackStore = useFeedbackStore()
const route = useRoute()
const { badges } = useCharacterCompletion()
const { startTour } = useOnboardingTour()
const emit = defineEmits<{
  showImport: []
  showCharacterImport: []
  showFeedback: []
}>()
const geminiPrompt = ref('')

// Guild Management Modal state
const showGuildManagement = ref(false)

const { characterSelectOptions, currentCharacterValue, selectCharacter, printSheet } =
  useCharacterActions()

const selectedCharacter = computed({
  get: () => currentCharacterValue.value,
  set: (value: string) => {
    selectCharacter(value)
  },
})

function generate() {
  store.generateCharacter(geminiPrompt.value)
  geminiPrompt.value = ''
}

const queryParams = computed(() => {
  return route.query.id ? { query: { id: route.query.id } } : {}
})

const navEntries = computed(() =>
  NAV_LINKS.map((link) => ({
    ...link,
    badge: badges.value[link.name],
  })),
)

// More popover state
const { confirm } = useConfirm()
const showMorePopover = ref(false)
const moreButtonRef = ref<HTMLElement | null>(null)
const popoverRef = ref<HTMLElement | null>(null)

function toggleMorePopover() {
  showMorePopover.value = !showMorePopover.value
}

function closeMorePopover() {
  showMorePopover.value = false
}

function handleMoreAction(action: () => void) {
  action()
  closeMorePopover()
}

/** Reopen the guided Create flow on the current character. */
function reopenGuide() {
  closeMorePopover()
  store.openCreationGuide()
}

/** Switch between Renown Tiers and plain levels (for one-shots and regular games). */
async function toggleProgressionMode() {
  closeMorePopover()
  const toLevels = !usesLevels(store.currentCharacterData)
  const ok = await confirm(
    toLevels
      ? {
          title: 'Use character levels?',
          message:
            'Progress by character level instead of Renown Tiers. Your current level is kept and Renown progress is hidden.',
          confirmLabel: 'Use levels',
        }
      : {
          title: 'Go back to Renown Tiers?',
          message: 'Your level is mapped to the nearest Renown Tier.',
          confirmLabel: 'Use Renown',
        },
  )
  if (ok) store.setProgressionMode(toLevels ? 'level' : 'renown')
}

/** Close the popover and replay the guided tour. */
function restartTour() {
  closeMorePopover()
  store.leaveGuide() // the tour points at the sheet, not the guided Create flow
  void nextTick().then(startTour)
}

function handleClickOutside(event: MouseEvent) {
  if (
    popoverRef.value &&
    !popoverRef.value.contains(event.target as Node) &&
    moreButtonRef.value &&
    !moreButtonRef.value.contains(event.target as Node)
  ) {
    closeMorePopover()
  }
}

function handlePopoverKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeMorePopover()
    moreButtonRef.value?.focus()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
function confirmShare() {
  if (window.confirm('Share this character online? Anyone with the link can view it.')) store.shareCharacter()
}
</script>

<template>
  <!-- SideNavBar -->
  <nav
    class="h-screen w-64 fixed left-0 top-0 bg-primary-container dark:bg-primary-container shadow-sm flex flex-col py-container-padding z-50 md:flex hidden min-h-screen bottom-0 print:hidden"
  >
    <div class="px-6 mb-8 flex flex-col items-center gap-4" v-if="store.currentCharacterData">
      <div
        class="relative w-24 h-24 rounded-full border-2 border-tertiary overflow-hidden flex-shrink-0 bg-surface-variant flex items-center justify-center"
      >
        <span class="material-symbols-outlined text-5xl text-on-surface-variant"
           aria-hidden="true">account_circle</span
        >
      </div>
      <div class="text-center w-full px-2">
        <select
          aria-label="Character"
          class="focus-visible:ring-2 focus-visible:ring-tertiary font-headline-md text-headline-md text-tertiary leading-tight text-ellipsis min-h-11 bg-transparent border-0 border-b border-transparent hover:border-tertiary/30 focus:border-tertiary focus:ring-0 focus:outline-none text-center cursor-pointer py-0 px-2 appearance-none w-full"
          v-model="selectedCharacter"
        >
          <option
            v-if="store.currentCharacterData"
            :value="`${store.sessionName}|${store.currentCharacterData.name}`"
            disabled
            class="hidden"
          >
            {{ store.currentCharacterData.name }}
          </option>
          <option
            value="new"
            class="bg-primary-container text-tertiary font-body-md text-sm font-bold"
          >
            + New Character
          </option>
          <optgroup
            v-for="group in characterSelectOptions"
            :key="group.label"
            :label="group.label"
            class="bg-primary-container text-on-surface-variant font-body-md text-sm"
          >
            <option
              v-for="char in group.options"
              :key="char.value"
              :value="char.value"
              class="bg-primary-container text-on-surface font-body-md text-sm"
            >
              {{ char.text }}
            </option>
          </optgroup>
        </select>
        <p class="font-label-md text-label-md text-on-surface-variant mt-1">
          {{
            usesLevels(store.currentCharacterData)
              ? `Level ${getCharacterLevel(store.currentCharacterData)}`
              : `Tier ${store.currentCharacterData.renownTier || 1}`
          }}
          {{ store.currentCharacterData.class || (usesLevels(store.currentCharacterData) ? 'Adventurer' : 'Aspirant') }}
        </p>
      </div>
    </div>

    <div class="px-6 mb-8 text-center w-full" v-else>
      <select
        aria-label="Character"
        class="focus-visible:ring-2 focus-visible:ring-tertiary font-headline-md text-headline-md text-tertiary leading-tight bg-transparent border-0 border-b border-transparent hover:border-tertiary/30 focus:border-tertiary focus:ring-0 focus:outline-none text-center cursor-pointer py-0 px-2 appearance-none w-full mb-2"
        v-model="selectedCharacter"
      >
        <option value="" disabled class="bg-primary-container text-on-surface font-body-md text-sm">
          Character Sheet
        </option>
        <option
          value="new"
          class="bg-primary-container text-tertiary font-body-md text-sm font-bold"
        >
          + New Character
        </option>
        <optgroup
          v-for="group in characterSelectOptions"
          :key="group.label"
          :label="group.label"
          class="bg-primary-container text-on-surface-variant font-body-md text-sm"
        >
          <option
            v-for="char in group.options"
            :key="char.value"
            :value="char.value"
            class="bg-primary-container text-on-surface font-body-md text-sm"
          >
            {{ char.text }}
          </option>
        </optgroup>
      </select>
      <p class="font-label-md text-on-surface-variant">Heroes Guild</p>
    </div>

    <!-- Edit Mode Toggle Bar (Option A) -->
    <div
      v-if="store.currentCharacterData"
      class="mx-4 mb-6 p-1 rounded-xl bg-surface-variant/50 border border-outline-variant/30 flex items-stretch"
    >
      <button
        @click="store.isEditing && store.toggleEdit()"
        class="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-sm font-label-md transition-all duration-200 ease-out active:scale-95 select-none"
        :class="store.isEditing ? 'text-on-surface-variant hover:bg-surface-bright' : 'bg-tertiary text-on-tertiary shadow-sm'"
        :aria-pressed="!store.isEditing"
      >
        <span class="material-symbols-outlined text-[1.125rem]" aria-hidden="true">visibility</span>
        <span>Viewing</span>
      </button>
      <button
        @click="!store.isEditing && store.toggleEdit()"
        class="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-sm font-label-md transition-all duration-200 ease-out active:scale-95 select-none"
        :class="store.isEditing ? 'bg-tertiary text-on-tertiary shadow-sm' : 'text-on-surface-variant hover:bg-surface-bright'"
        :aria-pressed="store.isEditing"
      >
        <span class="material-symbols-outlined text-[1.125rem]" aria-hidden="true">edit</span>
        <span>Edit</span>
      </button>
    </div>

    <!-- Navigation Links -->
    <ul class="flex flex-col gap-1 px-4 mb-6">
      <template v-if="store.currentCharacterData">
      <li v-for="entry in navEntries" :key="entry.name">
        <router-link
          :to="{ name: entry.name, ...queryParams }"
          class="flex items-center gap-3 px-4 py-3 transition-colors font-label-lg"
          :class="[
            route.name === entry.name
              ? 'border-r-4 border-tertiary bg-surface-variant/30 text-primary font-bold'
              : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface',
          ]"
          :aria-label="entry.badge ? `${entry.label} — ${entry.badge.label}` : undefined"
          :title="entry.badge?.label"
        >
          <span class="material-symbols-outlined text-[1.25rem]" aria-hidden="true">{{ entry.icon }}</span>
          <span class="flex-1">{{ entry.label }}</span>
          <CompletionBadge v-if="entry.badge" :badge="entry.badge" />
        </router-link>
      </li>
      </template>

      <!-- More Nav Item (also available before a character is loaded) -->
      <li class="relative">
        <button
          ref="moreButtonRef"
          @click="toggleMorePopover"
          class="flex items-center gap-3 px-4 py-3 w-full transition-colors font-label-lg text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
          :class="{ 'bg-surface-variant/30 text-primary font-bold': showMorePopover }"
          :aria-expanded="showMorePopover"
          aria-haspopup="true"
        >
          <span class="material-symbols-outlined text-[1.25rem]" aria-hidden="true">more_horiz</span>
          More
        </button>

        <!-- More Popover -->
        <Transition name="popover">
          <div
            v-if="showMorePopover"
            ref="popoverRef"
            class="absolute left-full bottom-0 ml-2 w-52 bg-surface-container rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)] border border-outline-variant z-[60] overflow-hidden"
            @keydown="handlePopoverKeydown"
            role="menu"
            aria-label="More actions"
          >
            <div class="p-2 flex flex-col gap-1">
              <!-- Guild Selector (Discord integration) -->
              <GuildSelector />

              <!-- Auth -->
              <AuthButton />

              <!-- Admin: Manage Server Homebrew -->
              <div v-if="guildStore.isActiveGuildAdmin" class="mt-1">
                <div class="h-px bg-outline-variant/30 my-1"></div>
                <button
                  @click="showGuildManagement = true; closeMorePopover()"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-tertiary font-label-md text-sm hover:bg-tertiary/10 active:scale-[0.98] transition-all duration-150 ease-out select-none w-full text-left"
                  title="Manage Server Homebrew"
                  role="menuitem"
                >
                  <span class="material-symbols-outlined text-[1.125rem]" aria-hidden="true">shield</span>
                  Manage Server Homebrew
                </button>
              </div>

              <button
                v-if="feedbackStore.isFeedbackAvailable"
                @click="emit('showFeedback'); closeMorePopover()"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface font-label-md text-sm hover:bg-surface-variant active:scale-[0.98] transition-all duration-150 ease-out select-none w-full text-left"
                title="Give Feedback"
                role="menuitem"
              >
                <span class="material-symbols-outlined text-[1.125rem]" aria-hidden="true">feedback</span>
                Give Feedback
              </button>

              <button
                @click="emit('showImport'); closeMorePopover()"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface font-label-md text-sm hover:bg-surface-variant active:scale-[0.98] transition-all duration-150 ease-out select-none w-full text-left"
                title="Import spells and feats from 5e.tools JSON"
                role="menuitem"
              >
                <span class="material-symbols-outlined text-[1.125rem]" aria-hidden="true">file_upload</span>
                Import Spells, Feats &amp; Subclasses
              </button>

              <button
                @click="emit('showCharacterImport'); closeMorePopover()"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface font-label-md text-sm hover:bg-surface-variant active:scale-[0.98] transition-all duration-150 ease-out select-none w-full text-left"
                title="Import Character"
                role="menuitem"
              >
                <span class="material-symbols-outlined text-[1.125rem]" aria-hidden="true">person_add</span>
                Import Character
              </button>

              <template v-if="store.currentCharacterData">
              <button
                @click="handleMoreAction(() => store.saveToLibrary())"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface font-label-md text-sm hover:bg-surface-variant active:scale-[0.98] transition-all duration-150 ease-out select-none w-full text-left"
                :title="store.sourceCharacterId ? 'Save a Local Copy' : 'Save to Browser Library'"
                role="menuitem"
              >
                <span class="material-symbols-outlined text-[1.125rem]" aria-hidden="true">{{
                  store.sourceCharacterId ? 'content_copy' : 'save'
                }}</span>
                {{ store.sourceCharacterId ? 'Save Local Copy' : 'Save to Library' }}
              </button>

              <button
                @click="handleMoreAction(confirmShare)"
                :disabled="!store.isSupabaseReady"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface font-label-md text-sm hover:bg-surface-variant active:scale-[0.98] transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed select-none w-full text-left"
                title="Share Online"
                role="menuitem"
              >
                <span class="material-symbols-outlined text-[1.125rem]" aria-hidden="true">share</span>
                Share Online
              </button>

              <button
                @click="handleMoreAction(() => store.exportCharacter())"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface font-label-md text-sm hover:bg-surface-variant active:scale-[0.98] transition-all duration-150 ease-out select-none w-full text-left"
                title="Export JSON"
                role="menuitem"
              >
                <span class="material-symbols-outlined text-[1.125rem]" aria-hidden="true">download</span>
                Export JSON
              </button>

              <div class="h-px bg-outline-variant/30 my-1"></div>

              <button
                @click="handleMoreAction(printSheet)"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-tertiary font-label-md text-sm hover:bg-tertiary/10 active:scale-[0.98] transition-all duration-150 ease-out select-none w-full text-left"
                title="Print Sheet"
                role="menuitem"
              >
                <span class="material-symbols-outlined text-[1.125rem]" aria-hidden="true">print</span>
                Print Sheet
              </button>

              <button
                @click="reopenGuide"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface font-label-md text-sm hover:bg-surface-variant active:scale-[0.98] transition-all duration-150 ease-out select-none w-full text-left"
                title="Reopen creation guide"
                role="menuitem"
              >
                <span class="material-symbols-outlined text-[1.125rem]" aria-hidden="true">auto_fix_high</span>
                Reopen creation guide
              </button>

              <button
                @click="restartTour"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface font-label-md text-sm hover:bg-surface-variant active:scale-[0.98] transition-all duration-150 ease-out select-none w-full text-left"
                title="Restart Tour"
                role="menuitem"
              >
                <span class="material-symbols-outlined text-[1.125rem]" aria-hidden="true">tour</span>
                Restart Tour
              </button>

              <button
                @click="toggleProgressionMode"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant font-label-md text-sm hover:bg-surface-variant active:scale-[0.98] transition-all duration-150 ease-out select-none w-full text-left"
                title="Progression mode"
                role="menuitem"
              >
                <span class="material-symbols-outlined text-[1.125rem]" aria-hidden="true">trending_up</span>
                {{ usesLevels(store.currentCharacterData) ? 'Use Renown Tiers' : 'Use character levels' }}
              </button>
              </template>
            </div>
          </div>
        </Transition>
      </li>
    </ul>

    <ul class="flex flex-col gap-2 flex-grow mt-4 overflow-y-auto px-2">
      <!-- AI Generator -->
      <li class="mb-4" v-if="store.geminiSchema">
        <div class="px-4 py-3 bg-surface-variant/30 rounded-lg border border-tertiary/30">
          <label for="ai-generate-prompt" class="flex items-center gap-1 font-label-md text-label-md text-tertiary mb-2">
            <span class="material-symbols-outlined text-base" aria-hidden="true">auto_awesome</span>
            AI Generate
          </label>
          <input
            id="ai-generate-prompt"
            type="text"
            v-model="geminiPrompt"
            @keyup.enter="generate"
            class="w-full bg-background border border-outline-variant rounded p-2 text-on-surface font-body-md text-sm mb-2 focus:border-tertiary focus:ring-1 focus:ring-tertiary"
            placeholder="e.g. 'grumpy dwarf cleric'"
          />
        <button
          @click="generate"
          class="w-full bg-tertiary/20 text-tertiary hover:bg-tertiary hover:text-on-tertiary hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm active:scale-95 font-label-md text-sm py-2 rounded transition-all duration-200 ease-out select-none"
        >
          Generate
        </button>
        </div>
      </li>

    </ul>

    <!-- Theme + legal links (visible regardless of character load state) -->
    <div class="mt-auto px-4 pb-4 flex items-center gap-2 justify-center">
      <ThemeToggle />
      <router-link
        :to="{ name: 'terms' }"
        class="inline-flex min-h-11 items-center px-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors font-label-md"
      >
        Terms
      </router-link>
      <router-link
        :to="{ name: 'privacy' }"
        class="inline-flex min-h-11 items-center px-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors font-label-md"
      >
        Privacy
      </router-link>
    </div>
  </nav>

  <!-- Guild Management Modal -->
  <GuildManagementModal
    :is-open="showGuildManagement"
    @close="showGuildManagement = false"
  />

</template>

<style scoped>
.popover-enter-active {
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.popover-leave-active {
  transition: all 150ms ease-in;
}

.popover-enter-from {
  opacity: 0;
  transform: scale(0.9) translateX(-8px);
}

.popover-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
