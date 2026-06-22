<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import SheetHeader from '@/components/sheet/SheetHeader.vue'
import AbilityScores from '@/components/sheet/AbilityScores.vue'
import PersonalityBlock from '@/components/sheet/PersonalityBlock.vue'
import SavingThrows from '@/components/sheet/SavingThrows.vue'

const store = useCharacterStore()
</script>

<template>
  <div class="flex flex-col gap-8 w-full max-w-7xl mx-auto">
    <SheetHeader />
    
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
      <!-- Left Column: Personality -->
      <section class="lg:col-span-5 flex flex-col gap-8">
        <PersonalityBlock class="h-full" />
      </section>
      
      <!-- Right Column: Ability Scores -->
      <section class="lg:col-span-7 flex flex-col gap-8">
        <AbilityScores />
      </section>
    </div>

    <!-- Full Width: Saving Throws -->
    <div class="w-full">
      <SavingThrows />
    </div>
  </div>
</template>
