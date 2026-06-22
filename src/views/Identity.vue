<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import SheetHeader from '@/components/sheet/SheetHeader.vue'
import AbilityScores from '@/components/sheet/AbilityScores.vue'
import SavingThrows from '@/components/sheet/SavingThrows.vue'
import CombatStats from '@/components/sheet/CombatStats.vue'
import AttacksList from '@/components/sheet/AttacksList.vue'
import DeathSaves from '@/components/sheet/DeathSaves.vue'

const store = useCharacterStore()
</script>

<template>
  <div class="flex flex-col gap-8 w-full max-w-7xl mx-auto">
    <SheetHeader />
    
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Left Column: Combat Vitals & Ability Scores -->
      <section class="lg:col-span-5 flex flex-col gap-8 w-full">
        <CombatStats class="w-full" />
        <DeathSaves class="w-full" />
        <AbilityScores />
      </section>
      
      <!-- Right Column: Attacks -->
      <section class="lg:col-span-7 flex flex-col gap-8 w-full">
        <div class="bg-surface-container rounded-lg p-6 border border-outline-variant shadow-sm w-full">
          <AttacksList class="w-full" />
        </div>
      </section>
    </div>

    <!-- Full Width: Saving Throws -->
    <div class="w-full">
      <SavingThrows />
    </div>
  </div>
</template>
