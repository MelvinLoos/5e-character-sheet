<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const SpellcastingBlock = defineAsyncComponent(
  () => import('@/components/sheet/SpellcastingBlock.vue'),
)
</script>

<template>
  <div class="flex-grow flex flex-col gap-4 w-full max-w-7xl mx-auto items-stretch">
    <header class="mb-8 flex justify-between items-end border-b border-surface-variant pb-4">
      <div>
        <h2 class="font-display-lg text-display-lg text-tertiary">Spells</h2>
        <p class="font-body-lg text-body-lg text-on-surface-variant mt-2">
          When you are a spellcaster here is where you decide your spells
        </p>
      </div>
    </header>
    <!-- Render the overhauled self-contained SpellcastingBlock component -->
    <SpellcastingBlock class="w-full flex-grow" />
  </div>
</template>
