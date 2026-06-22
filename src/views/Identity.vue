<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import SheetHeader from '@/components/sheet/SheetHeader.vue'
import AbilityScores from '@/components/sheet/AbilityScores.vue'
import PersonalityBlock from '@/components/sheet/PersonalityBlock.vue'

const store = useCharacterStore()
</script>

<template>
  <div class="flex flex-col gap-8">
    <SheetHeader />
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
      <div class="flex flex-col gap-8">
        <AbilityScores />
      </div>
      <div class="flex flex-col gap-8">
        <PersonalityBlock />
      </div>
    </div>
  </div>
</template>

