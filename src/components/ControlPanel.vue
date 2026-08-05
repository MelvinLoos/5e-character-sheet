<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCharacterStore } from '@/stores/character'

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

  // Use setTimeout to ensure DOM is updated before printing
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

    </ul>

    <div
      class="px-6 mt-auto pb-6 pt-4 border-t border-outline-variant/30 flex flex-col gap-2 print:hidden"
    >
      <!-- Edit/View Mode -->
      <button
        @click="store.toggleEdit()"
        class="edit-toggle-btn w-full"
        :class="store.isEditing ? 'edit-toggle-btn--active' : 'edit-toggle-btn--inactive'"
        :title="store.isEditing ? 'Exit Edit Mode' : 'Enter Edit Mode'"
        :aria-label="store.isEditing ? 'Exit Edit Mode' : 'Enter Edit Mode'"
      >
        <span class="material-symbols-outlined">{{ store.isEditing ? 'edit' : 'visibility' }}</span>
        {{ store.isEditing ? 'Editing…' : 'Edit Mode' }}
      </button>

      <!-- Import -->
      <button
        @click="emit('showImport')"
        class="w-full bg-surface-variant hover:bg-surface-bright text-on-surface font-label-md text-label-md py-3 rounded transition-colors flex items-center justify-center gap-2"
        title="Import JSON"
      >
        <span class="material-symbols-outlined">file_upload</span>
        Import Data
      </button>

      <!-- Save -->
      <button
        @click="store.saveToLibrary()"
        class="w-full bg-surface-variant hover:bg-surface-bright text-on-surface font-label-md text-label-md py-3 rounded transition-colors flex items-center justify-center gap-2"
        :title="store.sourceCharacterId ? 'Save a Local Copy' : 'Save to Browser Library'"
      >
        <span class="material-symbols-outlined">{{
          store.sourceCharacterId ? 'content_copy' : 'save'
        }}</span>
        {{ store.sourceCharacterId ? 'Save Local Copy' : 'Save to Library' }}
      </button>

      <!-- Share -->
      <button
        @click="store.shareCharacter()"
        :disabled="!store.supabaseClient"
        class="w-full bg-surface-variant hover:bg-surface-bright text-on-surface font-label-md text-label-md py-3 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Share Online"
      >
        <span class="material-symbols-outlined">share</span>
        Share Online
      </button>

      <!-- Export -->
      <button
        @click="store.exportCharacter()"
        class="w-full bg-surface-variant hover:bg-surface-bright text-on-surface font-label-md text-label-md py-3 rounded transition-colors flex items-center justify-center gap-2"
        title="Export JSON"
      >
        <span class="material-symbols-outlined">download</span>
        Export JSON
      </button>

      <!-- Print -->
      <button
        @click="handlePrint"
        class="w-full bg-tertiary text-on-tertiary font-label-md text-label-md py-3 rounded hover:bg-tertiary-fixed transition-colors flex items-center justify-center gap-2"
        title="Print Sheet"
      >
        <span class="material-symbols-outlined">print</span>
        Print Sheet
      </button>
    </div>
  </nav>

</template>
