<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { useCharacterStore } from '@/stores/character'
import { useAuthStore } from '@/stores/authStore'
import { useGuildStore } from '@/stores/guildStore'
import { useFeedbackStore } from '@/stores/feedbackStore'
import AuthButton from './AuthButton.vue'
import GuildSelector from './GuildSelector.vue'
import GuildManagementModal from './modals/GuildManagementModal.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  showImport: []
  showFeedback: []
}>()

const store = useCharacterStore()
useAuthStore()
const guildStore = useGuildStore()

interface Character {
  name: string
  [key: string]: unknown
}

const characterSelectOptions = computed(() => {
  return Object.entries(store.characterLibrary).map(([session, chars]) => ({
    label: session,
    options: (chars as unknown as Character[]).map((char: Character) => ({
      text: char.name,
      value: `${session}|${char.name}`,
    })),
  }))
})

const selectedCharacter = computed({
  get: () =>
    store.currentCharacterData ? `${store.sessionName}|${store.currentCharacterData.name}` : '',
  set: (value) => {
    if (value === 'new') {
      store.handleNewCharacter()
      close()
    } else if (value) {
      store.loadCharacterFromLibrary(value)
      close()
    }
  },
})
const feedbackStore = useFeedbackStore()
const showGuildManagement = ref(false)
const menuRef = ref<HTMLDivElement | null>(null)
const firstItemRef = ref<HTMLButtonElement | null>(null)

function close() {
  emit('update:modelValue', false)
}

function openImport() {
  close()
  emit('showImport')
}

function openFeedback() {
  close()
  emit('showFeedback')
}

function saveToLibrary() {
  store.saveToLibrary()
  close()
}

function shareCharacter() {
  store.shareCharacter()
  close()
}

function exportCharacter() {
  store.exportCharacter()
  close()
}

function handlePrint() {
  const wasEditing = store.isEditing
  if (wasEditing) {
    store.toggleEdit()
  }

  setTimeout(() => {
    window.onafterprint = () => {
      if (wasEditing) {
        store.toggleEdit()
      }
      window.onafterprint = null
    }
    window.print()
  }, 100)

  close()
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === menuRef.value) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
    return
  }

  if (event.key !== 'Tab') return

  const buttons = Array.from(menuRef.value?.querySelectorAll('button') ?? [])
  if (buttons.length === 0) return

  const firstButton = buttons[0]
  const lastButton = buttons[buttons.length - 1]
  if (!firstButton || !lastButton) return

  if (event.shiftKey && document.activeElement === firstButton) {
    event.preventDefault()
    lastButton.focus()
  } else if (!event.shiftKey && document.activeElement === lastButton) {
    event.preventDefault()
    firstButton.focus()
  }
}

function openGuildManagement() {
  showGuildManagement.value = true
  close()
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      await nextTick()
      firstItemRef.value?.focus()
    }
  },
)
</script>

