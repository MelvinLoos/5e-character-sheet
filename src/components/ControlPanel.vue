<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCharacterStore } from '@/stores/character'
import AuthButton from './AuthButton.vue'
import GuildSelector from './GuildSelector.vue'

const store = useCharacterStore()
const route = useRoute()
const emit = defineEmits<{
  showImport: []
}>()
const geminiPrompt = ref('')

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
    } else if (value) {
      store.loadCharacterFromLibrary(value)
    }
  },
})

function generate() {
  store.generateCharacter(geminiPrompt.value)
  geminiPrompt.value = ''
}

function handlePrint() {
  const wasEditing = store.isEditing
  if (wasEditing) {
    store.toggleEdit()
  }

  setTimeout(() => {
    window.onbeforeprint = () => {
      // This logic is tricky. We'll set it back after print.
    }
    window.onafterprint = () => {
      if (wasEditing) {
        store.toggleEdit()
      }
      window.onafterprint = null
    }
    window.print()
  }, 100)
}

const navLinks = [
  { name: 'identity', label: 'Identity', icon: 'person' },
  { name: 'skills', label: 'Skills', icon: 'school' },
  { name: 'feats', label: 'Feats', icon: 'military_tech' },
  { name: 'spells', label: 'Spells', icon: 'auto_stories' },
  { name: 'inventory', label: 'Inventory', icon: 'backpack' },
  { name: 'narrative', label: 'Narrative', icon: 'history_edu' },
]

const queryParams = computed(() => {
  return route.query.id ? { query: { id: route.query.id } } : {}
})

