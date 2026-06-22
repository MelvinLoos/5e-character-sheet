<script setup lang="ts">
import PersonalityBlock from '@/components/sheet/PersonalityBlock.vue'
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <header class="mb-8 flex justify-between items-end border-b border-surface-variant pb-4">
      <div>
        <h2 class="font-display-lg text-display-lg text-tertiary">Chronicles &amp; Lore</h2>
        <p class="font-body-lg text-body-lg text-on-surface-variant mt-2">
          Document your past and define your purpose.
        </p>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-card-gap">
      <PersonalityBlock />
    </div>
  </div>
</template>
