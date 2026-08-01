<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '@/stores/character'
import { formatMod } from '@/domain'
import { useSkills, normalizeSkillName } from '@/composables/useSkills'

const store = useCharacterStore()
const {
  allSkillMods,
  toggleProficiency,
  lockedSkills,
  classSkillOptions,
  remainingChoices,
  isSkillDisabled,
} = useSkills()

/**
 * Dynamic header text describing the current skill choice state.
 * - "Select a class to choose skills" when no class is selected.
 * - "All skill choices made" when remainingChoices is 0.
 * - "Choose X more skill(s)" otherwise.
 */
const choiceHeader = computed(() => {
  if (!store.currentCharacterData.class) {
    return 'Select a class to choose skills'
  }
  if (!classSkillOptions.value) {
    return 'All skill choices made'
  }
  if (remainingChoices.value <= 0) {
    return 'All skill choices made'
  }
  return `Choose ${remainingChoices.value} more skill${remainingChoices.value === 1 ? '' : 's'}`
})

/**
 * Whether a skill is auto-granted (locked) by the current class/background.
 * Used to display a "(Granted)" badge and prevent toggling.
 */
function isLocked(skillName: string): boolean {
  return lockedSkills.value.includes(normalizeSkillName(skillName))
}
</script>

<template>
  <section class="flex flex-col gap-4">
    <div class="flex items-center justify-between border-b border-primary-container pb-2">
      <h3 class="font-headline-md text-headline-md text-primary">Skills</h3>
      <span
        v-if="store.isEditing"
        class="text-sm font-label-md text-on-surface-variant"
        :class="remainingChoices > 0 ? 'text-tertiary' : ''"
      >
        {{ choiceHeader }}
      </span>
    </div>
    <div style="gap: 1em" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-card-gap pb-4">
      <div
        v-for="skill in allSkillMods"
        :key="skill.name"
        class="bg-surface-container border rounded-lg p-2 flex items-center justify-between hover:bg-surface-variant transition-colors group"
        :class="[
          'border-primary-container',
          isSkillDisabled(skill.name) && !skill.proficient ? 'opacity-60' : '',
        ]"
      >
        <div class="flex items-center gap-4 flex-1">
          <div
            class="w-12 h-12 rounded bg-surface-dim border flex items-center justify-center font-headline-md text-headline-md transition-colors"
            :class="
              skill.proficient
                ? 'text-tertiary border-tertiary/50'
                : 'text-on-surface-variant border-outline-variant'
            "
          >
            {{ formatMod(skill.mod) }}
          </div>
          <div>
            <h3 class="font-label-md text-label-md text-on-background leading-normal">
              {{ skill.name }}
              <span
                v-if="isLocked(skill.name)"
                class="ml-1 text-[10px] uppercase tracking-wider text-tertiary"
              >
                (Granted)
              </span>
            </h3>
            <span class="text-[11px] uppercase tracking-wider text-on-surface-variant">{{
              skill.stat.toUpperCase()
            }}</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <!-- Proficiency toggle -->
          <label
            class="relative flex items-center justify-center"
            :class="store.isEditing && !isSkillDisabled(skill.name) ? 'cursor-pointer' : 'cursor-default'"
            :title="isLocked(skill.name) ? 'Granted by class/background' : 'Proficiency'"
          >
            <input
              type="checkbox"
              class="sr-only skill-checkbox"
              :checked="skill.proficient"
              @change="toggleProficiency(skill.name)"
              :disabled="!store.isEditing || isSkillDisabled(skill.name)"
            />
            <div
              class="w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center"
              :class="[
                skill.proficient
                  ? 'border-tertiary bg-tertiary'
                  : 'border-outline-variant bg-surface',
                store.isEditing && !skill.proficient && !isSkillDisabled(skill.name)
                  ? 'group-hover:border-tertiary/50'
                  : '',
              ]"
            >
              <svg
                v-if="skill.proficient"
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