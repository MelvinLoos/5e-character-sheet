<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useCharacterStore } from '@/stores/character'
import { useProgressionStore } from '@/stores/progression'
import * as DND_RULES from '@/data/rules'
import { formatMod } from '@/domain'
import { useCharacterCompletion } from '@/composables/useCharacterCompletion'

const store = useCharacterStore()
const progression = useProgressionStore()
const { badges } = useCharacterCompletion()

// Animation state for points counter
const pointsAnimationClass = ref('')

// Watch for point changes and trigger animation
watch(
  () => progression.pointBuyPointsRemaining,
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

// Watch for conflicts and resolve them automatically, then recalculate
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
    progression.recalculateAbilityScores()
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
    progression.recalculateAbilityScores()
  },
)
</script>

<template>
  <section class="flex flex-col gap-6">
    <div
      class="flex justify-between items-end border-b pb-2"
      :class="badges.identity ? 'border-red-600/50' : 'border-primary-container'"
    >
      <h3 class="font-headline-md text-headline-md text-primary select-none">
        Ability Scores<InfoButton topic="point-buy" />
      </h3>
      <span
        v-if="badges.identity"
        class="font-label-md text-label-md text-red-600 bg-red-600/10 px-3 py-1 rounded-full border border-red-600/30 select-none animate-pulse"
      >
        {{ badges.identity.label }}
      </span>
      <span
        v-else-if="store.isEditing"
        class="font-label-md text-label-md text-tertiary bg-tertiary/10 px-3 py-1 rounded-full border border-tertiary/30 select-none"
        :class="{
          'text-error border-error/30 bg-error/10': progression.pointBuyPointsRemaining < 0,
          'text-primary border-primary/30 bg-primary/10': progression.pointBuyPointsRemaining === 0,
        }"
      >
        Point Buy: {{ 27 - progression.pointBuyPointsRemaining }}/27
      </span>
    </div>

    <!-- Background Bonus Selections -->
    <div
      v-if="
        store.isEditing &&
        DND_RULES.BACKGROUNDS[currentBackground] &&
        store.currentCharacterData.backgroundBonusSelections
      "
      class="bg-surface-container rounded-lg p-4 border border-outline-variant flex flex-col gap-4 shadow-elevation-1"
    >
      <div class="text-sm font-label-md text-on-surface-variant select-none">Background Bonuses</div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block font-label-sm text-label-sm text-tertiary mb-1 select-none">+2 Bonus</label>
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
          <label class="block font-label-sm text-label-sm text-tertiary mb-1 select-none">+1 Bonus</label>
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

    <div class="grid grid-cols-2 sm:grid-cols-6 gap-4 sm:gap-16">
      <div
        v-for="[key, value] in Object.entries(store.currentCharacterData?.abilityScores || {})"
        :key="key"
        class="stat-orb-gradient rounded-full p-2 border border-primary-container flex flex-col items-center relative aspect-[1] justify-center group hover:border-tertiary/50 transition-colors shadow-[0_8px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]"
        :class="{ 'opacity-70': (progression.abilityMods[key] ?? 0) < 0 }"
      >
        <div
          class="absolute inset-2 rounded-full border border-tertiary pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity"
          :class="{ 'opacity-20': (progression.abilityMods[key] ?? 0) < 0 }"
        ></div>
        <span
          class="font-label-md text-label-md text-tertiary font-bold tracking-widest mt-4 select-none"
          :class="{ 'text-on-surface-variant': (progression.abilityMods[key] ?? 0) < 0 }"
          >{{ key.toUpperCase() }}</span
        >
        <div
          class="font-display-lg text-[44px] leading-none text-on-surface font-bold my-1 select-none"
          :class="{ 'text-on-surface-variant': (progression.abilityMods[key] ?? 0) < 0 }"
        >
          {{ formatMod(progression.abilityMods[key] ?? 0) }}
        </div>

        <div
          v-if="store.isEditing"
          class="flex items-center gap-2 bg-background/50 rounded-full px-2 py-1 mb-4 border border-outline-variant z-10 backdrop-blur-sm"
        >
          <button
            @click="progression.adjustPointBuyScore(key, -1)"
            :disabled="(store.currentCharacterData?.pointBuyBaseScores?.[key] ?? 8) <= 8"
            class="text-on-surface-variant hover:text-on-surface hover:-translate-y-0.5 hover:shadow-sm hover:bg-surface-variant active:translate-y-0 active:scale-90 transition-all duration-200 ease-out w-6 h-6 flex items-center justify-center rounded-full disabled:opacity-50 disabled:scale-100 disabled:shadow-none select-none"
          >
            <span class="material-symbols-outlined text-sm">remove</span>
          </button>
          <span
            class="font-body-md text-body-md font-bold text-on-surface min-w-[2ch] text-center"
            :class="{ 'text-on-surface-variant': (progression.abilityMods[key] ?? 0) < 0 }"
            >{{ value }}</span
          >
          <button
            @click="progression.adjustPointBuyScore(key, 1)"
            :disabled="
              (store.currentCharacterData?.pointBuyBaseScores?.[key] ?? 15) >= 15 ||
              progression.pointBuyPointsRemaining <= 0
            "
            class="text-on-surface-variant hover:text-on-surface hover:-translate-y-0.5 hover:shadow-sm hover:bg-surface-variant active:translate-y-0 active:scale-90 transition-all duration-200 ease-out w-6 h-6 flex items-center justify-center rounded-full disabled:opacity-50 disabled:scale-100 disabled:shadow-none select-none"
          >
            <span class="material-symbols-outlined text-sm">add</span>
          </button>
        </div>
        <div
          v-else
          class="font-body-lg text-body-lg text-on-surface-variant mb-4 font-bold border border-outline-variant/30 rounded-full px-4 py-1 bg-background/30 backdrop-blur-sm select-none"
        >
          {{ value }}
        </div>
      </div>
    </div>
  </section>
</template>
