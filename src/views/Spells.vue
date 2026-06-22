<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const SpellcastingBlock = defineAsyncComponent(
  () => import('@/components/sheet/SpellcastingBlock.vue'),
)
</script>

<template>
  <div class="flex-grow flex flex-col gap-8 w-full max-w-7xl mx-auto items-stretch">
    <!-- Optional Grimoire style banner -->
    <div
      class="bg-secondary-container rounded-lg p-5 border border-tertiary-container/30 flex items-start gap-4 shadow-md w-full"
      style="background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3))"
    >
      <span
        class="material-symbols-outlined text-tertiary text-3xl shrink-0 mt-1"
        style="font-variation-settings: 'FILL' 1"
        >info</span
      >
      <div>
        <h4 class="font-headline-md text-headline-md text-on-surface mb-1">
          Component Abstraction
        </h4>
        <p class="font-body-md text-body-md text-on-surface/90 leading-relaxed">
          Note: Mundane Material Components are abstracted into your
          <span class="text-secondary font-bold">Supply</span> or your Arcane Focus’s Usage Die. You
          do not need to track them individually.
        </p>
      </div>
    </div>

    <!-- Spell Grimoire -->
    <section
      class="bg-surface-container rounded-lg p-6 border border-outline-variant shadow-sm w-full flex-grow"
    >
      <SpellcastingBlock class="w-full" />
    </section>
  </div>
</template>
