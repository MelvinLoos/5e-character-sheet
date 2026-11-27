<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import { useSpellStore } from '@/stores/spellStore'
import { useCharacterCompletion } from '@/composables/useCharacterCompletion'
import { usesLevels } from '@/domain'
import AttacksList from '@/components/sheet/AttacksList.vue'

const store = useCharacterStore()
const spellStore = useSpellStore()
const { badges } = useCharacterCompletion()
</script>

<template>
  <div class="flex flex-col gap-8 w-full max-w-7xl mx-auto">
    <SheetHeader :class="store.isEditing ? '' : 'max-lg:order-2'" />

    <StatusBanner v-if="badges.identity && store.isEditing" tone="error" class="md:hidden">
      {{ badges.identity.label }}
    </StatusBanner>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6" :class="store.isEditing ? '' : 'max-lg:order-1'">
      <!-- Row 1: Ability Scores (full width) -->
      <section class="lg:col-span-12 flex flex-col gap-6 w-full">
        <AbilityScores />
      </section>

      <!-- Row 2: Combat Vitals + Progression -->
      <section class="lg:col-span-5 flex flex-col gap-4 w-full" :class="{ 'max-lg:order-first': !store.isEditing }">
        <CombatStats class="w-full" />
      </section>

      <!-- Row 3: Offense (full width) -->
      <section
        class="lg:col-span-7 bg-surface-container-highest rounded-lg p-6 border border-outline-variant shadow-sm"
      >
        <div class="flex items-center justify-between border-b border-primary-container pb-3 mb-4">
          <h2 class="font-headline-md text-headline-md text-primary flex items-center gap-2">
            <span class="material-symbols-outlined" aria-hidden="true">swords</span> Offense
          </h2>
        </div>

        <!-- Spell Attack / Save DC Summary Badge -->
        <div
          v-if="store.currentCharacterData.spellcasting"
          class="flex flex-wrap items-center gap-3 mb-4 p-3 bg-surface-container rounded-lg border border-outline-variant"
        >
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-tertiary text-lg" aria-hidden="true">auto_fix_high</span>
            <span class="font-label-sm text-label-sm text-on-surface-variant">Spell ATK</span>
            <span class="font-headline-sm text-headline-sm text-tertiary">
              {{ spellStore.spellAttack >= 0 ? '+' : '' }}{{ spellStore.spellAttack }}
            </span>
          </div>
          <span class="w-px h-6 bg-outline-variant hidden sm:block"></span>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-lg" aria-hidden="true">shield_with_heart</span>
            <span class="font-label-sm text-label-sm text-on-surface-variant">Save DC</span>
            <span class="font-headline-sm text-headline-sm text-primary">{{ spellStore.spellSaveDC }}</span>
          </div>
        </div>

        <AttacksList />
      </section>

      <RenownProgression v-if="!usesLevels(store.currentCharacterData)" class="lg:col-span-12" />
    </div>
  </div>
</template>
