<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useCharacterStore } from '@/stores/character'
import * as DND_RULES from '@/data/rules.js'
import feather from 'feather-icons'

const store = useCharacterStore()
const showInfo = ref({ class: false, species: false, background: false })

function toggleInfo(type) {
  showInfo.value[type] = !showInfo.value[type]
  // Close other info panels
  Object.keys(showInfo.value).forEach((key) => {
    if (key !== type) showInfo.value[key] = false
  })
}

function closeAllInfo() {
  Object.keys(showInfo.value).forEach((key) => {
    showInfo.value[key] = false
  })
}

function handleClickOutside(event) {
  if (!event.target.closest('.info-button') && !event.target.closest('.absolute')) {
    closeAllInfo()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function getClassInfo(className) {
  const classData = DND_RULES.CLASSES[className]
  if (!classData) return 'No information available'

  let info = `Hit Die: d${classData.hitDice} (avg ${classData.hitDiceAverage})\n`

  if (classData.savingThrows && classData.savingThrows.length > 0) {
    info += `Saving Throw Proficiencies: ${classData.savingThrows.map((s) => DND_RULES.ABILITIES[s]).join(', ')}\n`
  }

  // Add key features
  if (classData.features && classData.features.length > 0) {
    const keyFeatures = classData.features.filter((f) => f.key)
    if (keyFeatures.length > 0) {
      info += `\nKey Features:\n`
      keyFeatures.slice(0, 2).forEach((feature) => {
        info += `• ${feature.title}: ${feature.desc.substring(0, 100)}${feature.desc.length > 100 ? '...' : ''}\n`
      })
    }
  }

  if (classData.description) {
    info += `\n${classData.description}`
  }

  return info
}

function getSpeciesInfo(speciesName) {
  const speciesData = DND_RULES.SPECIES[speciesName]
  if (!speciesData) return 'No information available'

  let info = ''

  if (speciesData.speed) {
    info += `Speed: ${speciesData.speed}\n`
  }

  // Note: In D&D 2024, species don't have ability score increases - backgrounds do
  info += `Size: Medium (default for most species)\n`

  // Add traits information
  if (speciesData.traits && speciesData.traits.length > 0) {
    info += `\nSpecies Traits:\n`
    speciesData.traits.slice(0, 3).forEach((trait) => {
      info += `• ${trait.title}: ${trait.desc.substring(0, 80)}${trait.desc.length > 80 ? '...' : ''}\n`
    })
  }

  if (speciesData.description) {
    info += `\n${speciesData.description}`
  }

  return info
}

function getBackgroundInfo(backgroundName) {
  const bgData = DND_RULES.BACKGROUNDS[backgroundName]
  if (!bgData) return 'No information available'

  let info = ''

  if (bgData.skills && bgData.skills.length > 0) {
    info += `Skill Proficiencies: ${bgData.skills.join(', ')}\n`
  }

  // In D&D 2024, backgrounds provide ability score increases, not species
  if (bgData.abilityScoreIncrease && bgData.abilityScoreIncrease.length > 0) {
    info += `Ability Score Increase Options: ${bgData.abilityScoreIncrease.map((s) => DND_RULES.ABILITIES[s]).join(', ')}\n`
    info += `(Choose +2 to one, +1 to another)\n`
  }

  if (bgData.feature) {
    info += `\nBackground Feature:\n• ${bgData.feature.title}: ${bgData.feature.desc.substring(0, 100)}${bgData.feature.desc.length > 100 ? '...' : ''}\n`
  }

  if (bgData.description) {
    info += `\n${bgData.description}`
  }

  return info
}

function createSelectHTML(id, options, selectedValue, infoType) {
  // This will be handled in template with v-model
  return { id, options, selectedValue, infoType }
}
</script>

<template>
  <header class="grid grid-cols-2 gap-4 border-b-2 border-black pb-2 mb-3">
    <div class="header-main">
      <input
        v-if="store.isEditing"
        v-model="store.currentCharacterData.name"
        class="edit-mode-input text-5xl font-fell text-red-800 w-full"
      />
      <h1 v-else class="text-5xl font-fell text-red-800">{{ store.currentCharacterData.name }}</h1>

      <input
        v-if="store.isEditing"
        v-model="store.currentCharacterData.title"
        class="edit-mode-input text-lg italic text-gray-700 w-full mt-1"
        placeholder="Character title or epithet"
      />
      <p v-else class="text-lg text-gray-700 italic">{{ store.currentCharacterData.title }}</p>
    </div>

    <div class="text-right text-sm mt-2 lg:mt-0 grid grid-cols-2 gap-x-4 gap-y-1">
      <div class="flex justify-end items-center relative">
        <strong class="mr-2">Class:</strong>
        <div v-if="store.isEditing" class="flex items-center relative">
          <select v-model="store.currentCharacterData.class" class="edit-mode-select">
            <option v-for="(classData, key) in DND_RULES.CLASSES" :key="key" :value="key">
              {{ key }}
            </option>
          </select>
          <button
            @click="toggleInfo('class')"
            class="info-button ml-1"
            title="Class info"
            type="button"
          >
            <span v-html="feather.icons['help-circle'].toSvg({ width: 16, height: 16 })"></span>
          </button>
          <!-- Info popover -->
          <div
            v-if="showInfo.class && store.currentCharacterData.class"
            class="absolute top-full right-0 mt-2 p-3 bg-white border-2 border-sheet-border rounded-lg shadow-lg z-20 w-64 text-sm"
          >
            <div class="font-bold mb-2">{{ store.currentCharacterData.class }}</div>
            <div class="whitespace-pre-line text-xs">
              {{ getClassInfo(store.currentCharacterData.class) }}
            </div>
          </div>
        </div>
        <span v-else>{{ store.currentCharacterData.class }}</span>
      </div>

      <div class="flex justify-end items-center">
        <strong class="mr-2">Level:</strong>
        <input
          v-if="store.isEditing"
          v-model.number="store.currentCharacterData.level"
          type="number"
          min="1"
          max="20"
          class="edit-stat"
        />
        <span v-else>{{ store.currentCharacterData.level }}</span>
      </div>

      <div class="flex justify-end items-center relative">
        <strong class="mr-2">Species:</strong>
        <div v-if="store.isEditing" class="flex items-center relative">
          <select v-model="store.currentCharacterData.species" class="edit-mode-select">
            <option v-for="(speciesData, key) in DND_RULES.SPECIES" :key="key" :value="key">
              {{ key }}
            </option>
          </select>
          <button
            @click="toggleInfo('species')"
            class="info-button ml-1"
            title="Species info"
            type="button"
          >
            <span v-html="feather.icons['help-circle'].toSvg({ width: 16, height: 16 })"></span>
          </button>
          <!-- Info popover -->
          <div
            v-if="showInfo.species && store.currentCharacterData.species"
            class="absolute top-full right-0 mt-2 p-3 bg-white border-2 border-sheet-border rounded-lg shadow-lg z-20 w-64 text-sm"
          >
            <div class="font-bold mb-2">{{ store.currentCharacterData.species }}</div>
            <div class="whitespace-pre-line text-xs">
              {{ getSpeciesInfo(store.currentCharacterData.species) }}
            </div>
          </div>
        </div>
        <span v-else>{{ store.currentCharacterData.species }}</span>
      </div>

      <div class="flex justify-end items-center relative">
        <strong class="mr-2">Background:</strong>
        <div v-if="store.isEditing" class="flex items-center relative">
          <select v-model="store.currentCharacterData.background" class="edit-mode-select">
            <option v-for="(bgData, key) in DND_RULES.BACKGROUNDS" :key="key" :value="key">
              {{ key }}
            </option>
          </select>
          <button
            @click="toggleInfo('background')"
            class="info-button ml-1"
            title="Background info"
            type="button"
          >
            <span v-html="feather.icons['help-circle'].toSvg({ width: 16, height: 16 })"></span>
          </button>
          <!-- Info popover -->
          <div
            v-if="showInfo.background && store.currentCharacterData.background"
            class="absolute top-full right-0 mt-2 p-3 bg-white border-2 border-sheet-border rounded-lg shadow-lg z-20 w-64 text-sm"
          >
            <div class="font-bold mb-2">{{ store.currentCharacterData.background }}</div>
            <div class="whitespace-pre-line text-xs">
              {{ getBackgroundInfo(store.currentCharacterData.background) }}
            </div>
          </div>
        </div>
        <span v-else>{{ store.currentCharacterData.background }}</span>
      </div>
    </div>
  </header>
</template>
