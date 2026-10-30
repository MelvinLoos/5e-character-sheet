<script setup lang="ts">
import { useProgressionStore } from '@/stores/progression'
import { useCharacterCompletion } from '@/composables/useCharacterCompletion'
const progression = useProgressionStore()
const { badges } = useCharacterCompletion()
</script>

<template>
  <div class="flex flex-col">
    <PageHeader
      title="Skills & Proficiencies"
      subtitle="Determine your character's expertise and practical aptitudes."
    >
      <template #actions>
        <div
          class="bg-surface-container border border-primary-container rounded p-3 text-center min-w-[60px] sm:min-w-[80px]"
        >
          <p class="font-label-md text-label-md text-on-surface-variant uppercase">Proficiency</p>
          <p class="font-headline-md text-headline-md sm:font-headline-lg sm:text-headline-lg text-tertiary">
            {{ progression.profBonus >= 0 ? '+' : '' }}{{ progression.profBonus }}
          </p>
        </div>
      </template>
    </PageHeader>

    <StatusBanner v-if="badges.skills" tone="error" class="md:hidden">
      {{ badges.skills.label }}
    </StatusBanner>

    <div class="flex flex-col gap-2">
      <SavingThrows />
      <SkillsList />
    </div>
  </div>
</template>
