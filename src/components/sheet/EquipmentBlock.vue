<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'

const store = useCharacterStore()
</script>

<template>
  <section class="mb-10">
    <h3 class="font-headline-md text-headline-md text-on-surface mb-4 border-b border-[#1A3C40] pb-2 flex items-center gap-2">
      <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">backpack</span>
      Equipment
    </h3>
    
    <div class="bg-surface-container p-5 rounded-2xl border border-[#1A3C40] shadow-md relative">
      <textarea
        v-if="store.isEditing"
        v-model="store.currentCharacterData.equipment"
        class="w-full bg-background border border-[#1A3C40] rounded-xl p-3 text-on-surface font-body-md focus:border-tertiary focus:ring-1 focus:ring-tertiary min-h-[150px]"
        placeholder="List your equipment here..."
      ></textarea>
      <div v-else class="font-body-md text-body-md text-on-surface-variant whitespace-pre-wrap leading-relaxed">
        {{ store.currentCharacterData.equipment || 'No equipment listed.' }}
      </div>
    </div>
  </section>
</template>
