<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCharacterStore } from '@/stores/character'
import feather from 'feather-icons'

const store = useCharacterStore()
const geminiPrompt = ref('')

const characterSelectOptions = computed(() => {
  return Object.entries(store.characterLibrary).map(([session, chars]) => ({
    label: session,
    options: chars.map((char) => ({
      text: char.name,
      value: `${session}|${char.name}`,
    })),
  }))
})

const selectedCharacter = computed({
  get: () =>
    store.currentCharacterData ? `${store.sessionName}|${store.currentCharacterData.name}` : '',
  set: (value) => store.loadCharacterFromLibrary(value),
})

function onFileChange(event) {
  store.handleFileLoad(event)
  // Reset file input
  event.target.value = null
}

function generate() {
  store.generateCharacter(geminiPrompt.value)
  geminiPrompt.value = ''
}
</script>

<template>
  <div
    class="control-panel w-full mx-auto p-6 mb-6 no-print bg-amber-50 rounded-lg shadow-md border border-amber-200"
  >
    <h1 class="font-fell text-4xl text-sheet-red text-center mb-6">Character Sheet Creator</h1>
    <div class="space-y-6">
      <div class="grid lg:grid-cols-2 gap-6 items-center">
        <div class="flex flex-wrap items-center gap-3">
          <button
            @click="store.handleNewCharacter()"
            title="New Character"
            class="icon-button flex-shrink-0"
            v-html="feather.icons['file-plus'].toSvg()"
          ></button>
          <label for="character-select" class="font-fell text-lg flex-shrink-0">Load:</label>
          <select id="character-select" class="flex-grow min-w-0" v-model="selectedCharacter">
            <option value="">Select a character...</option>
            <optgroup
              v-for="group in characterSelectOptions"
              :key="group.label"
              :label="group.label"
            >
              <option v-for="char in group.options" :key="char.value" :value="char.value">
                {{ char.text }}
              </option>
            </optgroup>
          </select>
          <label
            for="char-file-input"
            class="icon-button flex-shrink-0"
            title="Load character from file"
            v-html="feather.icons.folder.toSvg()"
          ></label>
          <input
            type="file"
            id="char-file-input"
            @change="onFileChange"
            accept=".json"
            class="hidden"
          />
        </div>
        <div class="flex items-center gap-3">
          <label for="session-name" class="font-fell text-lg flex-shrink-0">Session:</label>
          <input
            type="text"
            id="session-name"
            placeholder="E.g., Westmarches"
            class="flex-grow"
            v-model="store.sessionName"
          />
        </div>
      </div>
      <div class="border-t border-amber-300 pt-6" v-if="store.schema">
        <h2 class="font-fell text-2xl text-center text-purple-900 mb-4">
          ✨ AI Character Generator ✨
        </h2>
        <div class="flex flex-col sm:flex-row items-center gap-4">
          <input
            type="text"
            v-model="geminiPrompt"
            @keyup.enter="generate"
            class="flex-grow w-full sm:w-auto"
            placeholder="Describe a character, e.g., 'a grumpy dwarf cleric'"
          />
          <button @click="generate" class="gemini-button flex-shrink-0">Generate Character</button>
        </div>
      </div>
    </div>
  </div>
</template>
