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
  <div class="w-full flex flex-col gap-8">
    <SheetControls class="print:hidden" />
    <SheetHeader />
    
    <!-- Primary Layout Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-card-gap items-start">
      <!-- Left Column - Ability Scores & Skills -->
      <div class="xl:col-span-3 flex flex-col gap-card-gap">
        <AbilityScores />
        <div class="text-center py-3 bg-surface-container rounded-xl border border-outline-variant">
          <span class="font-bold text-2xl block text-primary">{{ store.profBonus >= 0 ? '+' : '' }}{{ store.profBonus }}</span>
          <label class="font-label-md text-on-surface-variant uppercase tracking-wider text-xs">Proficiency</label>
        </div>
        <SavingThrows />
        <SkillsList />
      </div>

      <!-- Center Column - Combat Stats -->
      <div class="xl:col-span-5 flex flex-col gap-card-gap">
        <CombatStats />
        <DeathSaves />
        <AttacksList />
      </div>

      <!-- Right Column - Key Features -->
      <div class="xl:col-span-4 flex flex-col gap-card-gap">
        <FeaturesList :features="store.keyFeatures" title="Key Features" />
      </div>
    </div>

    <!-- Secondary Layout Grid (Back Page equivalent) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-card-gap items-start pt-8 border-t border-outline-variant/30">
      <div class="flex flex-col gap-card-gap">
        <PersonalityBlock />
        <EquipmentBlock />
      </div>
      <div class="flex flex-col gap-card-gap">
        <FeaturesList :features="store.otherFeatures" title="Features & Traits" />
        <SpellcastingBlock />
      </div>
    </div>
  </div>
</template>