<template>
  <!-- Root wrapper so non-prop attributes (e.g. class="print:hidden") have
       a single DOM element to inherit on, avoiding Vue's fragment warning -->
  <div>
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="modelValue"
          ref="menuRef"
          class="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end md:hidden"
          @click="handleBackdropClick"
          @keydown="handleKeydown"
          role="dialog"
          aria-modal="true"
          aria-label="More actions"
        >
          <Transition name="slide-up">
            <div
              v-if="modelValue"
              class="w-full bg-surface-container rounded-t-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.3)] border-t border-outline-variant p-4 pb-8"
              @click.stop
            >
              <div class="w-12 h-1 bg-outline-variant rounded-full mx-auto mb-4"></div>

              <h3 class="font-headline-md text-tertiary mb-4 px-2">More Actions</h3>

              <!-- Character Select -->
              <div class="px-2 mb-4">
                <select
                  class="w-full bg-surface-variant border border-outline-variant rounded-xl p-3 text-on-surface font-label-md text-sm focus:border-tertiary focus:ring-1 focus:ring-tertiary appearance-none cursor-pointer"
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
                    class="bg-surface-container text-tertiary font-label-md text-sm font-bold"
                  >
                    + New Character
                  </option>
                  <optgroup
                    v-for="group in characterSelectOptions"
                    :key="group.label"
                    :label="group.label"
                    class="bg-surface-container text-on-surface-variant font-label-md text-sm"
                  >
                    <option
                      v-for="char in group.options"
                      :key="char.value"
                      :value="char.value"
                      class="bg-surface-container text-on-surface font-label-md text-sm"
                    >
                      {{ char.text }}
                    </option>
                  </optgroup>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <button
                  ref="firstItemRef"
                  @click="saveToLibrary"
                  class="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-surface-variant hover:bg-surface-bright active:scale-95 text-on-surface transition-all duration-200 ease-out select-none"
                  :title="store.sourceCharacterId ? 'Save a Local Copy' : 'Save to Browser Library'"
                >
                  <span class="material-symbols-outlined text-2xl">{{ store.sourceCharacterId ? 'content_copy' : 'save' }}</span>
                  <span class="text-xs font-label-md text-center">{{ store.sourceCharacterId ? 'Save Local Copy' : 'Save to Library' }}</span>
                </button>

                <button
                  @click="shareCharacter"
                  :disabled="!store.isSupabaseReady"
                  class="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-surface-variant hover:bg-surface-bright active:scale-95 text-on-surface transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 select-none"
                  title="Share Online"
                >
                  <span class="material-symbols-outlined text-2xl">share</span>
                  <span class="text-xs font-label-md text-center">Share Online</span>
                </button>

                <button
                  @click="exportCharacter"
                  class="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-surface-variant hover:bg-surface-bright active:scale-95 text-on-surface transition-all duration-200 ease-out select-none"
                  title="Export JSON"
                >
                  <span class="material-symbols-outlined text-2xl">download</span>
                  <span class="text-xs font-label-md text-center">Export JSON</span>
                </button>

                <button
                  @click="handlePrint"
                  class="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-tertiary text-on-tertiary hover:bg-tertiary-fixed active:scale-95 transition-all duration-200 ease-out select-none"
                  title="Print Sheet"
                >
                  <span class="material-symbols-outlined text-2xl">print</span>
                  <span class="text-xs font-label-md text-center">Print Sheet</span>
                </button>

                <button
                  @click="openImport"
                  class="col-span-2 flex flex-row items-center justify-center gap-2 p-4 rounded-xl bg-surface-variant hover:bg-surface-bright active:scale-95 text-on-surface transition-all duration-200 ease-out select-none"
                  title="Import Data"
                >
                  <span class="material-symbols-outlined text-2xl">file_upload</span>
                  <span class="text-xs font-label-md">Import Data</span>
                </button>

                <button
                  v-if="feedbackStore.isFeedbackAvailable"
                  @click="openFeedback"
                  class="col-span-2 flex flex-row items-center justify-center gap-2 p-4 rounded-xl bg-surface-variant hover:bg-surface-bright active:scale-95 text-on-surface transition-all duration-200 ease-out select-none"
                  title="Give Feedback"
                >
                  <span class="material-symbols-outlined text-2xl">feedback</span>
                  <span class="text-xs font-label-md">Give Feedback</span>
                </button>
              </div>

              <!-- Guild Selector (Discord integration) -->
              <div class="mt-4 px-2">
                <GuildSelector />
              </div>

              <!-- Admin: Manage Server Homebrew -->
              <div v-if="guildStore.isActiveGuildAdmin" class="mt-2 px-2">
                <div class="h-px bg-outline-variant/30 my-2"></div>
                <button
                  @click="openGuildManagement"
                  class="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-tertiary font-label-md text-sm hover:bg-tertiary/10 active:scale-[0.98] transition-all duration-150 ease-out select-none min-h-[44px]"
                  title="Manage Server Homebrew"
                >
                  <span class="material-symbols-outlined text-[1.125rem]">shield</span>
                  Manage Server Homebrew
                </button>
              </div>

              <!-- Auth -->
              <div class="mt-4">
                <AuthButton />
              </div>

              <button
                @click="close"
                class="w-full mt-4 py-3 rounded-xl bg-surface-bright text-on-surface font-label-md active:scale-95 transition-all duration-200 ease-out select-none min-h-[44px]"
              >
                Cancel
              </button>

              <!-- Legal Links (mobile) -->
              <div class="mt-4 pt-4 border-t border-outline-variant flex justify-center gap-4">
                <router-link
                  :to="{ name: 'terms' }"
                  @click="close"
                  class="text-xs text-on-surface-variant hover:text-on-surface transition-colors font-label-md"
                >
                  Terms
                </router-link>
                <router-link
                  :to="{ name: 'privacy' }"
                  @click="close"
                  class="text-xs text-on-surface-variant hover:text-on-surface transition-colors font-label-md"
                >
                  Privacy
                </router-link>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Guild Management Modal -->
    <GuildManagementModal
      :is-open="showGuildManagement"
      @close="showGuildManagement = false"
    />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 200ms ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}
</style>