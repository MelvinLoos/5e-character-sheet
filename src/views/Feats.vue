<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useCharacterStore } from '@/stores/character'

const FeaturesList = defineAsyncComponent(() => import('@/components/sheet/FeaturesList.vue'))
const store = useCharacterStore()
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div class="flex flex-col gap-8">
        <FeaturesList :features="store.keyFeatures" title="Key Features" />
      </div>
      <div class="flex flex-col gap-8">
        <FeaturesList :features="store.otherFeatures" title="Features & Traits" />
      </div>
    </div>
  </div>
</template>

