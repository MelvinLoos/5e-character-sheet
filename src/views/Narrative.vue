<script setup lang="ts">
import PersonalityBlock from '@/components/sheet/PersonalityBlock.vue'
</script>

<template>
  <div class="flex flex-col gap-8 w-full max-w-7xl mx-auto">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
      <section class="lg:col-span-12 flex flex-col gap-8">
        <PersonalityBlock class="h-full" />
      </section>
    </div>
  </div>
</template>
