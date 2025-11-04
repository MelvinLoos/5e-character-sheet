<script setup>
import { computed } from 'vue'
import { useCharacterStore } from '@/stores/character'

const store = useCharacterStore()

// Check if character has spellcasting
const hasSpellcasting = computed(() => {
  return store.currentCharacterData?.features?.some((f) => f.casterType) || store.isEditing
})
</script>

<template>
  <section v-if="hasSpellcasting" class="mt-4 flex-grow flex flex-col">
    <h2 class="section-header">Spellcasting</h2>
    <div class="text-sm">
      <p class="mb-2">
        <strong>Spell Save DC:</strong> {{ store.spellSaveDC }} | <strong>Spell Attack:</strong>
        {{ store.spellAttack >= 0 ? '+' : '' }}{{ store.spellAttack }}
      </p>

      <!-- Spell Slots -->
      <div v-if="store.currentCharacterData.spellcasting?.spellSlots" class="mb-4">
        <h3 class="font-bold mb-2">Spell Slots</h3>
        <div class="space-y-1">
          <div
            v-for="[level, count] in Object.entries(
              store.currentCharacterData.spellcasting.spellSlots,
            )"
            :key="level"
            class="flex items-center"
          >
            <span class="w-20 font-bold">{{ level.replace('level', 'Level ') }}:</span>
            <div class="flex space-x-1">
              <input v-for="n in count" :key="n" type="checkbox" class="spell-slot-box" />
            </div>
          </div>
        </div>
      </div>

      <!-- Spells List -->
      <div v-if="store.currentCharacterData.spells?.length > 0">
        <h3 class="font-bold mb-2">Spells</h3>
        <div class="space-y-2">
          <div
            v-for="spell in store.currentCharacterData.spells"
            :key="spell.name"
            class="spell-box"
          >
            <div class="spell-title">{{ spell.name }} (Level {{ spell.level }})</div>
            <div class="spell-desc">{{ spell.desc }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
