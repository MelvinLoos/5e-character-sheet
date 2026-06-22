<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import SkillsList from '@/components/sheet/SkillsList.vue'
import SavingThrows from '@/components/sheet/SavingThrows.vue'

const store = useCharacterStore()
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div class="flex flex-col gap-8">
        <div class="text-center py-3 bg-surface-container rounded-xl border border-outline-variant">
          <span class="font-bold text-2xl block text-primary"
            >{{ store.profBonus >= 0 ? '+' : '' }}{{ store.profBonus }}</span
          >
          <label class="font-label-md text-on-surface-variant uppercase tracking-wider text-xs"
            >Proficiency Bonus</label
          >
        </div>
        <SavingThrows />
      </div>
      <div class="flex flex-col gap-8">
        <SkillsList />
      </div>
    </div>
  </div>
</template>
