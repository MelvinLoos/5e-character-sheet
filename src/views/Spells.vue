<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const SpellcastingBlock = defineAsyncComponent(
  () => import('@/components/sheet/SpellcastingBlock.vue'),
)
</script>

<template>
  <div class="flex-grow flex flex-col gap-4 w-full max-w-7xl mx-auto items-stretch">
    <PageHeader
      title="Spells"
      subtitle="When you are a spellcaster here is where you decide your spells"
    />
    <!-- Render the overhauled self-contained SpellcastingBlock component -->
    <SpellcastingBlock class="w-full flex-grow" />
  </div>
</template>
