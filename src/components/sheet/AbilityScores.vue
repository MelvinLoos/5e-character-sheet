<script setup>
import { computed, watch, ref } from 'vue'
import { useCharacterStore } from '@/stores/character'
import * as DND_RULES from '@/data/rules.js'
import { pointBuyCosts, formatMod } from '@/services/characterService.js'

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

// Computed properties for background bonus options
const plusTwoOptions = computed(() => {
  const background = store.currentCharacterData.background
  if (!background || !DND_RULES.BACKGROUNDS[background]) return []

  const allOptions = DND_RULES.BACKGROUNDS[background].abilityScoreIncrease || []
  const selectedPlusOne = store.currentCharacterData.backgroundBonusSelections?.plusOne

  // Filter out the option selected for +1 bonus
  return allOptions.filter((opt) => opt !== selectedPlusOne)
})

const plusOneOptions = computed(() => {
  const background = store.currentCharacterData.background
  if (!background || !DND_RULES.BACKGROUNDS[background]) return []

  const allOptions = DND_RULES.BACKGROUNDS[background].abilityScoreIncrease || []
  const selectedPlusTwo = store.currentCharacterData.backgroundBonusSelections?.plusTwo

  // Filter out the option selected for +2 bonus
  return allOptions.filter((opt) => opt !== selectedPlusTwo)
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

function renderPointBuyEditor() {
  // This will be handled in the template
  return true
}
</script>

<template>
  <section v-if="store.isEditing" class="grid grid-cols-1 gap-y-1">
    <div class="text-center mb-3 p-3 bg-white/30 rounded-lg border border-amber-300">
      <div class="font-fell text-lg mb-1">Points Remaining</div>
      <div
        class="text-3xl font-bold transition-all duration-300 ease-in-out"
        :class="[
          pointsAnimationClass,
          {
            'text-red-600 animate-pulse': store.pointBuyPointsRemaining < 0,
            'text-amber-600': store.pointBuyPointsRemaining === 0,
            'text-green-600 points-positive': store.pointBuyPointsRemaining > 0,
            'transform scale-110': store.pointBuyPointsRemaining !== 27,
          },
        ]"
      >
        {{ store.pointBuyPointsRemaining }}
      </div>
      <div class="text-xs text-gray-600 mt-1">
        <span v-if="store.pointBuyPointsRemaining > 0" class="text-green-700 font-medium">
          💡 You have unspent points
        </span>
        <span v-else-if="store.pointBuyPointsRemaining === 0" class="text-amber-700 font-medium">
          ✅ All points allocated perfectly
        </span>
        <span v-else class="text-red-700 font-medium">
          ⚠️ Over budget! You need {{ Math.abs(store.pointBuyPointsRemaining) }} more points
        </span>
      </div>
    </div>

    <div
      v-for="[key, baseScore] in Object.entries(store.currentCharacterData.pointBuyBaseScores)"
      :key="key"
      class="flex items-center justify-between p-2 md:p-1 border-b border-dotted border-amber-200"
    >
      <div class="w-1/4 font-fell text-sm">
        {{ DND_RULES.ABILITIES[key].substring(0, 3).toUpperCase() }}
      </div>

      <div class="flex items-center gap-3 md:gap-2">
        <button
          class="ability-score-btn ability-score-btn-decrease"
          @click="store.adjustPointBuyScore(key, -1)"
          :disabled="baseScore <= 8"
          aria-label="Decrease ability score"
        >
          −
        </button>
        <span class="font-bold w-8 text-center tabular-nums text-lg md:text-base">{{
          baseScore
        }}</span>
        <button
          class="ability-score-btn ability-score-btn-increase"
          @click="store.adjustPointBuyScore(key, 1)"
          :disabled="baseScore >= 15 || store.pointBuyPointsRemaining <= 0"
          aria-label="Increase ability score"
        >
          +
        </button>
      </div>

      <div class="text-xs w-10 text-right">Cost: {{ pointBuyCosts[baseScore] }}</div>

      <div class="stat-box p-1 w-16 ml-2">
        <div class="ability-score text-base">
          {{ store.currentCharacterData.abilityScores[key] }}
        </div>
        <div class="ability-modifier text-xs w-6 h-6">{{ formatMod(store.abilityMods[key]) }}</div>
      </div>
    </div>

    <!-- Background Bonus Selections -->
    <div
      v-if="
        DND_RULES.BACKGROUNDS[store.currentCharacterData.background] &&
        store.currentCharacterData.backgroundBonusSelections
      "
      class="mt-4 pt-2 border-t border-amber-300"
    >
      <div class="flex items-center justify-between mt-2">
        <label class="font-fell text-sm">+2 Bonus:</label>
        <select
          v-model="store.currentCharacterData.backgroundBonusSelections.plusTwo"
          class="edit-mode-select w-1/2"
        >
          <option value="">Select ability...</option>
          <option v-for="opt in plusTwoOptions" :key="opt" :value="opt">
            {{ DND_RULES.ABILITIES[opt] }}
          </option>
        </select>
      </div>
      <div class="flex items-center justify-between mt-2">
        <label class="font-fell text-sm">+1 Bonus:</label>
        <select
          v-model="store.currentCharacterData.backgroundBonusSelections.plusOne"
          class="edit-mode-select w-1/2"
        >
          <option value="">Select ability...</option>
          <option v-for="opt in plusOneOptions" :key="opt" :value="opt">
            {{ DND_RULES.ABILITIES[opt] }}
          </option>
        </select>
      </div>
    </div>
  </section>

  <section v-else class="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
    <div
      v-for="[key, value] in Object.entries(store.currentCharacterData.abilityScores)"
      :key="key"
      class="stat-box shadow-sm hover:shadow-md transition-shadow"
    >
      <label class="font-fell text-sm font-semibold text-sheet-red mb-1 block">{{
        key.toUpperCase()
      }}</label>
      <div class="ability-score mb-2">{{ value }}</div>
      <div class="ability-modifier">{{ formatMod(store.abilityMods[key]) }}</div>
    </div>
  </section>
</template>
