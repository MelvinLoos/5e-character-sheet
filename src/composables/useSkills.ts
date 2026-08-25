import { computed } from 'vue'
import { useCharacterStore } from '@/stores/character'
import { useProgressionStore } from '@/stores/progression'
import * as DND_RULES from '@/data/rules'
import type { ComputedRef } from 'vue'

/**
 * Normalize a skill name by lowercasing and removing all whitespace.
 * Pure utility function — no store dependency, fully testable in isolation.
 *
 * @example normalizeSkillName('Sleight of Hand') // 'sleightofhand'
 */
export function normalizeSkillName(name: string): string {
  return name.toLowerCase().replace(/ /g, '')
}

/**
 * Composable encapsulating D&D 5.5e skill proficiency logic.
 *
 * Extracts from SkillsList.vue:
 * - Skill name normalization
 * - Proficiency membership checks
 * - Modifier calculation (ability mod + proficiency bonus)
 * - Proficiency toggling
 * - Class/Background skill choice enforcement
 *
 * @param characterStore - Optional pre-existing character store instance.
 *   If omitted, calls useCharacterStore() internally.
 */
export function useSkills(characterStore?: ReturnType<typeof useCharacterStore>) {
  const store = characterStore ?? useCharacterStore()
  const progression = useProgressionStore()

  /**
   * Checks whether the given skill name is present in the character's
   * proficiency list after normalization.
   */
  const isProficient = computed<(_name: string) => boolean>(() => {
    return (name: string): boolean => {
      const normName = normalizeSkillName(name)
      return store.currentCharacterData.proficiencies.skills.includes(normName)
    }
  })

  /**
   * Calculates the total skill modifier for a given skill and associated
   * ability score key (e.g. 'dex' for Acrobatics).
   *
   * Returns: abilityMod + (isProficient ? profBonus : 0)
   */
  const skillMod = computed<(_name: string, _stat: string) => number>(() => {
    return (name: string, stat: string): number => {
      const baseMod = progression.abilityMods[stat] ?? 0
      const profBonus = isProficient.value(name) ? progression.profBonus : 0
      return baseMod + profBonus
    }
  })

  /**
   * Iterates over all D&D 5.5e skills (from DND_RULES.SKILLS) and returns
   * an array of computed skill data suitable for template rendering.
   *
   * Each entry: { name, stat, mod, proficient }
   */
  const allSkillMods: ComputedRef<
    Array<{ name: string; stat: string; mod: number; proficient: boolean }>
  > = computed(() => {
    return Object.entries(DND_RULES.SKILLS).map(([name, stat]) => ({
      name,
      stat,
      mod: skillMod.value(name, stat),
      proficient: isProficient.value(name),
    }))
  })

  /**
   * Fixed skill proficiencies granted automatically by the current
   * background and class. These skills cannot be toggled off by the player.
   */
  const lockedSkills: ComputedRef<string[]> = computed(() => {
    const locked = new Set<string>()

    // Background fixed skills
    if (store.currentCharacterData.background) {
      const bgData = DND_RULES.BACKGROUNDS[store.currentCharacterData.background]
      for (const skill of bgData?.skills || []) {
        locked.add(normalizeSkillName(skill))
      }
    }

    // Class fixed skills
    if (store.currentCharacterData.class) {
      const classData = DND_RULES.CLASSES[store.currentCharacterData.class]
      for (const skill of classData?.fixedSkills || []) {
        locked.add(normalizeSkillName(skill))
      }
    }

    return Array.from(locked)
  })

  /**
   * The current class's skill choice rule (e.g. { count: 2, from: [...] }).
   * Returns null if no class is selected or the class has no skill choices.
   */
  const classSkillOptions: ComputedRef<{ count: number; from: string[] | 'any' } | null> =
    computed(() => {
      if (!store.currentCharacterData.class) return null
      const classData = DND_RULES.CLASSES[store.currentCharacterData.class]
      return classData?.skillChoices ?? null
    })

  /**
   * The number of class skill choices the player still has remaining.
   * Computed as: max class choices - number of manually selected skills
   * that are NOT locked (i.e. skills the player chose themselves).
   */
  const remainingChoices: ComputedRef<number> = computed(() => {
    const options = classSkillOptions.value
    if (!options) return 0

    const locked = new Set(lockedSkills.value)
    const manuallySelected = store.currentCharacterData.proficiencies.skills.filter(
      (skill) => !locked.has(skill),
    )

    return Math.max(0, options.count - manuallySelected.length)
  })

  /**
   * Determines whether a skill's checkbox should be disabled in the UI.
   *
   * Returns true if:
   *  - The skill is a locked (auto-granted) skill.
   *  - No class is selected.
   *  - The skill is not in the class's `from` list (unless 'any').
   *  - The player has no remaining choices and the skill is not currently selected.
   */
  function isSkillDisabled(skillName: string): boolean {
    const normName = normalizeSkillName(skillName)

    // Locked skills (auto-granted) cannot be toggled
    if (lockedSkills.value.includes(normName)) return true

    // No class selected → no class skill choices available
    if (!store.currentCharacterData.class) return true

    const options = classSkillOptions.value
    if (!options) return true

    // Skill must be in the class's allowed list (unless 'any').
    // However, a skill that is already proficient (e.g. from a previous
    // class selection) must still be toggle-able so the player can
    // remove it — skip this check for skills the player already has.
    if (options.from !== 'any' && !options.from.some((s) => normalizeSkillName(s) === normName)) {
      if (!isProficient.value(skillName)) return true
    }

    // If no remaining choices and the skill isn't already selected, disable it
    if (remainingChoices.value <= 0 && !isProficient.value(skillName)) {
      return true
    }

    return false
  }

  /**
   * Toggles a skill's proficiency on/off. Only operates when
   * store.isEditing is true (non-editing mode is a no-op).
   *
   * Respects locked skills (cannot be toggled off) and the class
   * "choose N" limit (cannot add more than the allowed count).
   */
  function toggleProficiency(name: string): void {
    if (!store.isEditing) return

    const normName = normalizeSkillName(name)
    const skills = store.currentCharacterData.proficiencies.skills
    const index = skills.indexOf(normName)

    if (index === -1) {
      // Adding a new skill — respect locked skills and remaining choices
      if (isSkillDisabled(name)) return
      skills.push(normName)
    } else {
      // Removing a skill — locked skills cannot be removed
      if (lockedSkills.value.includes(normName)) return
      skills.splice(index, 1)
    }
  }

  return {
    isProficient,
    skillMod,
    allSkillMods,
    toggleProficiency,
    lockedSkills,
    classSkillOptions,
    remainingChoices,
    isSkillDisabled,
  }
}