<script setup lang="ts">
import RenownProgression from '@/components/sheet/RenownProgression.vue'
import SheetHeader from '@/components/sheet/SheetHeader.vue'
import AbilityScores from '@/components/sheet/AbilityScores.vue'
import CombatStats from '@/components/sheet/CombatStats.vue'
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

    <!-- Full Width: Renown Progression -->
    <div class="w-full">
      <RenownProgression />
    </div>
  </div>
</template>
