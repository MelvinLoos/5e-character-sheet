<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useCharacterStore } from '@/stores/character'
import * as DND_RULES from '@/data/rules'
import { formatMod } from '@/services/characterService'

const store = useCharacterStore()

// Animation state for points counter
const pointsAnimationClass = ref('')

// Watch for point changes and trigger animation
watch(
  () => store.pointBuyPointsRemaining,
  (newPoints, oldPoints) => {
    if (oldPoints !== undefined && newPoints !== oldPoints) {
      pointsAnimationClass.value = 'points-highlight'
      setTimeout(() => {
        pointsAnimationClass.value = ''
      }, 400)
    }
  },
)

// Computed helper for current background (string or empty)
const currentBackground = computed(() => store.currentCharacterData.background || '')

// Computed properties for background bonus options
const plusTwoOptions = computed(() => {
  const bg = currentBackground.value
  if (!bg || !DND_RULES.BACKGROUNDS[bg]) return []

  const allOptions = DND_RULES.BACKGROUNDS[bg].abilityScoreIncrease || []
  const selectedPlusOne = store.currentCharacterData.backgroundBonusSelections?.plusOne

  // Filter out the option selected for +1 bonus
  return allOptions.filter((opt: string) => opt !== selectedPlusOne)
})

const plusOneOptions = computed(() => {
  const bg = currentBackground.value
  if (!bg || !DND_RULES.BACKGROUNDS[bg]) return []

  const allOptions = DND_RULES.BACKGROUNDS[bg].abilityScoreIncrease || []
  const selectedPlusTwo = store.currentCharacterData.backgroundBonusSelections?.plusTwo

  // Filter out the option selected for +2 bonus
  return allOptions.filter((opt: string) => opt !== selectedPlusTwo)
})

// Watch for conflicts and resolve them automatically
watch(
  () => store.currentCharacterData.backgroundBonusSelections?.plusTwo,
  (newPlusTwo) => {
    if (
      newPlusTwo &&
      newPlusTwo === store.currentCharacterData.backgroundBonusSelections?.plusOne
    ) {
      // If +2 conflicts with +1, clear +1 selection
      if (store.currentCharacterData.backgroundBonusSelections) {
        store.currentCharacterData.backgroundBonusSelections.plusOne = ''
      }
    }
  },
)

watch(
  () => store.currentCharacterData.backgroundBonusSelections?.plusOne,
  (newPlusOne) => {
    if (
      newPlusOne &&
      newPlusOne === store.currentCharacterData.backgroundBonusSelections?.plusTwo
    ) {
      // If +1 conflicts with +2, clear +2 selection
      if (store.currentCharacterData.backgroundBonusSelections) {
        store.currentCharacterData.backgroundBonusSelections.plusTwo = ''
      }
    }
  },
)
</script>

