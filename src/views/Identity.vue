<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import { useSpellStore } from '@/stores/spellStore'
import { useCharacterCompletion } from '@/composables/useCharacterCompletion'
import AttacksList from '@/components/sheet/AttacksList.vue'

const store = useCharacterStore()
const spellStore = useSpellStore()
const { badges } = useCharacterCompletion()
</script>

<template>
  <div class="flex flex-col gap-8 w-full max-w-7xl mx-auto">
    <SheetHeader />

    <div
      v-if="badges.identity"
      class="md:hidden bg-red-600/10 border border-red-600/30 rounded-lg p-3 flex items-center gap-2"
    >
      <span class="material-symbols-outlined text-red-600">warning</span>
      <p class="font-label-md text-red-600">{{ badges.identity.label }}</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Row 1: Ability Scores (full width) -->
      <section class="lg:col-span-12 flex flex-col gap-6 w-full">
        <AbilityScores />
      </section>

      <!-- Row 2: Combat Vitals + Progression -->
      <section class="lg:col-span-6 flex flex-col gap-4 w-full">
        <CombatStats class="w-full" />
      </section>

      <RenownProgression class="lg:col-span-6" />

      <!-- Row 3: Offense (full width) -->
      <section
        class="lg:col-span-12 bg-surface-container-highest rounded-lg p-6 border border-outline-variant shadow-sm"
      >
        <div class="flex items-center justify-between border-b border-primary-container pb-3 mb-4">
          <h3 class="font-headline-md text-headline-md text-primary flex items-center gap-2">
            <span class="material-symbols-outlined">swords</span> Offense
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
              {{ spellStore.spellAttack >= 0 ? '+' : '' }}{{ spellStore.spellAttack }}
            </span>
          </div>
          <span class="w-px h-6 bg-outline-variant hidden sm:block"></span>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-lg">shield_with_heart</span>
            <span class="font-label-sm text-label-sm text-on-surface-variant">Save DC</span>
            <span class="font-headline-sm text-headline-sm text-primary">{{ spellStore.spellSaveDC }}</span>
          </div>
        </div>

        <AttacksList />
      </section>
    </div>
  </div>
</template>
