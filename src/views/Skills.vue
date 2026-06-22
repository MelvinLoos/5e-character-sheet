<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import SkillsList from '@/components/sheet/SkillsList.vue'
import SavingThrows from '@/components/sheet/SavingThrows.vue'

const store = useCharacterStore()
</script>

<template>
  <div class="flex flex-col h-full">
    <header class="mb-8 flex justify-between items-end border-b border-surface-variant pb-4">
      <div>
        <h2 class="font-display-lg text-display-lg text-on-background">Skills & Proficiencies</h2>
        <p class="font-body-lg text-body-lg text-on-surface-variant mt-2">
          Determine your scholarly expertise and practical aptitudes.
        </p>
      </div>
      <div class="flex gap-6">
        <div
          class="bg-surface-container border border-primary-container rounded p-3 text-center min-w-[80px]"
        >
          <p class="font-label-md text-label-md text-on-surface-variant uppercase text-[10px]">
            Proficiency
          </p>
          <p class="font-headline-lg text-headline-lg text-tertiary">
            {{ store.profBonus >= 0 ? '+' : '' }}{{ store.profBonus }}
          </p>
        </div>
      </div>
    </header>

    <div class="flex flex-col gap-8 flex-1">
      <SavingThrows />
      <SkillsList />
    </div>
  </div>
</template>
