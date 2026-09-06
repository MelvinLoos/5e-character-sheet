<script setup lang="ts">
import { useProgressionStore } from '@/stores/progression'
import { useCharacterCompletion } from '@/composables/useCharacterCompletion'
const progression = useProgressionStore()
const { badges } = useCharacterCompletion()
</script>

<template>
  <div class="flex flex-col">
    <header class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-surface-variant pb-4">
      <div>
        <h2 class="font-display-lg text-display-lg text-tertiary">Skills & Proficiencies</h2>
        <p class="font-body-lg text-body-lg text-on-surface-variant mt-2">
          Determine your character's expertise and practical aptitudes.
        </p>
      </div>
      <div class="flex gap-6">
        <div
          class="bg-surface-container border border-primary-container rounded p-3 text-center min-w-[60px] sm:min-w-[80px]"
        >
            <p class="font-label-md text-label-md text-on-surface-variant uppercase text-[9px] sm:text-[10px]">
            Proficiency
          </p>
            <p class="font-headline-md text-headline-md sm:font-headline-lg sm:text-headline-lg text-tertiary">
            {{ progression.profBonus >= 0 ? '+' : '' }}{{ progression.profBonus }}
          </p>
        </div>
      </div>
    </header>

    <div
      v-if="badges.skills"
      class="md:hidden bg-red-600/10 border border-red-600/30 rounded-lg p-3 flex items-center gap-2 mb-4"
    >
      <span class="material-symbols-outlined text-red-600">warning</span>
      <p class="font-label-md text-red-600">{{ badges.skills.label }}</p>
    </div>

    <div class="flex flex-col gap-2">
      <SavingThrows />
      <SkillsList />
    </div>
  </div>
</template>
