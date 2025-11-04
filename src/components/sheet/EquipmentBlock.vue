<script setup>
import { useCharacterStore } from '@/stores/character'

const store = useCharacterStore()
</script>

<template>
  <section>
    <h2 class="section-header">Equipment</h2>
    <textarea
      v-if="store.isEditing"
      v-model="store.currentCharacterData.equipment"
      class="edit-mode-textarea"
    ></textarea>
    <p v-else class="text-sm italic">{{ store.currentCharacterData.equipment }}</p>
  </section>
</template>
