<script setup>
import { computed, watch } from 'vue'
import { useCharacterStore } from '@/stores/character'
import * as DND_RULES from '@/data/rules.js'
import { pointBuyCosts, formatMod } from '@/services/characterService.js'

const store = useCharacterStore()

// Computed properties for background bonus options
const plusTwoOptions = computed(() => {
  const background = store.currentCharacterData.background
  if (!background || !DND_RULES.BACKGROUNDS[background]) return []

  const allOptions = DND_RULES.BACKGROUNDS[background].abilityScoreIncrease || []
  const selectedPlusOne = store.currentCharacterData.backgroundBonusSelections.plusOne

  // Filter out the option selected for +1 bonus
  return allOptions.filter((opt) => opt !== selectedPlusOne)
})

const plusOneOptions = computed(() => {
  const background = store.currentCharacterData.background
  if (!background || !DND_RULES.BACKGROUNDS[background]) return []

  const allOptions = DND_RULES.BACKGROUNDS[background].abilityScoreIncrease || []
  const selectedPlusTwo = store.currentCharacterData.backgroundBonusSelections.plusTwo

  // Filter out the option selected for +2 bonus
  return allOptions.filter((opt) => opt !== selectedPlusTwo)
})

// Watch for conflicts and resolve them automatically
watch(
  () => store.currentCharacterData.backgroundBonusSelections.plusTwo,
  (newPlusTwo) => {
    if (newPlusTwo && newPlusTwo === store.currentCharacterData.backgroundBonusSelections.plusOne) {
      // If +2 conflicts with +1, clear +1 selection
      store.currentCharacterData.backgroundBonusSelections.plusOne = ''
    }
  },
)

watch(
  () => store.currentCharacterData.backgroundBonusSelections.plusOne,
  (newPlusOne) => {
    if (newPlusOne && newPlusOne === store.currentCharacterData.backgroundBonusSelections.plusTwo) {
      // If +1 conflicts with +2, clear +2 selection
      store.currentCharacterData.backgroundBonusSelections.plusTwo = ''
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
    <div class="text-center mb-2">
      <span class="font-fell">Points Remaining:</span>
      <span class="font-bold ml-2" :class="{ 'text-red-600': store.pointBuyPointsRemaining < 0 }">
        {{ store.pointBuyPointsRemaining }}
      </span>
    </div>

    <div
      v-for="[key, baseScore] in Object.entries(store.currentCharacterData.pointBuyBaseScores)"
      :key="key"
      class="flex items-center justify-between p-1 border-b border-dotted border-amber-200"
    >
      <div class="w-1/4 font-fell text-sm">
        {{ DND_RULES.ABILITIES[key].substring(0, 3).toUpperCase() }}
      </div>

      <div class="flex items-center gap-2">
        <button
          class="icon-button text-xs h-6 w-6"
          @click="store.adjustPointBuyScore(key, -1)"
          :disabled="baseScore <= 8"
        >
          -
        </button>
        <span class="font-bold w-6 text-center">{{ baseScore }}</span>
        <button
          class="icon-button text-xs h-6 w-6"
          @click="store.adjustPointBuyScore(key, 1)"
          :disabled="baseScore >= 15 || store.pointBuyPointsRemaining <= 0"
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
      v-if="DND_RULES.BACKGROUNDS[store.currentCharacterData.background]"
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
