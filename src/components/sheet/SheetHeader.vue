<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import * as DND_RULES from '@/data/rules'
import { useCharacterInfo } from '@/composables/useCharacterInfo'
import InfoButton from '@/components/ui/InfoButton.vue'
import decorativeBackdrop from '@/assets/decorative-backdrop.png'

const store = useCharacterStore()
const { speciesInfo, classInfo, backgroundInfo } = useCharacterInfo()

function decrementTier() {
  if (store.currentCharacterData) {
    store.currentCharacterData.renownTier = Math.max(
      1,
      (store.currentCharacterData.renownTier || 1) - 1,
    )
  }
}

function incrementTier() {
  if (store.currentCharacterData) {
    store.currentCharacterData.renownTier = Math.min(
      4,
      (store.currentCharacterData.renownTier || 1) + 1,
    )
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
      :style="{
        backgroundImage: `url(${decorativeBackdrop})`,
        backgroundSize: 'cover',
      }"
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
        <!-- Tier & Experience (hidden for now) -->
        <div class="flex-1 min-w-[100px] hidden">
          <label class="block font-label-md text-label-md text-on-surface-variant mb-1">Tier<InfoButton topic="great-work-progression" /></label>
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
        <div class="flex-1 min-w-[140px]">
          <label
            class="flex justify-between items-center font-label-md text-label-md text-on-surface-variant mb-1"
          >
            Species
            <InfoButton
              v-if="speciesInfo.content"
              :title="speciesInfo.title"
              :content="speciesInfo.content"
            />
          </label>
          <select
            v-if="store.isEditing"
            :value="store.currentCharacterData.species"
            @change="store.applySpeciesChange(($event.target as HTMLSelectElement).value)"
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
        </div>

        <!-- Class -->
        <div class="flex-1 min-w-[140px]">
          <label
            class="flex justify-between items-center font-label-md text-label-md text-on-surface-variant mb-1"
          >
            Class
            <InfoButton
              v-if="classInfo.content"
              :title="classInfo.title"
              :content="classInfo.content"
            />
          </label>
          <select
            v-if="store.isEditing"
            :value="store.currentCharacterData.class"
            @change="store.applyClassChange(($event.target as HTMLSelectElement).value)"
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
        </div>

        <!-- Background -->
        <div class="flex-1 min-w-[140px]">
          <label
            class="flex justify-between items-center font-label-md text-label-md text-on-surface-variant mb-1"
          >
            Background
            <InfoButton
              v-if="backgroundInfo.content"
              :title="backgroundInfo.title"
              :content="backgroundInfo.content"
            />
          </label>
          <select
            v-if="store.isEditing"
            :value="store.currentCharacterData.background"
            @change="store.applyBackgroundChange(($event.target as HTMLSelectElement).value)"
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
        </div>
      </div>
    </div>
  </section>
</template>