<template>
  <section class="flex flex-col gap-6">
    <div class="flex justify-between items-end border-b border-primary-container pb-2">
      <h3 class="font-headline-md text-headline-md text-primary">Ability Scores</h3>
      <span
        v-if="store.isEditing"
        class="font-label-md text-label-md text-tertiary bg-tertiary/10 px-3 py-1 rounded-full border border-tertiary/30"
        :class="{
          'text-error border-error/30 bg-error/10': store.pointBuyPointsRemaining < 0,
          'text-primary border-primary/30 bg-primary/10': store.pointBuyPointsRemaining === 0,
        }"
      >
        Point Buy: {{ 27 - store.pointBuyPointsRemaining }}/27
      </span>
    </div>

    <!-- Background Bonus Selections -->
    <div
      v-if="
        store.isEditing &&
        DND_RULES.BACKGROUNDS[currentBackground] &&
        store.currentCharacterData.backgroundBonusSelections
      "
      class="bg-surface-container rounded-lg p-4 border border-outline-variant flex flex-col gap-4"
    >
      <div class="text-sm font-label-md text-on-surface-variant">Background Bonuses</div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block font-label-sm text-label-sm text-tertiary mb-1">+2 Bonus</label>
          <select
            v-model="store.currentCharacterData.backgroundBonusSelections.plusTwo"
            class="w-full bg-background border border-outline-variant rounded p-2 text-on-surface font-body-md text-sm focus:border-tertiary focus:ring-1 focus:ring-tertiary"
          >
            <option value="">Select ability...</option>
            <option v-for="opt in plusTwoOptions" :key="opt" :value="opt">
              {{ DND_RULES.ABILITIES[opt] }}
            </option>
          </select>
        </div>
        <div>
          <label class="block font-label-sm text-label-sm text-tertiary mb-1">+1 Bonus</label>
          <select
            v-model="store.currentCharacterData.backgroundBonusSelections.plusOne"
            class="w-full bg-background border border-outline-variant rounded p-2 text-on-surface font-body-md text-sm focus:border-tertiary focus:ring-1 focus:ring-tertiary"
          >
            <option value="">Select ability...</option>
            <option v-for="opt in plusOneOptions" :key="opt" :value="opt">
              {{ DND_RULES.ABILITIES[opt] }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 gap-6">
      <div
        v-for="[key, value] in Object.entries(store.currentCharacterData?.abilityScores || {})"
        :key="key"
        class="stat-orb-gradient rounded-full p-2 border border-primary-container shadow-lg flex flex-col items-center relative aspect-[3/4] justify-center group hover:border-tertiary/50 transition-colors"
        :class="{ 'opacity-70': (store.abilityMods[key] ?? 0) < 0 }"
      >
        <div
          class="absolute inset-2 rounded-full border border-tertiary pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"
          :class="{ 'opacity-20': (store.abilityMods[key] ?? 0) < 0 }"
        ></div>
        <span
          class="font-label-md text-label-md text-tertiary font-bold tracking-widest mt-4"
          :class="{ 'text-on-surface-variant': (store.abilityMods[key] ?? 0) < 0 }"
          >{{ key.toUpperCase() }}</span
        >
        <div
          class="font-display-lg text-[56px] leading-none text-on-surface font-bold my-2"
          :class="{ 'text-on-surface-variant': (store.abilityMods[key] ?? 0) < 0 }"
        >
          {{ formatMod(store.abilityMods[key] ?? 0) }}
        </div>

        <div
          v-if="store.isEditing"
          class="flex items-center gap-2 bg-background/50 rounded-full px-2 py-1 mb-4 border border-outline-variant z-10 backdrop-blur-sm"
        >
          <button
            @click="store.adjustPointBuyScore(key, -1)"
            :disabled="(store.currentCharacterData?.pointBuyBaseScores?.[key] ?? 8) <= 8"
            class="text-outline hover:text-white transition-colors w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-variant disabled:opacity-50"
          >
            <span class="material-symbols-outlined text-sm">remove</span>
          </button>
          <span
            class="font-body-md text-body-md font-bold text-on-surface min-w-[2ch] text-center"
            :class="{ 'text-on-surface-variant': (store.abilityMods[key] ?? 0) < 0 }"
            >{{ store.currentCharacterData?.pointBuyBaseScores?.[key] ?? 8 }}</span
          >
          <button
            @click="store.adjustPointBuyScore(key, 1)"
            :disabled="
              (store.currentCharacterData?.pointBuyBaseScores?.[key] ?? 15) >= 15 ||
              store.pointBuyPointsRemaining <= 0
            "
            class="text-outline hover:text-white transition-colors w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-variant disabled:opacity-50"
          >
            <span class="material-symbols-outlined text-sm">add</span>
          </button>
        </div>
        <div
          v-else
          class="font-body-lg text-body-lg text-on-surface-variant mb-4 font-bold border border-outline-variant/30 rounded-full px-4 py-1 bg-background/30 backdrop-blur-sm"
        >
          {{ value }}
        </div>
      </div>
    </div>
  </section>
</template>
