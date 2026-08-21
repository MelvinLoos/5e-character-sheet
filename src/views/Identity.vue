<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import AttacksList from '@/components/sheet/AttacksList.vue'

const store = useCharacterStore()
</script>

<template>
  <div class="flex flex-col gap-8 w-full max-w-7xl mx-auto">
    <SheetHeader />

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- Left Column: Combat Vitals -->
      <section class="lg:col-span-6 flex flex-col gap-4 w-full">
        <CombatStats class="w-full" />
      </section>

      <!-- Right Column: Ability Scores -->
      <section class="lg:col-span-6 flex flex-col gap-8 w-full">
        <AbilityScores />
      </section>
    </div>

    <!-- Offense Overview + Renown (2-col on desktop, stacked on mobile) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Offense Overview -->
      <section
        class="bg-surface-container-highest rounded-lg p-6 border border-outline-variant shadow-sm"
      >
        <div class="flex items-center justify-between border-b border-primary-container pb-3 mb-4">
          <h3 class="font-headline-md text-headline-md text-primary flex items-center gap-2">
            <span class="material-symbols-outlined">swords</span> Offense Overview
          </h3>
        </div>

        <!-- Spell Attack / Save DC Summary Badge -->
        <div
          v-if="store.currentCharacterData.spellcasting"
          class="flex flex-wrap items-center gap-3 mb-4 p-3 bg-surface-container rounded-lg border border-outline-variant"
        >
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-tertiary text-lg">auto_fix_high</span>
            <span class="font-label-sm text-label-sm text-on-surface-variant">Spell ATK</span>
            <span class="font-headline-sm text-headline-sm text-tertiary">
              {{ store.spellAttack >= 0 ? '+' : '' }}{{ store.spellAttack }}
            </span>
          </div>
          <span class="w-px h-6 bg-outline-variant hidden sm:block"></span>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-lg">shield_with_heart</span>
            <span class="font-label-sm text-label-sm text-on-surface-variant">Save DC</span>
            <span class="font-headline-sm text-headline-sm text-primary">{{ store.spellSaveDC }}</span>
          </div>
        </div>

        <AttacksList />
      </section>

      <RenownProgression />
    </div>
  </div>
</template>
