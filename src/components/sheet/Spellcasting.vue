<script setup>
import { computed } from 'vue'
import { useCharacterStore } from '@/stores/character'
import feather from 'feather-icons'

const store = useCharacterStore()

// Check if character has spellcasting - only show when a feature has casterType defined
const hasSpellcasting = computed(() => {
  const features = store.currentCharacterData?.features || []
  return features.some((f) => f.casterType)
})

function addSpell() {
  const newSpell = {
    name: 'New Spell',
    level: 1,
    desc: 'Enter spell description...',
  }
  
  store.currentCharacterData.spells = store.currentCharacterData.spells || []
  store.currentCharacterData.spells.push(newSpell)
}

function removeSpell(index) {
  store.currentCharacterData.spells.splice(index, 1)
}
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
      <div v-if="store.currentCharacterData.spells?.length > 0 || store.isEditing">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold mb-0">Spells</h3>
          <button
            v-if="store.isEditing"
            @click="addSpell"
            class="icon-button text-xs p-1"
            title="Add Spell"
          >
            <span v-html="feather.icons.plus.toSvg({ width: 14, height: 14 })"></span>
          </button>
        </div>
        
        <div v-if="store.currentCharacterData.spells?.length === 0 && store.isEditing" class="italic text-center text-gray-500 py-4">
          No spells known. Click the + button to add spells.
        </div>
        
        <div v-else-if="store.currentCharacterData.spells?.length === 0" class="italic text-center text-gray-500 py-8">
          No spells known.
        </div>
        
        <div v-else class="space-y-3">
          <div
            v-for="(spell, index) in store.currentCharacterData.spells"
            :key="spell.name + index"
            class="spell-box"
          >
            <div class="flex justify-between items-start">
              <div class="flex-grow">
                <div class="flex items-baseline flex-wrap gap-2 mb-2">
                  <input
                    v-if="store.isEditing"
                    v-model="spell.name"
                    class="edit-mode-input font-bold text-base flex-grow"
                    placeholder="Spell name"
                  />
                  <p v-else class="spell-title font-bold">{{ spell.name }}</p>
                  
                  <input
                    v-if="store.isEditing"
                    v-model.number="spell.level"
                    type="number"
                    min="0"
                    max="9"
                    class="edit-mode-input w-16 text-xs"
                    placeholder="Level"
                  />
                  <span v-else class="text-xs font-normal italic">(Level {{ spell.level }})</span>
                </div>
                
                <textarea
                  v-if="store.isEditing"
                  v-model="spell.desc"
                  class="edit-mode-textarea w-full"
                  placeholder="Spell description"
                  rows="3"
                ></textarea>
                <p v-else class="spell-desc text-sm">{{ spell.desc }}</p>
              </div>
              
              <button
                v-if="store.isEditing"
                @click="removeSpell(index)"
                class="icon-button text-xs p-1 ml-2 bg-red-600 hover:bg-red-700"
                title="Remove Spell"
              >
                <span v-html="feather.icons.x.toSvg({ width: 12, height: 12 })"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
