<script setup lang="ts">
import { useCharacterCompletion } from '@/composables/useCharacterCompletion'
import StartingEquipmentWizard from '@/components/creation/StartingEquipmentWizard.vue'

const { badges } = useCharacterCompletion()
</script>

<template>
  <div class="flex flex-col gap-8">
    <!-- Header -->
    <header class="mb-8 flex justify-between items-end border-b border-surface-variant pb-4">
      <div>
        <h2 class="font-display-lg text-display-lg text-tertiary">Inventory</h2>
        <p class="font-body-lg text-body-lg text-on-surface-variant mt-2">
          Keep a list of what you carry with you.
        </p>
      </div>
    </header>

    <div
      v-if="badges.inventory"
      class="md:hidden bg-red-600/10 border border-red-600/30 rounded-lg p-3 flex items-center gap-2"
    >
      <span class="material-symbols-outlined text-red-600">warning</span>
      <p class="font-label-md text-red-600">{{ badges.inventory.label }}</p>
    </div>

    <StartingEquipmentWizard />
    <EquipmentBlock />
  </div>
</template>
