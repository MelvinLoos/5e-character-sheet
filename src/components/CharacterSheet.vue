<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useCharacterStore } from '@/stores/character'
import SheetControls from './SheetControls.vue'
import SheetHeader from './sheet/SheetHeader.vue'
import AbilityScores from './sheet/AbilityScores.vue'
import SkillsList from './sheet/SkillsList.vue'
import CombatStats from './sheet/CombatStats.vue'
import SavingThrows from './sheet/SavingThrows.vue'
import AttacksList from './sheet/AttacksList.vue'
// Lazy-load larger/ui-heavy components so initial bundle is smaller
const FeaturesList = defineAsyncComponent(() => import('./sheet/FeaturesList.vue'))
import PersonalityBlock from './sheet/PersonalityBlock.vue'
import EquipmentBlock from './sheet/EquipmentBlock.vue'
const SpellcastingBlock = defineAsyncComponent(() => import('./sheet/SpellcastingBlock.vue'))
import DeathSaves from './sheet/DeathSaves.vue'

const store = useCharacterStore()
</script>

<template>
  <div class="sheet-wrapper w-full max-w-none">
    <!-- Front Page -->
    <div class="sheet-container p-6 mb-6 flex flex-col page-break">
      <SheetControls />
      <SheetHeader />
      <main class="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow mt-6">
        <!-- Left Column - Ability Scores & Skills -->
        <div class="space-y-6 flex flex-col">
          <AbilityScores />
          <div class="text-center py-2 bg-white/20">
            <span class="font-bold text-xl block">{{ store.profBonus >= 0 ? '+' : '' }}{{ store.profBonus }}</span>
            <label class="font-fell text-sm text-sheet-red">Proficiency Bonus</label>
          </div>
          <SkillsList />
        </div>

        <!-- Middle Column - Combat Stats -->
        <div class="space-y-6 flex flex-col">
          <CombatStats />
          <DeathSaves />
          <SavingThrows />
          <AttacksList />
        </div>

        <!-- Right Column - Key Features -->
        <div class="space-y-6">
          <FeaturesList :features="store.keyFeatures" title="Key Features" />
        </div>
      </main>
    </div>

    <!-- Back Page -->
    <div class="sheet-container p-6 flex flex-col">
      <header class="flex justify-between items-baseline border-b-2 border-black pb-3 mb-6">
        <h1 class="text-4xl font-fell">{{ store.currentCharacterData.name }}</h1>
        <p class="text-lg italic">Character Details</p>
      </header>
      <main class="flex-grow grid lg:grid-cols-2 gap-8">
        <div class="space-y-6">
          <PersonalityBlock />
          <EquipmentBlock />
          <FeaturesList :features="store.otherFeatures" title="Features & Traits" />
          <SpellcastingBlock />
        </div>
        <div class="space-y-6 print-hidden">
          <!-- This column is hidden in print mode - CSS columns handle layout -->
        </div>
      </main>
    </div>
  </div>
</template>
