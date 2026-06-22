<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const SpellcastingBlock = defineAsyncComponent(
  () => import('@/components/sheet/SpellcastingBlock.vue'),
)
</script>

<template>
  <div class="flex-grow flex flex-col gap-8 w-full max-w-7xl mx-auto items-stretch">
    <!-- Render the overhauled self-contained SpellcastingBlock component -->
    <SpellcastingBlock class="w-full flex-grow" />
  </div>
</template>
