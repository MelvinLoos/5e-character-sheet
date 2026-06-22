<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useCharacterStore } from '@/stores/character'
import * as DND_RULES from '@/data/rules'

const store = useCharacterStore()
const showInfo = ref<Record<string, boolean>>({ class: false, species: false, background: false })

function toggleInfo(type: string) {
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

function handleClickOutside(event: Event) {
  const target = event.target as Element
  if (target && !target.closest('.info-button') && !target.closest('.absolute')) {
    closeAllInfo()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function getClassInfo(className: string) {
  const classData = DND_RULES.CLASSES[className]
  if (!classData) return 'No information available'

  let info = `Hit Die: d${classData.hitDice} (avg ${classData.hitDiceAverage})\n`

  if (classData.savingThrows && classData.savingThrows.length > 0) {
    info += `Saving Throw Proficiencies: ${classData.savingThrows.map((s: string) => DND_RULES.ABILITIES[s]).join(', ')}\n`
  }

  // Add key features
  if (classData.features && classData.features.length > 0) {
    const keyFeatures = classData.features.filter((f: { key?: boolean }) => f.key)
    if (keyFeatures.length > 0) {
      info += `\nKey Features:\n`
      keyFeatures.slice(0, 2).forEach((feature: { title?: string; desc?: string }) => {
        info += `• ${feature.title}: ${(feature.desc || '').substring(0, 100)}${(feature.desc || '').length > 100 ? '...' : ''}\n`
      })
    }
  }

  if (classData.description) {
    info += `\n${classData.description}`
  }

  return info
}

function getSpeciesInfo(speciesName: string) {
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
    speciesData.traits.slice(0, 3).forEach((trait: { title?: string; desc?: string }) => {
      info += `• ${trait.title}: ${(trait.desc || '').substring(0, 80)}${(trait.desc || '').length > 80 ? '...' : ''}\n`
    })
  }

  if (speciesData.description) {
    info += `\n${speciesData.description}`
  }

  return info
}

function getBackgroundInfo(backgroundName: string) {
  const bgData = DND_RULES.BACKGROUNDS[backgroundName]
  if (!bgData) return 'No information available'

  let info = ''

  if (bgData.skills && bgData.skills.length > 0) {
    info += `Skill Proficiencies: ${bgData.skills.join(', ')}\n`
  }

  // In D&D 2024, backgrounds provide ability score increases, not species
  if (bgData.abilityScoreIncrease && bgData.abilityScoreIncrease.length > 0) {
    info += `Ability Score Increase Options: ${bgData.abilityScoreIncrease.map((s: string) => DND_RULES.ABILITIES[s]).join(', ')}\n`
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

function decrementTier() {
  if (store.currentCharacterData) {
    store.currentCharacterData.renownTier = Math.max(1, (store.currentCharacterData.renownTier || 1) - 1)
  }
}

function incrementTier() {
  if (store.currentCharacterData) {
    store.currentCharacterData.renownTier = Math.min(4, (store.currentCharacterData.renownTier || 1) + 1)
  }
}
</script>

<template>
  <section
    class="bg-surface-container rounded-xl p-6 border border-primary-container shadow-sm relative overflow-hidden"
  >
    <!-- Decorative backdrop -->
    <div
      class="absolute right-0 top-0 w-1/3 h-full opacity-5 pointer-events-none"
      style="
        background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuAKR448jVj2qwVcIQlrT2ETRMPCxlUUegXoQDE3qgV3caQWplM_7YJo0MLFghV9GpK8WIxvMp8TgK0UVUrh_4TAs6uYjJ1OOo5Cc_5lWH6xOFdnyUWASJ4vKi1K3OgOPn9oIF_tIpNAJNRHPW6GvZIXoIc3Sx8HokddNXDrsNUrHWMeyjP12G7mO6BQ1rDqY8i-Knu7FVR7UrPFiCaXg5F8bMcJouK3ofhWEjC6zgNhOi9ayjAO6TkEqbrKgAfJuLCUhWkZoKRTrkS5');
        background-size: cover;
      "
    ></div>

    <div class="relative z-10 flex flex-col md:flex-row gap-6 md:items-end">
      <div class="flex-grow w-full md:w-auto">
        <input
          v-if="store.isEditing"
          v-model="store.currentCharacterData.name"
          class="w-full bg-transparent border-b-2 border-surface-variant focus:border-tertiary focus:ring-0 font-display-lg text-display-lg text-on-surface p-0 pb-2 placeholder-on-surface-variant/50 transition-colors"
          placeholder="Enter Name..."
          type="text"
        />
        <div
          v-else
          class="w-full border-b-2 border-transparent font-display-lg text-display-lg text-tertiary p-0 pb-2"
        >
          {{ store.currentCharacterData.name || 'Unnamed' }}
        </div>

        <input
          v-if="store.isEditing"
          v-model="store.currentCharacterData.title"
          class="w-full bg-transparent border-b border-surface-variant focus:border-tertiary focus:ring-0 font-body-md text-on-surface-variant italic p-0 pb-1 mt-2"
          placeholder="Character title or epithet"
        />
        <div v-else class="w-full font-body-md text-on-surface-variant italic p-0 pb-1 mt-2">
          {{ store.currentCharacterData.title }}
        </div>
      </div>

      <div class="flex flex-wrap md:flex-nowrap gap-4 w-full md:w-auto">
        <!-- Tier & Experience -->

        <div class="flex-1 min-w-[100px] hidden">
          <label class="block font-label-md text-label-md text-on-surface-variant mb-1">Tier</label>
          <div
            v-if="store.isEditing"
            class="flex items-center w-full bg-surface-container-high border border-outline-variant rounded focus-within:border-tertiary focus-within:ring-1 focus-within:ring-tertiary"
          >
            <button
              @click="decrementTier"
              class="px-2 py-2 text-on-surface hover:text-tertiary"
              type="button"
            >
              −
            </button>
            <input
              v-model.number="store.currentCharacterData.renownTier"
              type="number"
              min="1"
              max="20"
              class="w-full bg-transparent border-none text-center font-body-md text-on-surface p-2 focus:ring-0"
            />
            <button
              @click="incrementTier"
              class="px-2 py-2 text-on-surface hover:text-tertiary"
              type="button"
            >
              +
            </button>
          </div>
          <div
            v-else
            class="w-full bg-surface-container-high border border-outline-variant rounded p-2 text-on-surface font-body-md text-center"
          >
            {{ store.currentCharacterData.renownTier }}
          </div>
        </div>

        <!-- Species -->
        <div class="flex-1 min-w-[140px] relative">
          <label
            class="flex justify-between items-center font-label-md text-label-md text-on-surface-variant mb-1"
          >
            Species
            <button
              v-if="store.isEditing"
              @click="toggleInfo('species')"
              class="hover:text-tertiary transition-colors"
              type="button"
            >
              <span class="material-symbols-outlined text-[16px]">info</span>
            </button>
          </label>
          <select
            v-if="store.isEditing"
            v-model="store.currentCharacterData.species"
            class="w-full bg-surface-container-high border border-outline-variant rounded p-2 text-on-surface font-body-md focus:border-tertiary focus:ring-1 focus:ring-tertiary"
          >
            <option v-for="(speciesData, key) in DND_RULES.SPECIES" :key="key" :value="key">
              {{ key }}
            </option>
          </select>
          <div
            v-else
            class="w-full bg-surface-container-high border border-outline-variant rounded p-2 text-on-surface font-body-md"
          >
            {{ store.currentCharacterData.species }}
          </div>
          <div
            v-if="showInfo.species && store.currentCharacterData.species"
            class="absolute top-full right-0 mt-2 p-4 bg-surface-container-highest border border-outline rounded-lg shadow-lg z-20 w-72 text-sm text-on-surface"
          >
            <div class="font-bold text-tertiary mb-2">{{ store.currentCharacterData.species }}</div>
            <div class="whitespace-pre-line text-xs">
              {{ getSpeciesInfo(store.currentCharacterData.species) }}
            </div>
          </div>
        </div>

        <!-- Class -->
        <div class="flex-1 min-w-[140px] relative">
          <label
            class="flex justify-between items-center font-label-md text-label-md text-on-surface-variant mb-1"
          >
            Class
            <button
              v-if="store.isEditing"
              @click="toggleInfo('class')"
              class="hover:text-tertiary transition-colors"
              type="button"
            >
              <span class="material-symbols-outlined text-[16px]">info</span>
            </button>
          </label>
          <select
            v-if="store.isEditing"
            v-model="store.currentCharacterData.class"
            class="w-full bg-surface-container-high border border-outline-variant rounded p-2 text-on-surface font-body-md focus:border-tertiary focus:ring-1 focus:ring-tertiary"
          >
            <option v-for="(classData, key) in DND_RULES.CLASSES" :key="key" :value="key">
              {{ key }}
            </option>
          </select>
          <div
            v-else
            class="w-full bg-surface-container-high border border-outline-variant rounded p-2 text-on-surface font-body-md"
          >
            {{ store.currentCharacterData.class }}
          </div>
          <div
            v-if="showInfo.class && store.currentCharacterData.class"
            class="absolute top-full right-0 mt-2 p-4 bg-surface-container-highest border border-outline rounded-lg shadow-lg z-20 w-72 text-sm text-on-surface"
          >
            <div class="font-bold text-tertiary mb-2">{{ store.currentCharacterData.class }}</div>
            <div class="whitespace-pre-line text-xs">
              {{ getClassInfo(store.currentCharacterData.class) }}
            </div>
          </div>
        </div>

        <!-- Background -->
        <div class="flex-1 min-w-[140px] relative">
          <label
            class="flex justify-between items-center font-label-md text-label-md text-on-surface-variant mb-1"
          >
            Background
            <button
              v-if="store.isEditing"
              @click="toggleInfo('background')"
              class="hover:text-tertiary transition-colors"
              type="button"
            >
              <span class="material-symbols-outlined text-[16px]">info</span>
            </button>
          </label>
          <select
            v-if="store.isEditing"
            v-model="store.currentCharacterData.background"
            class="w-full bg-surface-container-high border border-outline-variant rounded p-2 text-on-surface font-body-md focus:border-tertiary focus:ring-1 focus:ring-tertiary"
          >
            <option v-for="(bgData, key) in DND_RULES.BACKGROUNDS" :key="key" :value="key">
              {{ key }}
            </option>
          </select>
          <div
            v-else
            class="w-full bg-surface-container-high border border-outline-variant rounded p-2 text-on-surface font-body-md"
          >
            {{ store.currentCharacterData.background }}
          </div>
          <div
            v-if="showInfo.background && store.currentCharacterData.background"
            class="absolute top-full right-0 mt-2 p-4 bg-surface-container-highest border border-outline rounded-lg shadow-lg z-20 w-72 text-sm text-on-surface"
          >
            <div class="font-bold text-tertiary mb-2">
              {{ store.currentCharacterData.background }}
            </div>
            <div class="whitespace-pre-line text-xs">
              {{ getBackgroundInfo(store.currentCharacterData.background) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
