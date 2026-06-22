<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import * as DND_RULES from '@/data/rules'
import { formatMod } from '@/services/characterService'

const store = useCharacterStore()

function getNormalizedName(name: string) {
  return name.toLowerCase().replace(/ /g, '')
}

function isProficient(name: string) {
  return store.currentCharacterData.proficiencies.skills.includes(getNormalizedName(name))
}

function getSkillMod(name: string, stat: string) {
  const baseMod = store.abilityMods[stat] ?? 0
  const profBonus = isProficient(name) ? store.profBonus : 0
  return baseMod + profBonus
}

function toggleProficiency(name: string) {
  if (!store.isEditing) return

  const normName = getNormalizedName(name)
  const skills = store.currentCharacterData.proficiencies.skills
  const index = skills.indexOf(normName)

  if (index === -1) {
    skills.push(normName)
  } else {
    skills.splice(index, 1)
  }
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <h3
      class="font-headline-md text-headline-md text-primary border-b border-primary-container pb-2"
    >
      Skills
    </h3>
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-card-gap pb-4">
      <div
        v-for="[name, stat] in Object.entries(DND_RULES.SKILLS)"
        :key="name"
        class="bg-surface-container border rounded-lg p-4 flex items-center justify-between hover:bg-surface-variant transition-colors group"
        :class="'border-primary-container'"
      >
        <div class="flex items-center gap-4 flex-1">
          <div
            class="w-12 h-12 rounded bg-surface-dim border flex items-center justify-center font-headline-md text-headline-md transition-colors"
            :class="
              isProficient(name)
                ? 'text-tertiary border-tertiary/50'
                : 'text-on-surface-variant border-outline-variant'
            "
          >
            {{ formatMod(getSkillMod(name, stat)) }}
          </div>
          <div>
            <h3 class="font-label-md text-label-md text-on-background leading-normal">
              {{ name }}
            </h3>
            <span class="text-[11px] uppercase tracking-wider text-on-surface-variant">{{
              stat.toUpperCase()
            }}</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- Proficiency toggle -->
          <label
            class="relative flex items-center justify-center"
            :class="store.isEditing ? 'cursor-pointer' : 'cursor-default'"
            title="Proficiency"
          >
            <input
              type="checkbox"
              class="sr-only skill-checkbox"
              :checked="isProficient(name)"
              @change="toggleProficiency(name)"
              :disabled="!store.isEditing"
            />
            <div
              class="w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center"
              :class="[
                isProficient(name)
                  ? 'border-tertiary bg-tertiary'
                  : 'border-outline-variant bg-surface',
                store.isEditing && !isProficient(name) ? 'group-hover:border-tertiary/50' : '',
              ]"
            >
              <svg
                v-if="isProficient(name)"
                class="w-3 h-3 text-on-tertiary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="3"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
          </label>
        </div>
      </div>
    </div>
  </section>
</template>
