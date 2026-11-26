/**
 * creationRules — Pure character-creation legality rules.
 *
 * These rules used to live only inside Vue/Pinia code (point-buy budget in the
 * progression store, background bonus filtering in AbilityScores.vue, class
 * skill limits in useSkills, feature-choice prerequisites in the character
 * store). They are collected here, free of Vue and browser dependencies, so
 * the UI and the MCP server enforce exactly the same rules.
 *
 * Every validator returns a list of human-readable error strings; an empty
 * list means the input is legal.
 */
import * as DND_RULES from '@/data/rules'
import { pointBuyCosts } from './characterService'
import { getEffectiveLevel } from './rulesService'
import { eligibleFeatureChoices, effectiveMaxCountForChoice } from '@/utils/featureChoiceRules'
import type { CharacterData } from '@/types/character'
import type { FeatureChoiceOption } from '@/types/rules'

export const POINT_BUY_BUDGET = 27
export const POINT_BUY_MIN = 8
export const POINT_BUY_MAX = 15

const ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const

/** Lowercase and strip spaces: 'Sleight of Hand' -> 'sleightofhand'. */
export function normalizeSkillName(name: string): string {
  return name.toLowerCase().replace(/ /g, '')
}

/** Total point-buy cost of a set of base scores. Unknown scores cost 0. */
export function pointBuyCostTotal(base: Record<string, number>): number {
  return Object.values(base).reduce((sum, score) => sum + (pointBuyCosts[score] ?? 0), 0)
}

/** Point cost of raising a base score by one, or null when already at the maximum. */
export function pointBuyNextCost(score: number): number | null {
  if (score >= POINT_BUY_MAX) return null
  return (pointBuyCosts[score + 1] ?? 0) - (pointBuyCosts[score] ?? 0)
}

/** Background bonus (+2, +1 or 0) a given ability receives from the chosen selections. */
export function backgroundBonusFor(
  ability: string,
  selections: { plusTwo?: string | null; plusOne?: string | null } | undefined | null,
): number {
  if (selections?.plusTwo === ability) return 2
  if (selections?.plusOne === ability) return 1
  return 0
}

export function validatePointBuy(base: Record<string, number> | undefined | null): string[] {
  if (!base) return ['pointBuyBaseScores is missing.']
  const errors: string[] = []
  for (const key of ABILITY_KEYS) {
    const score = base[key]
    if (!Number.isInteger(score) || score < POINT_BUY_MIN || score > POINT_BUY_MAX) {
      errors.push(
        `Base ${key} must be an integer from ${POINT_BUY_MIN} to ${POINT_BUY_MAX} (got ${score}).`,
      )
    }
  }
  if (errors.length) return errors
  const cost = pointBuyCostTotal(base)
  if (cost > POINT_BUY_BUDGET) {
    errors.push(`Point buy costs ${cost} points; the budget is ${POINT_BUY_BUDGET}.`)
  }
  return errors
}

export function validateBackgroundBonuses(
  background: string | null | undefined,
  selections: { plusTwo?: string | null; plusOne?: string | null } | undefined | null,
): string[] {
  if (!background || !DND_RULES.BACKGROUNDS[background]) {
    return [`Unknown background: ${background ?? '(none)'}.`]
  }
  const allowed: string[] = DND_RULES.BACKGROUNDS[background].abilityScoreIncrease || []
  const { plusTwo, plusOne } = selections ?? {}
  const errors: string[] = []
  if (!plusTwo || !plusOne) {
    return ['backgroundBonusSelections needs both plusTwo and plusOne.']
  }
  if (plusTwo === plusOne) errors.push('plusTwo and plusOne must be different abilities.')
  if (!allowed.includes(plusTwo)) {
    errors.push(`${background} does not offer +2 to ${plusTwo}. Options: ${allowed.join(', ')}.`)
  }
  if (!allowed.includes(plusOne)) {
    errors.push(`${background} does not offer +1 to ${plusOne}. Options: ${allowed.join(', ')}.`)
  }
  return errors
}

/** Skills granted automatically by the character's class and background. */
export function lockedSkillsFor(
  className: string | null | undefined,
  background: string | null | undefined,
): string[] {
  const locked = new Set<string>()
  const bg = background ? DND_RULES.BACKGROUNDS[background] : undefined
  for (const skill of bg?.skills || []) locked.add(normalizeSkillName(skill))
  const cls = className ? DND_RULES.CLASSES[className] : undefined
  for (const skill of cls?.fixedSkills || []) locked.add(normalizeSkillName(skill))
  return Array.from(locked)
}

/** Class skill picks the player has made themselves (not granted by class/background). */
export function chosenSkills(
  skills: string[],
  className: string | null | undefined,
  background: string | null | undefined,
): string[] {
  const locked = new Set(lockedSkillsFor(className, background))
  return skills.filter((s) => !locked.has(s))
}

