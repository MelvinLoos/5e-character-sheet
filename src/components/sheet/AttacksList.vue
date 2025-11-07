<script setup>
import { useCharacterStore } from '@/stores/character'
import { computed } from 'vue'
import feather from 'feather-icons'
import draggable from 'vuedraggable'

const store = useCharacterStore()

// Computed property for draggable attacks
const editableAttacks = computed({
  get() {
    return store.currentCharacterData.attacks || []
  },
  set(value) {
    store.currentCharacterData.attacks = value
  },
})

function addAttack() {
  const newAttack = {
    name: 'New Attack',
    atkStat: 'str',
    dmgStat: 'str',
    dmgDie: '1d8',
    dmgBonus: 0,
    type: 'slashing',
    weaponMastery: '',
    notes: '',
  }

  store.currentCharacterData.attacks = store.currentCharacterData.attacks || []
  store.currentCharacterData.attacks.push(newAttack)
}

function removeAttack(index) {
  store.currentCharacterData.attacks.splice(index, 1)
}
</script>

<template>
  <section>
    <div class="flex items-center justify-between mb-3">
      <h2 class="section-header mb-0">Attacks</h2>
      <button
        v-if="store.isEditing"
        @click="addAttack"
        class="icon-button text-xs p-1"
        title="Add Attack"
      >
        <span v-html="feather.icons.plus.toSvg({ width: 14, height: 14 })"></span>
      </button>
    </div>
    <div
      v-if="store.currentCharacterData.attacks.length === 0"
      class="italic text-center text-gray-500"
    >
      No attacks defined.
    </div>

    <draggable
      v-else
      v-model="editableAttacks"
      item-key="name"
      tag="div"
      class="space-y-3"
      :disabled="!store.isEditing"
      handle=".attack-drag-handle"
      ghost-class="ghost-item"
      chosen-class="chosen-item"
      drag-class="drag-item"
    >
      <template #item="{ element: attack, index }">
        <div class="attack-box relative">
          <!-- Drag handle - only show in edit mode -->
          <div
            v-if="store.isEditing"
            class="attack-drag-handle absolute left-2 top-2 cursor-move opacity-40 hover:opacity-70 z-10"
            title="Drag to reorder"
          >
            <span v-html="feather.icons['move'].toSvg({ width: 16, height: 16 })"></span>
          </div>

          <div class="flex justify-between items-start" :class="{ 'ml-6': store.isEditing }">
            <div class="flex-grow">
              <div class="flex justify-between items-baseline flex-wrap">
                <input
                  v-if="store.isEditing"
                  v-model="attack.name"
                  class="edit-mode-input font-bold text-base"
                  placeholder="Attack name"
                />
                <strong v-else>{{ attack.name }}:</strong>
                <span class="text-right text-sm whitespace-nowrap">
                  <strong>Atk:</strong>
                  {{ store.abilityMods[attack.atkStat] + store.profBonus >= 0 ? '+' : ''
                  }}{{ store.abilityMods[attack.atkStat] + store.profBonus }} |
                  <strong>Dmg:</strong> {{ attack.dmgDie
                  }}{{ store.abilityMods[attack.dmgStat] + (attack.dmgBonus || 0) >= 0 ? '+' : ''
                  }}{{ store.abilityMods[attack.dmgStat] + (attack.dmgBonus || 0) }}
                  {{ attack.type }}
                </span>
              </div>

              <!-- Edit mode fields -->
              <div v-if="store.isEditing" class="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div>
                  <label class="block text-xs">Attack Stat:</label>
                  <select v-model="attack.atkStat" class="edit-mode-select w-full">
                    <option value="str">Strength</option>
                    <option value="dex">Dexterity</option>
                    <option value="con">Constitution</option>
                    <option value="int">Intelligence</option>
                    <option value="wis">Wisdom</option>
                    <option value="cha">Charisma</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs">Damage Stat:</label>
                  <select v-model="attack.dmgStat" class="edit-mode-select w-full">
                    <option value="str">Strength</option>
                    <option value="dex">Dexterity</option>
                    <option value="con">Constitution</option>
                    <option value="int">Intelligence</option>
                    <option value="wis">Wisdom</option>
                    <option value="cha">Charisma</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs">Damage Die:</label>
                  <input v-model="attack.dmgDie" class="edit-mode-input w-full" placeholder="1d8" />
                </div>
                <div>
                  <label class="block text-xs">Damage Type:</label>
                  <select v-model="attack.type" class="edit-mode-select w-full">
                    <option value="slashing">Slashing</option>
                    <option value="piercing">Piercing</option>
                    <option value="bludgeoning">Bludgeoning</option>
                    <option value="fire">Fire</option>
                    <option value="cold">Cold</option>
                    <option value="lightning">Lightning</option>
                    <option value="thunder">Thunder</option>
                    <option value="acid">Acid</option>
                    <option value="poison">Poison</option>
                    <option value="psychic">Psychic</option>
                    <option value="necrotic">Necrotic</option>
                    <option value="radiant">Radiant</option>
                    <option value="force">Force</option>
                  </select>
                </div>
                <div class="col-span-2">
                  <label class="block text-xs">Weapon Mastery:</label>
                  <input
                    v-model="attack.weaponMastery"
                    class="edit-mode-input w-full"
                    placeholder="e.g., Nick, Push, etc."
                  />
                </div>
                <div class="col-span-2">
                  <label class="block text-xs">Notes:</label>
                  <textarea
                    v-model="attack.notes"
                    class="edit-mode-textarea w-full"
                    placeholder="Additional notes..."
                    rows="2"
                  ></textarea>
                </div>
              </div>

              <!-- Display mode -->
              <p
                v-else-if="attack.weaponMastery || attack.notes"
                class="text-xs text-gray-600 italic mt-1"
              >
                <span v-if="attack.weaponMastery" class="font-bold not-italic text-red-800"
                  >{{ attack.weaponMastery }}:</span
                >
                {{ attack.notes || '' }}
              </p>
            </div>
            <button
              v-if="store.isEditing"
              @click="removeAttack(index)"
              class="icon-button text-xs p-1 ml-2 bg-red-600 hover:bg-red-700"
              title="Remove Attack"
            >
              <span v-html="feather.icons.x.toSvg({ width: 12, height: 12 })"></span>
            </button>
          </div>
        </div>
      </template>
    </draggable>
  </section>
</template>

<style scoped>
/* Drag and drop styling for attacks */
.attack-drag-handle {
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