// More popover state
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
          >account_circle</span
        >
      </div>
      <div class="text-center w-full px-2">
        <select
          class="font-headline-lg text-headline-lg text-tertiary leading-tight bg-transparent border-0 border-b border-transparent hover:border-tertiary/30 focus:border-tertiary focus:ring-0 focus:outline-none text-center cursor-pointer py-0 px-2 appearance-none w-full"
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
          Tier {{ store.currentCharacterData.renownTier || 1 }}
          {{ store.currentCharacterData.class || 'Aspirant' }}
        </p>
      </div>
    </div>

    <div class="px-6 mb-8 text-center w-full" v-else>
      <select
        class="font-headline-md text-headline-md text-tertiary leading-tight bg-transparent border-0 border-b border-transparent hover:border-tertiary/30 focus:border-tertiary focus:ring-0 focus:outline-none text-center cursor-pointer py-0 px-2 appearance-none w-full mb-2"
        v-model="selectedCharacter"
      >
        <option value="" disabled class="bg-primary-container text-on-surface font-body-md text-sm">
          Midnight Scholar
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
      <p class="font-label-md text-on-surface-variant">Character Manager</p>
    </div>

    <!-- Edit Mode Toggle Bar (Option A) -->
    <div
      v-if="store.currentCharacterData"
      class="mx-4 mb-6 p-1 rounded-xl bg-surface-variant/50 border border-outline-variant/30 flex items-stretch"
    >
      <button
        @click="store.toggleEdit()"
        class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-label-md transition-all duration-200 ease-out active:scale-95 select-none"
        :class="store.isEditing ? 'text-on-surface-variant hover:bg-surface-bright' : 'bg-tertiary text-on-tertiary shadow-sm'"
        :title="store.isEditing ? 'Exit Edit Mode' : 'Enter Edit Mode'"
        :aria-label="store.isEditing ? 'Exit Edit Mode' : 'Enter Edit Mode'"
      >
        <span class="material-symbols-outlined text-[1.125rem]">visibility</span>
        <span>Viewing</span>
      </button>
      <button
        @click="store.toggleEdit()"
        class="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-label-md transition-all duration-200 ease-out active:scale-95 select-none"
        :class="store.isEditing ? 'bg-tertiary text-on-tertiary shadow-sm' : 'text-on-surface-variant hover:bg-surface-bright'"
        :title="store.isEditing ? 'Exit Edit Mode' : 'Enter Edit Mode'"
        :aria-label="store.isEditing ? 'Exit Edit Mode' : 'Enter Edit Mode'"
      >
        <span class="material-symbols-outlined text-[1.125rem]">edit</span>
        <span>Edit</span>
      </button>
    </div>

    <!-- Navigation Links -->
    <ul v-if="store.currentCharacterData" class="flex flex-col gap-1 px-4 mb-6">
      <li v-for="link in navLinks" :key="link.name">
        <router-link
          :to="{ name: link.name, ...queryParams }"
          class="flex items-center gap-3 px-4 py-3 transition-colors font-label-lg"
          :class="[
            route.name === link.name
              ? 'border-r-4 border-tertiary bg-surface-variant/30 text-primary font-bold'
              : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface',
          ]"
        >
          <span class="material-symbols-outlined text-[1.25rem]">{{ link.icon }}</span>
          {{ link.label }}
        </router-link>
      </li>

      <!-- More Nav Item -->
      <li class="relative">
        <button
          ref="moreButtonRef"
          @click="toggleMorePopover"
          class="flex items-center gap-3 px-4 py-3 w-full transition-colors font-label-lg text-on-surface-variant hover:bg-surface-variant hover:text-on-surface"
          :class="{ 'bg-surface-variant/30 text-primary font-bold': showMorePopover }"
          :aria-expanded="showMorePopover"
          aria-haspopup="true"
        >
          <span class="material-symbols-outlined text-[1.25rem]">more_horiz</span>
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

              <button
                @click="emit('showImport'); closeMorePopover()"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface font-label-md text-sm hover:bg-surface-variant active:scale-[0.98] transition-all duration-150 ease-out select-none w-full text-left"
                title="Import JSON"
                role="menuitem"
              >
                <span class="material-symbols-outlined text-[1.125rem]">file_upload</span>
                Import Data
              </button>

              <button
                @click="handleMoreAction(() => store.saveToLibrary())"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface font-label-md text-sm hover:bg-surface-variant active:scale-[0.98] transition-all duration-150 ease-out select-none w-full text-left"
                :title="store.sourceCharacterId ? 'Save a Local Copy' : 'Save to Browser Library'"
                role="menuitem"
              >
                <span class="material-symbols-outlined text-[1.125rem]">{{
                  store.sourceCharacterId ? 'content_copy' : 'save'
                }}</span>
                {{ store.sourceCharacterId ? 'Save Local Copy' : 'Save to Library' }}
              </button>

              <button
                @click="handleMoreAction(() => store.shareCharacter())"
                :disabled="!store.supabaseClient"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface font-label-md text-sm hover:bg-surface-variant active:scale-[0.98] transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed select-none w-full text-left"
                title="Share Online"
                role="menuitem"
              >
                <span class="material-symbols-outlined text-[1.125rem]">share</span>
                Share Online
              </button>

              <button
                @click="handleMoreAction(() => store.exportCharacter())"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface font-label-md text-sm hover:bg-surface-variant active:scale-[0.98] transition-all duration-150 ease-out select-none w-full text-left"
                title="Export JSON"
                role="menuitem"
              >
                <span class="material-symbols-outlined text-[1.125rem]">download</span>
                Export JSON
              </button>

              <div class="h-px bg-outline-variant/30 my-1"></div>

              <button
                @click="handleMoreAction(handlePrint)"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-tertiary font-label-md text-sm hover:bg-tertiary/10 active:scale-[0.98] transition-all duration-150 ease-out select-none w-full text-left"
                title="Print Sheet"
                role="menuitem"
              >
                <span class="material-symbols-outlined text-[1.125rem]">print</span>
                Print Sheet
              </button>
            </div>
          </div>
        </Transition>
      </li>
    </ul>

    <ul class="flex flex-col gap-2 flex-grow mt-4 overflow-y-auto px-2">
      <!-- AI Generator -->
      <li class="mb-4" v-if="store.geminiSchema">
        <div class="px-4 py-3 bg-surface-variant/30 rounded-lg border border-tertiary/30">
          <label class="block font-label-md text-label-md text-tertiary mb-2">✨ AI Generate</label>
          <input
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
  </nav>

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
