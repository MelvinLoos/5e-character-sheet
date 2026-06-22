<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'

const store = useCharacterStore()
</script>

<template>
  <section class="mb-10">
    <div class="flex items-center gap-2 mb-4 border-b border-primary-container pb-2">
      <span class="material-symbols-outlined text-primary text-2xl" style="font-variation-settings: 'FILL' 1;">backpack</span>
      <h3 class="font-headline-md text-headline-md text-primary m-0">Equipment</h3>
    </div>
    
    <div class="bg-surface-container p-5 rounded-lg border border-outline-variant relative">
      <textarea
        v-if="store.isEditing"
        v-model="store.currentCharacterData.equipment"
        class="w-full bg-background border border-outline-variant rounded p-3 text-on-surface font-body-md focus:border-tertiary focus:ring-1 focus:ring-tertiary min-h-[150px]"
        placeholder="List your equipment here..."
      ></textarea>
      <div v-else class="font-body-md text-body-md text-on-surface-variant whitespace-pre-wrap leading-relaxed">
        {{ store.currentCharacterData.equipment || 'No equipment listed.' }}
      </div>
    </div>
  </section>
</template>
