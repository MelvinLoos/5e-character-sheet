<script setup lang="ts">
import PersonalityBlock from '@/components/sheet/PersonalityBlock.vue'
</script>

<template>
  <div class="max-w-7xl mx-auto space-y-card-gap relative z-10 pb-20">
    <!-- Header -->
    <header class="mb-10 border-b border-outline-variant pb-6 flex justify-between items-end">
      <div>
        <h2 class="font-display-lg text-display-lg text-tertiary">Chronicles &amp; Lore</h2>
        <p class="font-body-lg text-body-lg text-on-surface-variant mt-2">
          Document your past and define your purpose.
        </p>
      </div>
      <div class="flex items-center gap-2 text-primary">
        <span class="material-symbols-outlined">auto_fix_high</span>
        <span class="font-label-md text-label-md uppercase tracking-widest text-sm"
          >Auto-Save Enabled</span
        >
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-card-gap">
      <PersonalityBlock />
    </div>
  </div>
</template>
