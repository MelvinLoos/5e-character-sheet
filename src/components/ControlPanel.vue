<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCharacterStore } from '@/stores/character'
import ImportModal from '@/components/modals/ImportModal.vue'
import SheetControls from './SheetControls.vue'

const store = useCharacterStore()
const route = useRoute()
const geminiPrompt = ref('')
const showImportModal = ref(false)
const showMobileMenu = ref(false)

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
          <option value="new" class="bg-primary-container text-tertiary font-body-md text-sm font-bold">+ New Character</option>
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
        <option value="" disabled class="bg-primary-container text-on-surface font-body-md text-sm">Midnight Scholar</option>
        <option value="new" class="bg-primary-container text-tertiary font-body-md text-sm font-bold">+ New Character</option>
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
            class="w-full bg-tertiary/20 text-tertiary hover:bg-tertiary hover:text-on-tertiary font-label-md text-sm py-2 rounded transition-colors"
          >
            Generate
          </button>
        </div>
      </li>

      <!-- Manual Controls -->
      <li>
        <div class="px-4 py-2">
          <button
            @click="showImportModal = true"
            class="w-full bg-surface-variant hover:bg-surface-bright text-on-surface font-label-md py-2 rounded text-sm transition-colors"
          >
            Import Data
          </button>
        </div>
      </li>
    </ul>

    <SheetControls class="print:hidden" />

    <div class="px-6 mt-auto pb-6 pt-4 border-t border-outline-variant/30">
      <button
        onclick="window.print()"
        class="w-full bg-tertiary text-on-tertiary font-label-md text-label-md py-3 rounded hover:bg-tertiary-fixed transition-colors flex items-center justify-center gap-2"
      >
        <span class="material-symbols-outlined">print</span>
        Print Sheet
      </button>
    </div>
  </nav>

  <!-- TopAppBar Mobile -->
  <header
    class="md:hidden flex justify-between items-center px-4 py-3 w-full top-0 bg-primary-container dark:bg-primary-container shadow-sm z-40 fixed print:hidden"
  >
    <span class="font-headline-md text-tertiary">Midnight Scholar</span>
    <div class="flex gap-4">
      <button
        @click="showMobileMenu = !showMobileMenu"
        class="text-on-surface-variant hover:text-primary transition-colors"
      >
        <span class="material-symbols-outlined">menu</span>
      </button>
    </div>
  </header>

  <div
    v-if="showMobileMenu"
    class="md:hidden fixed top-14 left-0 w-full bg-surface-container z-30 p-4 border-b border-outline-variant shadow-lg print:hidden"
  >
    <!-- Mobile Navigation Links -->
    <div v-if="store.currentCharacterData" class="mb-4 grid grid-cols-2 gap-2">
      <router-link
        v-for="link in navLinks"
        :key="link.name"
        :to="{ name: link.name, ...queryParams }"
        @click="showMobileMenu = false"
        class="flex items-center gap-2 px-3 py-2 rounded-lg font-label-md"
        :class="[
          route.name === link.name ? 'text-primary' : 'bg-surface-variant text-on-surface-variant',
        ]"
      >
        <span class="material-symbols-outlined text-[1.1rem]">{{ link.icon }}</span>
        {{ link.label }}
      </router-link>
    </div>
    <div
      v-if="store.currentCharacterData"
      class="border-t border-outline-variant/30 pt-4 mb-2"
    ></div>
    <button
      @click="
        store.handleNewCharacter();
        showMobileMenu = false;
      "
      class="w-full bg-surface-variant mb-2 py-2 rounded text-on-surface font-label-md"
    >
      New Character
    </button>
    <button
      @click="
        showImportModal = true;
        showMobileMenu = false;
      "
      class="w-full bg-surface-variant mb-2 py-2 rounded text-on-surface font-label-md"
    >
      Import
    </button>
  </div>

  <!-- Import Modal -->
  <ImportModal :show="showImportModal" @close="showImportModal = false" />
</template>
