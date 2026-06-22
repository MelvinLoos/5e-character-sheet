<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const SpellcastingBlock = defineAsyncComponent(() => import('@/components/sheet/SpellcastingBlock.vue'))
</script>

<template>
  <div class="flex flex-col gap-8">
    <SpellcastingBlock />
  </div>
</template>

