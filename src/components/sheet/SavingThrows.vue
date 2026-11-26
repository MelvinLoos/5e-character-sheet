<script setup lang="ts">
import ProficiencyToggle from '@/components/ui/ProficiencyToggle.vue'
import { useCharacterStore } from '@/stores/character'
import { useProgressionStore } from '@/stores/progression'
import * as DND_RULES from '@/data/rules'
import { formatMod } from '@/domain'
import { useSheetRoll } from '@/composables/useSheetRoll'

const store = useCharacterStore()
const progression = useProgressionStore()
const { rollCheck } = useSheetRoll()

function isProficient(key: string) {
  return store.currentCharacterData.proficiencies.savingThrows.includes(key)
}

function getSaveMod(key: string) {
  const baseMod = progression.abilityMods[key] ?? 0
  const profBonus = isProficient(key) ? progression.profBonus : 0
  return baseMod + profBonus
}

function toggleProficiency(key: string) {
  if (!store.isEditing) return

  const saves = store.currentCharacterData.proficiencies.savingThrows
  const index = saves.indexOf(key)

  if (index === -1) {
    saves.push(key)
  } else {
    saves.splice(index, 1)
  }
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <h3
      class="font-headline-md text-headline-md text-primary border-b border-primary-container pb-2"
    >
      Saving Throws
    </h3>
    <p v-if="!store.isEditing" class="font-body-sm text-body-sm text-on-surface-variant md:hidden">Tap a save to roll it.</p>
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-[1em]">
      <div
        v-for="[key, name] in Object.entries(DND_RULES.ABILITIES)"
        :key="key"
        class="bg-surface-container border rounded-lg p-2 flex items-center justify-between hover:bg-surface-variant transition-colors group gap-0"
        :class="'border-primary-container'"
      >
        <component
          :is="store.isEditing ? 'div' : 'button'"
          :type="store.isEditing ? undefined : 'button'"
          :aria-label="store.isEditing ? undefined : `Roll ${name} saving throw, ${formatMod(getSaveMod(key))}`"
          class="flex items-center gap-2 flex-1 min-h-12 text-left rounded-lg select-none"
          @click="!store.isEditing && rollCheck(`${name} save`, getSaveMod(key))"
        >
          <div
            class="w-12 h-12 rounded bg-surface-dim border flex items-center justify-center font-headline-md text-headline-md transition-colors"
            :class="
              isProficient(key)
                ? 'text-tertiary border-tertiary/50'
                : 'text-on-surface-variant border-outline-variant'
            "
          >
            {{ formatMod(getSaveMod(key)) }}
          </div>
          <div>
            <h3 class="font-label-md text-label-md text-on-background leading-normal">
              {{ name }}
            </h3>
            <span class="text-label-sm uppercase tracking-wider text-on-surface-variant">{{
              key.toUpperCase()
            }}</span>
          </div>
        </component>
        <div class="flex items-center gap-3">
          <ProficiencyToggle
            :model-value="isProficient(key)"
            :label="`${name} saving throw proficiency`"
            title="Proficiency"
            :disabled="!store.isEditing"
            @update:model-value="toggleProficiency(key)"
          />
        </div>
      </div>
    </div>
  </section>
</template>
