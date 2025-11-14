<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '@/stores/character'
import { SPELL_SLOT_PROGRESSION } from '@/data/rules.js'
import feather from 'feather-icons'
import draggable from 'vuedraggable'

const store = useCharacterStore()

// Check if character has spellcasting - only show when casterType is not null and not 'none'
const hasSpellcasting = computed(() => {
  const features = store.currentCharacterData?.features || []
  return features.some((f) => f.casterType && f.casterType !== 'none')
})

// Get the caster type for spell slot calculation
const casterType = computed(() => {
  const features = store.currentCharacterData?.features || []
  const spellcastingFeature = features.find((f) => f.casterType && f.casterType !== 'none')
  return spellcastingFeature?.casterType || null
})

// Calculate spell slots based on caster type and level
const spellSlots = computed(() => {
  if (!casterType.value || !store.currentCharacterData?.level) return {}

  const level = store.currentCharacterData.level
  const progression = SPELL_SLOT_PROGRESSION[casterType.value]

  return progression?.[level] || {}
})

// Computed property for draggable spells
const editableSpells = computed({
  get() {
    return store.currentCharacterData.spells || []
  },
  set(value) {
    store.currentCharacterData.spells = value
  },
})

function addSpell() {
  // Only allow adding spells if there's a valid casterType
  if (!hasSpellcasting.value) return

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
      <div v-if="Object.keys(spellSlots).length > 0" class="mb-4">
        <h3 class="font-bold mb-2">Spell Slots</h3>
        <div class="space-y-1">
          <div
            v-for="[level, count] in Object.entries(spellSlots)"
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
      <div v-if="store.currentCharacterData.spells?.length > 0 || hasSpellcasting">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold mb-0">Spells</h3>
          <button
            v-if="store.isEditing && hasSpellcasting"
            @click="addSpell"
            class="icon-button text-xs p-1"
            title="Add Spell"
          >
            <span v-html="feather.icons.plus.toSvg({ width: 14, height: 14 })"></span>
          </button>
        </div>

        <div
          v-if="
            store.currentCharacterData.spells?.length === 0 && hasSpellcasting && store.isEditing
          "
          class="italic text-center text-gray-500 py-4"
        >
          No spells known. Click the + button to add spells.
        </div>

        <div
          v-else-if="store.currentCharacterData.spells?.length === 0"
          class="italic text-center text-gray-500 py-8"
        >
          No spells known.
        </div>

        <draggable
          v-else
          v-model="editableSpells"
          item-key="name"
          tag="div"
          class="space-y-3"
          :disabled="!store.isEditing"
          handle=".spell-drag-handle"
          ghost-class="ghost-item"
          chosen-class="chosen-item"
          drag-class="drag-item"
        >
          <template #item="{ element: spell, index }">
            <div class="spell-box relative">
              <!-- Drag handle - only show in edit mode -->
              <div
                v-if="store.isEditing"
                class="spell-drag-handle absolute left-2 top-2 cursor-move opacity-40 hover:opacity-70 z-10"
                title="Drag to reorder"
              >
                <span v-html="feather.icons['move'].toSvg({ width: 16, height: 16 })"></span>
              </div>

              <div class="flex justify-between items-start" :class="{ 'ml-6': store.isEditing }">
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
          </template>
        </draggable>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Drag and drop styling */
.spell-drag-handle {
  transition: opacity 0.2s ease;
}

.ghost-item {
  opacity: 0.5;
  background: rgba(59, 130, 246, 0.1);
  border: 2px dashed #3b82f6;
}

.chosen-item {
  transform: scale(1.02);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.drag-item {
  transform: rotate(2deg);
  opacity: 0.8;
}
</style>
