/**
 * Turns authoring input (llm-character-schema shape) into a complete
 * CharacterData using the same pure pipeline the app runs on load, and
 * validates it against the schema and the creation rules.
 */
import authoringSchema from '../../public/llm-character-schema.json'
import { createBlankCharacter } from '@/domain/characterService'
import { validateCreationRules } from '@/domain/creationRules'
import { getEffectiveLevel } from '@/domain/rulesService'
import { computeSpellSlots } from '@/domain/spellSlotService'
import {
  applyAllChanges,
  applyStartingEquipment,
  migrateCharacterData,
} from '@/utils/characterMutations'
import { getClassBundle, getBackgroundEquipment, getTrinketList } from '@/utils/equipmentResolver'
import { validateAgainstSchema } from '@/utils/validation'
import type { CharacterData } from '@/types/character'
import type { StartingEquipmentState } from '@/types/equipment'

export interface StartingEquipmentInput {
  classOption: 'A' | 'B' | 'C'
  backgroundOption: 'A' | 'B'
  /** Picks for the class bundle's `choices`, by index into that array. */
  classChoices?: Array<{ choiceIndex: number; itemId: string }>
  trinket?: string
}

/** Authoring schema as exposed to MCP clients (no $schema/$id keywords). */
export const toolInputSchema: Record<string, unknown> = Object.fromEntries(
  Object.entries(authoringSchema).filter(([key]) => key !== '$schema' && key !== '$id'),
)

function resolveEquipment(
  char: Pick<CharacterData, 'class' | 'background'>,
  input: StartingEquipmentInput,
): { state?: StartingEquipmentState; errors: string[] } {
  const errors: string[] = []
  const bundle = char.class ? getClassBundle(char.class, input.classOption) : null
  if (!bundle)
    return { errors: [`No class equipment option ${input.classOption} for ${char.class}.`] }
  const bgEq = char.background ? getBackgroundEquipment(char.background) : null
  if (!bgEq) errors.push(`No background equipment for ${char.background}.`)

  const choices = bundle.choices ?? []
  const picked = new Map((input.classChoices ?? []).map((c) => [c.choiceIndex, c.itemId]))
  const resolved: StartingEquipmentState['resolvedClassChoices'] = []
  if (input.classOption !== 'C') {
    choices.forEach((choice, i) => {
      const itemId = picked.get(i)
      const option = choice.options.find((o) => o.itemId === itemId)
      if (!option) {
        errors.push(
          `classChoices needs an item for choice ${i}: ${choice.options.map((o) => o.itemId).join(' | ')}.`,
        )
      } else
        resolved.push({
          choiceIndex: i,
          selectedItemId: option.itemId,
          selectedQuantity: option.quantity,
        })
    })
  }
  if (bgEq?.trinket && input.backgroundOption === 'A' && input.trinket) {
    if (!getTrinketList().some((t) => t.id === input.trinket))
      errors.push(`Unknown trinket "${input.trinket}".`)
  }
  return {
    errors,
    state: {
      classOption: input.classOption,
      backgroundOption: input.backgroundOption,
      resolvedClassChoices: resolved,
      selectedTrinket: input.trinket ?? null,
    },
  }
}

export interface BuildResult {
  errors: string[]
  character?: CharacterData
  summary?: Record<string, unknown>
}

export function buildCharacter(input: unknown, equipment?: StartingEquipmentInput): BuildResult {
  const schemaResult = validateAgainstSchema(authoringSchema as object, input)
  if (!schemaResult.valid) return { errors: schemaResult.errors }

  const merged = { ...createBlankCharacter(), ...(input as Record<string, unknown>) }
  let char = migrateCharacterData(merged)
  const ruleErrors = validateCreationRules(char)
  const eq = equipment
    ? resolveEquipment(char, equipment)
    : { errors: [] as string[], state: undefined }
  const errors = [...ruleErrors, ...eq.errors]
  if (errors.length) return { errors }

  char = applyAllChanges(char)
  if (eq.state) char = applyStartingEquipment(char, eq.state)
  char = applyAllChanges(char)
  char.combat.hp_current = char.combat.hp_max
  return { errors: [], character: char, summary: summarize(char) }
}

function summarize(c: CharacterData): Record<string, unknown> {
  return {
    name: c.name,
    class: c.class,
    species: c.species,
    subChoice: c.subChoice ?? null,
    background: c.background,
    renownTier: c.renownTier,
    effectiveLevel: getEffectiveLevel(c.renownTier || 1),
    abilityScores: c.abilityScores,
    proficiencyBonus: c.profBonus,
    hp: c.combat.hp_max,
    ac: c.combat.ac,
    skills: c.proficiencies.skills,
    savingThrows: c.proficiencies.savingThrows,
    gold: c.gold,
    spellSlots: computeSpellSlots(c.features, getEffectiveLevel(c.renownTier || 1)),
    features: c.features.map((f) => f.title),
  }
}
