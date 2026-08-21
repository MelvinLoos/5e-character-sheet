<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '@/stores/character'
import { useCombat, MAX_ATTACKS } from '@/composables/useCombat'
import draggable from 'vuedraggable'

const store = useCharacterStore()
const { editableAttacks, addAttack, removeAttack } = useCombat()

const attackCount = computed(() => store.currentCharacterData.attacks?.length || 0)
const atMaxAttacks = computed(() => attackCount.value >= MAX_ATTACKS)
</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex items-center justify-between border-b border-primary-container pb-2">
      <h2 class="font-headline-md text-headline-md text-primary">Attacks</h2>
      <div class="flex items-center gap-2">
        <span
          v-if="atMaxAttacks"
          class="text-xs font-label-sm text-tertiary italic"
          title="Maximum of 5 attacks allowed"
        >
          Max {{ MAX_ATTACKS }} attacks
        </span>
        <button
          v-if="store.isEditing"
          @click="addAttack"
          :disabled="atMaxAttacks"
          class="bg-primary-container text-primary border border-primary/30 px-3 py-1 rounded-lg font-label-md flex items-center gap-2 hover:bg-surface-variant hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm active:scale-95 transition-all duration-200 ease-out text-sm select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          title="Add Attack"
        >
          <span class="material-symbols-outlined text-[18px]">add_circle</span> Add Attack
        </button>
      </div>
    </div>
    <div
      v-if="attackCount === 0"
      class="italic text-center font-body-md text-on-surface-variant p-4 bg-surface-container-high rounded-lg border border-outline-variant"
    >
      No attacks defined.
    </div>

    <draggable
      v-else
      v-model="editableAttacks"
      item-key="id"
      tag="div"
      class="space-y-3"
      :disabled="!store.isEditing"
      handle=".attack-drag-handle"
      ghost-class="opacity-50"
      chosen-class="scale-[1.02]"
      drag-class="rotate-1"
    >
      <template #item="{ element: attack, index }">
        <div
          class="bg-surface-container border border-outline-variant rounded-lg p-3 relative group transition-colors hover:border-tertiary/50"
        >
          <!-- Drag handle - only show in edit mode -->
          <div
            v-if="store.isEditing"
            class="attack-drag-handle absolute left-2 top-4 cursor-move opacity-40 hover:opacity-100 z-10 text-on-surface-variant"
            title="Drag to reorder"
          >
            <span class="material-symbols-outlined text-[16px]">drag_indicator</span>
          </div>

          <div class="flex justify-between items-start" :class="{ 'ml-6': store.isEditing }">
            <div class="flex-grow flex flex-col gap-2">
              <div class="flex justify-between items-baseline flex-wrap gap-2">
                <input
                  v-if="store.isEditing"
                  v-model="attack.name"
                  class="bg-surface-container-highest border-b border-outline focus:border-tertiary focus:ring-0 font-headline-md text-on-surface px-2 py-1 text-sm rounded-t"
                  placeholder="Attack name"
                />
                <strong v-else class="font-headline-md text-on-surface text-lg">{{
                  attack.name
                }}</strong>

                <span
                  class="text-right font-label-md text-on-surface-variant bg-surface-container-high px-2 py-1 rounded border border-outline-variant flex items-center gap-2"
                >
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px] text-tertiary"
                      >sports_martial_arts</span
                    >
                    <template v-if="attack.atkStat">
                      <template v-if="attack.atkStat === 'custom'">
                        {{
                          attack.customAtkValue >= 0
                            ? '+' + attack.customAtkValue
                            : attack.customAtkValue
                        }}
                      </template>
                      <template v-else>
                        {{
                          (store.abilityMods[attack.atkStat] ?? 0) + store.profBonus >= 0
                            ? '+'
                            : ''
                        }}{{ (store.abilityMods[attack.atkStat] ?? 0) + store.profBonus }}
                      </template>
                    </template>
                    <template v-else>0</template>
                  </span>

                  <span class="w-px h-3 bg-outline-variant mx-1"></span>

                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px] text-error">water_drop</span>
                    <span v-if="attack.dmgDie">{{ attack.dmgDie }}</span>
                    <template v-if="attack.dmgStat">
                      <template v-if="attack.dmgStat === 'custom'">
                        {{ (attack.customDmgValue || 0) + (attack.dmgBonus || 0) >= 0 ? '+' : ''
                        }}{{ (attack.customDmgValue || 0) + (attack.dmgBonus || 0) }}
                      </template>
                      <template v-else>
                        {{
                          (store.abilityMods[attack.dmgStat] ?? 0) + (attack.dmgBonus || 0) >= 0
                            ? '+'
                            : ''
                        }}{{ (store.abilityMods[attack.dmgStat] ?? 0) + (attack.dmgBonus || 0) }}
                      </template>
                    </template>
                    <template v-else>
                      {{
                        attack.dmgBonus
                          ? attack.dmgBonus >= 0
                            ? '+' + attack.dmgBonus
                            : attack.dmgBonus
                          : ''
                      }}
                    </template>
                    <span class="capitalize text-[10px] ml-1 opacity-80 uppercase tracking-wider">{{
                      attack.type
                    }}</span>
                  </span>
                </span>
              </div>

              <!-- Edit mode fields -->
              <div
                v-if="store.isEditing"
                class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 bg-surface-container-highest p-3 rounded border border-outline-variant"
              >
                <div>
                  <label class="block font-label-sm text-label-sm text-tertiary mb-1"
                    >Attack Stat</label
                  >
                  <select
                    v-model="attack.atkStat"
                    class="w-full bg-background border border-outline-variant rounded p-1.5 text-on-surface font-body-sm text-sm focus:border-tertiary focus:ring-1 focus:ring-tertiary"
                  >
                    <option value="">None</option>
                    <option value="custom">Custom</option>
                    <option value="str">Strength</option>
                    <option value="dex">Dexterity</option>
                    <option value="con">Constitution</option>
                    <option value="int">Intelligence</option>
                    <option value="wis">Wisdom</option>
                    <option value="cha">Charisma</option>
                  </select>
                  <div v-if="attack.atkStat === 'custom'" class="mt-2">
                    <label class="block font-label-sm text-label-sm text-tertiary mb-1"
                      >Custom Atk Mod</label
                    >
                    <input
                      v-model.number="attack.customAtkValue"
                      type="number"
                      class="w-full bg-background border border-outline-variant rounded p-1.5 text-on-surface font-body-sm text-sm focus:border-tertiary focus:ring-1 focus:ring-tertiary"
                    />
                  </div>
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-tertiary mb-1"
                    >Damage Stat</label
                  >
                  <select
                    v-model="attack.dmgStat"
                    class="w-full bg-background border border-outline-variant rounded p-1.5 text-on-surface font-body-sm text-sm focus:border-tertiary focus:ring-1 focus:ring-tertiary"
                  >
                    <option value="">None</option>
                    <option value="custom">Custom</option>
                    <option value="str">Strength</option>
                    <option value="dex">Dexterity</option>
                    <option value="con">Constitution</option>
                    <option value="int">Intelligence</option>
                    <option value="wis">Wisdom</option>
                    <option value="cha">Charisma</option>
                  </select>
                  <div v-if="attack.dmgStat === 'custom'" class="mt-2">
                    <label class="block font-label-sm text-label-sm text-tertiary mb-1"
                      >Custom Dmg Mod</label
                    >
                    <input
                      v-model.number="attack.customDmgValue"
                      type="number"
                      class="w-full bg-background border border-outline-variant rounded p-1.5 text-on-surface font-body-sm text-sm focus:border-tertiary focus:ring-1 focus:ring-tertiary"
                    />
                  </div>
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-tertiary mb-1"
                    >Damage Die</label
                  >
                  <input
                    v-model="attack.dmgDie"
                    class="w-full bg-background border border-outline-variant rounded p-1.5 text-on-surface font-body-sm text-sm focus:border-tertiary focus:ring-1 focus:ring-tertiary"
                    placeholder="1d8"
                  />
                </div>
                <div>
                  <label class="block font-label-sm text-label-sm text-tertiary mb-1"
                    >Damage Type</label
                  >
                  <select
                    v-model="attack.type"
                    class="w-full bg-background border border-outline-variant rounded p-1.5 text-on-surface font-body-sm text-sm focus:border-tertiary focus:ring-1 focus:ring-tertiary"
                  >
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
                <div class="col-span-1 md:col-span-2">
                  <label class="block font-label-sm text-label-sm text-tertiary mb-1"
                    >Weapon Mastery</label
                  >
                  <input
                    v-model="attack.weaponMastery"
                    class="w-full bg-background border border-outline-variant rounded p-1.5 text-on-surface font-body-sm text-sm focus:border-tertiary focus:ring-1 focus:ring-tertiary"
                    placeholder="e.g., Nick, Push, etc."
                  />
                </div>
                <div class="col-span-1 md:col-span-2">
                  <label class="block font-label-sm text-label-sm text-tertiary mb-1">Notes</label>
                  <textarea
                    v-model="attack.notes"
                    class="w-full bg-background border border-outline-variant rounded p-1.5 text-on-surface font-body-sm text-sm focus:border-tertiary focus:ring-1 focus:ring-tertiary min-h-[60px]"
                    placeholder="Additional notes..."
                  ></textarea>
                </div>
              </div>

              <!-- Display mode -->
              <p
                v-else-if="attack.weaponMastery || attack.notes"
                class="font-body-sm text-on-surface-variant italic mt-1 text-sm bg-surface-container-highest p-2 rounded border border-outline-variant border-l-2 border-l-tertiary"
              >
                <span v-if="attack.weaponMastery" class="font-bold not-italic text-tertiary mr-1"
                  >{{ attack.weaponMastery }}:</span
                >
                {{ attack.notes || '' }}
              </p>
            </div>
            <button
              v-if="store.isEditing"
              @click="removeAttack(index)"
              class="ml-2 w-6 h-6 rounded border border-error/50 bg-error/10 text-error hover:bg-error hover:text-on-error hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:bg-error/30 active:scale-90 transition-all duration-200 ease-out flex items-center justify-center shrink-0 select-none"
              title="Remove Attack"
            >
              <span class="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        </div>
      </template>
    </draggable>
  </section>
</template>
