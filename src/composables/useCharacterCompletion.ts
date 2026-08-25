import { computed } from 'vue'
import { useCharacterStore } from '@/stores/character'
import { useProgressionStore } from '@/stores/progression'
import { useSkills } from '@/composables/useSkills'
import {
  eligibleFeatureChoices,
  effectiveMaxCountForChoice,
} from '@/utils/featureChoiceRules'
import type { CharacterData } from '@/types/character'

/**
 * Completion badges surfaced on the navigation.
 *
 * A `count` badge renders a number (e.g. remaining ability points / skill
 * choices); an `alert` badge renders a single `!` (e.g. a class feature choice
 * or starting equipment still needs attention).
 */
export type CompletionBadge =
  | { type: 'count'; count: number; label: string }
  | { type: 'alert'; label: string }

/**
 * Total number of selections still owed across the character's eligible
 * feature choices (Fighting Style, Eldritch Invocations, …).
 */
function remainingFeatureSelections(char: CharacterData): number {
  const tier = char.renownTier ?? 1
  let remaining = 0
  for (const choice of eligibleFeatureChoices(char.class, tier)) {
    const selected = char.featureChoices?.[choice.id] ?? []
    remaining += Math.max(0, effectiveMaxCountForChoice(choice, tier) - selected.length)
  }
  return remaining
}

/**
 * Single source of truth for "what is still unfinished" during character
 * creation, keyed by route name (`identity`, `skills`, `feats`, `inventory`).
 */
export function useCharacterCompletion() {
  const character = useCharacterStore()
  const progression = useProgressionStore()
  const { remainingChoices } = useSkills()

  const badges = computed<Record<string, CompletionBadge>>(() => {
    const char = character.currentCharacterData
    if (!char) return {}

    const result: Record<string, CompletionBadge> = {}

    // Identity — unspent point-buy points
    const points = progression.pointBuyPointsRemaining
    if (points > 0) {
      result.identity = {
        type: 'count',
        count: points,
        label: `${points} ability point${points === 1 ? '' : 's'} remaining`,
      }
    }

    // Skills — remaining class skill choices
    const skills = remainingChoices.value
    if (char.class && skills > 0) {
      result.skills = {
        type: 'count',
        count: skills,
        label: `${skills} skill choice${skills === 1 ? '' : 's'} remaining`,
      }
    }

    // Feats — any eligible class feature choice still incomplete
    if (remainingFeatureSelections(char) > 0) {
      result.feats = { type: 'alert', label: 'Class feature choices remaining' }
    }

    // Inventory — starting equipment not chosen yet
    const noEquipment =
      (char.equippedGear?.length ?? 0) === 0 &&
      (char.consumables?.length ?? 0) === 0 &&
      (char.gold ?? 0) === 0
    if (char.class && char.background && noEquipment) {
      result.inventory = { type: 'alert', label: 'Choose starting equipment' }
    }

    return result
  })

  return { badges }
}