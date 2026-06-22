<script setup lang="ts">
import EquipmentBlock from '@/components/sheet/EquipmentBlock.vue'
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

    <EquipmentBlock />
  </div>
</template>
