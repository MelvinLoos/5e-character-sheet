<script setup>
import { useCharacterStore } from '@/stores/character'

const store = useCharacterStore()
</script>

<template>
  <section class="bordered-section text-sm mb-4">
    <h2 class="section-header">Personality</h2>
    <div v-if="store.isEditing" class="space-y-2">
      <div>
        <strong>Traits:</strong>
        <textarea
          v-model="store.currentCharacterData.personality.traits"
          class="edit-mode-textarea"
        ></textarea>
      </div>
      <div>
        <strong>Ideal:</strong>
        <textarea
          v-model="store.currentCharacterData.personality.ideal"
          class="edit-mode-textarea"
        ></textarea>
      </div>
      <div>
        <strong>Bond:</strong>
        <textarea
          v-model="store.currentCharacterData.personality.bond"
          class="edit-mode-textarea"
        ></textarea>
      </div>
      <div>
        <strong>Flaw:</strong>
        <textarea
          v-model="store.currentCharacterData.personality.flaw"
          class="edit-mode-textarea"
        ></textarea>
      </div>
    </div>
    <div v-else class="space-y-2">
      <p>
        <strong>Traits:</strong>
        <span class="italic">{{ store.currentCharacterData.personality.traits }}</span>
      </p>
      <p>
        <strong>Ideal:</strong>
        <span class="italic">{{ store.currentCharacterData.personality.ideal }}</span>
      </p>
      <p>
        <strong>Bond:</strong>
        <span class="italic">{{ store.currentCharacterData.personality.bond }}</span>
      </p>
      <p>
        <strong>Flaw:</strong>
        <span class="italic">{{ store.currentCharacterData.personality.flaw }}</span>
      </p>
    </div>
  </section>
</template>
