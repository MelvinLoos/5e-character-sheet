<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import * as DND_RULES from '@/data/rules.js'

const store = useCharacterStore()
</script>

<template>
  <section class="space-y-6">
    <!-- Combat Stats Row -->
    <div class="grid grid-cols-3 gap-4 text-center">
      <div class="stat-box shadow-sm">
        <input v-if="store.isEditing" v-model.number="store.currentCharacterData.combat.ac" type="number"
          class="ability-score edit-stat w-full text-center" />
        <div v-else class="ability-score">{{ store.currentCharacterData.combat.ac }}</div>
        <div class="font-fell text-xs font-semibold text-sheet-red mt-1">ARMOR CLASS</div>
      </div>

      <div class="stat-box shadow-sm">
        <div class="ability-score">
          {{ store.abilityMods.dex >= 0 ? '+' : '' }}{{ store.abilityMods.dex }}
        </div>
        <div class="font-fell text-xs font-semibold text-sheet-red mt-1">INITIATIVE</div>
      </div>

      <div class="stat-box shadow-sm">
        <input v-if="store.isEditing" v-model="store.currentCharacterData.combat.speed"
          class="ability-score edit-stat w-full text-center" />
        <div v-else class="ability-score" v-html="store.currentCharacterData.combat.speed.replace(
          'ft',
          '<span class=\'text-base\'>ft</span>',
        )
          "></div>
        <div class="font-fell text-xs font-semibold text-sheet-red mt-1">SPEED</div>
      </div>
    </div>

    <!-- Hit Points Section -->
    <div class="bordered-section text-center">
      <label class="font-fell text-xl text-sheet-red mb-3 block">Hit Points</label>
      <pre>TEST</pre>
      <div class="text-4xl font-bold tracking-wider mb-4 text-sheet-text flex items-center justify-center gap-2">
        <input v-model.number="store.currentCharacterData.combat.hp_current" type="number"
          class="w-24 text-center bg-transparent hover:bg-sheet-accent/20 border-b border-sheet-accent/50 focus:border-sheet-red focus:outline-none no-print cursor-text"
          placeholder="Current" />
        <div class="hidden print:block w-24 h-8 border-b border-black"></div>
        <span>/</span>
        <span>{{ store.maxHp }}</span>
      </div>

      <div class="pt-3 border-t border-sheet-accent/30">
        <label class="font-fell text-lg text-sheet-red">Hit Dice</label>
        <div class="text-xl font-bold mt-1">
          {{ store.currentCharacterData.level }}d{{
            store.currentCharacterData.class
              ? DND_RULES.CLASSES[store.currentCharacterData.class]?.hitDice || 8
              : 8
          }}
        </div>
      </div>
    </div>
  </section>
</template>