export function validateClassSkillChoices(
  character: Pick<CharacterData, 'class' | 'background' | 'proficiencies'>,
): string[] {
  const options = character.class ? DND_RULES.CLASSES[character.class]?.skillChoices : undefined
  const chosen = chosenSkills(
    character.proficiencies?.skills ?? [],
    character.class,
    character.background,
  )
  if (!options) return chosen.length ? [`${character.class} has no skill choices.`] : []
  const errors: string[] = []
  if (chosen.length > options.count) {
    errors.push(`${character.class} may choose ${options.count} skills; ${chosen.length} chosen.`)
  }
  if (options.from !== 'any') {
    const allowed = new Set(options.from.map(normalizeSkillName))
    for (const skill of chosen) {
      if (!allowed.has(skill)) errors.push(`${skill} is not a ${character.class} skill option.`)
    }
  }
  return errors
}

export function validateSubChoice(
  species: string | null | undefined,
  subChoice: string | null | undefined,
): string[] {
  const subChoices = species ? DND_RULES.SPECIES[species]?.subChoices : undefined
  if (!subChoices) return subChoice ? [`${species} has no sub-choices.`] : []
  if (!subChoice)
    return [`${species} requires a subChoice: ${subChoices.map((s) => s.id).join(', ')}.`]
  if (!subChoices.some((s) => s.id === subChoice)) {
    return [
      `Unknown ${species} subChoice "${subChoice}". Options: ${subChoices.map((s) => s.id).join(', ')}.`,
    ]
  }
  return []
}

/**
 * Whether a feature-choice option's prerequisite (format "Class:level:N") is
 * met. Prerequisites in any other format are not enforced, as in the UI.
 */
export function meetsOptionPrerequisite(
  option: Pick<FeatureChoiceOption, 'prerequisite'>,
  className: string,
  level: number,
): boolean {
  if (!option.prerequisite) return true
  const parts = option.prerequisite.split(':')
  if (parts.length >= 3 && parts[0] === className && parts[1] === 'level') {
    const required = parseInt(parts[2] ?? '', 10)
    if (!isNaN(required) && level < required) return false
  }
  return true
}

export function validateFeatureChoices(
  character: Pick<CharacterData, 'class' | 'renownTier' | 'featureChoices'>,
): string[] {
  const choices = character.featureChoices ?? {}
  if (!character.class) return []
  const tier = character.renownTier || 1
  const level = getEffectiveLevel(tier)
  const eligible = eligibleFeatureChoices(character.class, tier)
  const errors: string[] = []
  for (const [choiceId, optionIds] of Object.entries(choices)) {
    const choice = eligible.find((c) => c.id === choiceId)
    if (!choice) {
      errors.push(
        `Feature choice "${choiceId}" is not available to a tier ${tier} ${character.class}.`,
      )
      continue
    }
    const max = effectiveMaxCountForChoice(choice, tier)
    if (optionIds.length > max) {
      errors.push(
        `Feature choice "${choiceId}" allows ${max} option(s); ${optionIds.length} given.`,
      )
    }
    for (const optionId of optionIds) {
      const option = (choice.options ?? []).find((o) => o.id === optionId)
      if (!option) {
        errors.push(`"${optionId}" is not an option for feature choice "${choiceId}".`)
      } else if (!meetsOptionPrerequisite(option, character.class, level)) {
        errors.push(`"${optionId}" requires ${option.prerequisite}.`)
      }
    }
  }
  return errors
}

/** Run every creation rule against a character. */
export function validateCreationRules(character: CharacterData): string[] {
  return [
    ...validatePointBuy(character.pointBuyBaseScores),
    ...validateBackgroundBonuses(character.background, character.backgroundBonusSelections),
    ...validateClassSkillChoices(character),
    ...validateSubChoice(character.species, character.subChoice),
    ...validateFeatureChoices(character),
  ]
}

export type FeatureGroup = 'feat' | 'class' | 'species'

/**
 * Which list a character feature belongs to: Class Features, Species Traits
 * or Feats. Uses an explicit `featureType` when present, otherwise matches the
 * title against the rules catalog (auto-granted features carry no type).
 * Background features are feats (e.g. Alert, Magic Initiate).
 */
export function featureGroup(feature: { title: string; featureType?: string }): FeatureGroup {
  if (feature.featureType === 'Class Feature' || feature.featureType === 'Spellcasting') return 'class'
  if (feature.featureType === 'Species Trait') return 'species'
  if (feature.featureType === 'Feat' || feature.featureType === 'Background Feature') return 'feat'
  const t = feature.title
  for (const c of Object.values(DND_RULES.CLASSES)) {
    if (c.features.some((f) => f.title === t)) return 'class'
    for (const fc of c.featureChoices ?? []) {
      if ((fc.options ?? []).some((o) => o.traits.some((tr) => tr.title === t))) return 'class'
    }
  }
  if (Object.values(DND_RULES.CLASS_SPELLCASTING_FEATS).some((f) => f.title === t)) return 'class'
  for (const sp of Object.values(DND_RULES.SPECIES)) {
    if (sp.traits.some((f) => f.title === t)) return 'species'
    if ((sp.subChoices ?? []).some((sc) => sc.traits.some((f) => f.title === t))) return 'species'
  }
  return 'feat'
}
