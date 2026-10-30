<script setup lang="ts">
import { useCharacterCompletion } from '@/composables/useCharacterCompletion'
import StartingEquipmentWizard from '@/components/creation/StartingEquipmentWizard.vue'

const { badges } = useCharacterCompletion()
</script>

<template>
  <div class="flex flex-col gap-8">
    <!-- Header -->
    <PageHeader
      title="Inventory"
      subtitle="Keep a list of what you carry with you."
    />

    <StatusBanner v-if="badges.inventory" tone="error" class="md:hidden">
      {{ badges.inventory.label }}
    </StatusBanner>

    <StartingEquipmentWizard />
    <EquipmentBlock />
  </div>
</template>
