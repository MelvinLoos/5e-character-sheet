<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useCharacterCompletion } from '@/composables/useCharacterCompletion'

const SpellcastingBlock = defineAsyncComponent(
  () => import('@/components/sheet/SpellcastingBlock.vue'),
)

const { badges } = useCharacterCompletion()
</script>

<template>
  <div class="flex-grow flex flex-col gap-4 w-full max-w-7xl mx-auto items-stretch">
    <PageHeader
      title="Spells"
      subtitle="When you are a spellcaster here is where you decide your spells"
    />
    <StatusBanner v-if="badges.spells" tone="error" class="md:hidden">
      {{ badges.spells.label }}
    </StatusBanner>
    <!-- Render the overhauled self-contained SpellcastingBlock component -->
    <SpellcastingBlock class="w-full flex-grow" />
  </div>
</template>
