import { CLASSES } from '@/data/classes'
import { TIER_TO_LEVEL } from '@/data/progressions'
import type { FeatureChoice, FeatureChoiceOption, RulesFeature, SubclassImport } from '@/types/rules'

/**
 * Registry that lets pure domain/util code see imported and guild subclasses.
 *
 * Static subclasses live in `CLASSES[x].featureChoices`. Imported ones are
 * merged into that same choice as extra options, so the picker, validation and
 * trait application all treat them identically. Domain code never imports
 * Pinia: the app registers a getter once (`setCustomSubclassSource`) and the
 * MCP server scopes a list per request (`withCustomSubclasses`).
 */

/** Feature-choice ids that are a class's subclass pick (Primal Path, Divine Domain, ...). */
export const SUBCLASS_CHOICE_IDS: readonly string[] = [
  'barbarian-subclass',
  'bard-college',
  'divine-domain',
  'druid-circle',
  'fighter-subclass',
  'monk-subclass',
  'paladin-oath',
  'ranger-conclave',
  'rogue-subclass',
  'sorcerer-origin',
  'warlock-subclass',
  'wizard-school',
]

export type SubclassSource = () => readonly SubclassImport[]

const NO_SUBCLASSES: SubclassSource = () => []
let source: SubclassSource = NO_SUBCLASSES

/** Register where custom subclasses come from (the rules store, in the app). */
export function setCustomSubclassSource(fn: SubclassSource): void {
  source = fn
}

/**
 * Run `fn` with `list` as the only custom subclasses, then restore the
 * previous source. `fn` must be synchronous so concurrent requests can't
 * interleave.
 */
export function withCustomSubclasses<T>(list: readonly SubclassImport[], fn: () => T): T {
  const previous = source
  source = () => list
  try {
    return fn()
  } finally {
    source = previous
  }
}

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Stable option id; independent of whether the subclass is local or guild-scoped. */
export function subclassOptionId(s: Pick<SubclassImport, 'name' | 'parentClass'>): string {
  return `custom-${slug(s.parentClass)}-${slug(s.name)}`
}

/** Highest tier whose level is at or below `level`; undefined below level 3. */
export function tierForLevel(level: number): number | undefined {
  let tier: number | undefined
  for (const [t, lvl] of Object.entries(TIER_TO_LEVEL)) {
    if (lvl <= level) tier = Number(t)
  }
  return tier
}

export function subclassToOption(s: SubclassImport): FeatureChoiceOption {
  const traits: RulesFeature[] = s.features.map((f) => ({
    title: f.name,
    desc: f.description,
    key: true,
    featureType: 'Class Feature',
    minLevel: f.level,
    minTier: tierForLevel(f.level),
  }))
  return { id: subclassOptionId(s), label: s.name, description: s.description, traits }
}

const memo = new WeakMap<readonly SubclassImport[], Map<string, FeatureChoice[]>>()

/** Custom subclass options for a class, deduped by id (later entries win). */
function customOptionsFor(className: string, list: readonly SubclassImport[]): FeatureChoiceOption[] {
  const byId = new Map<string, FeatureChoiceOption>()
  for (const s of list) {
    if (s.parentClass.toLowerCase() === className.toLowerCase()) {
      const option = subclassToOption(s)
      byId.set(option.id, option)
    }
  }
  return [...byId.values()]
}

/**
 * The class's feature choices with imported subclasses merged into its
 * subclass choice. Without custom subclasses this is the static list.
 */
export function classFeatureChoices(className: string | null | undefined): FeatureChoice[] {
  if (!className) return []
  const staticChoices = CLASSES[className]?.featureChoices ?? []
  const list = source()
  if (list.length === 0) return staticChoices

  let perClass = memo.get(list)
  if (!perClass) memo.set(list, (perClass = new Map()))
  const cached = perClass.get(className)
  if (cached) return cached

  const extra = customOptionsFor(className, list)
  const merged =
    extra.length === 0
      ? staticChoices
      : staticChoices.map((fc) =>
          SUBCLASS_CHOICE_IDS.includes(fc.id)
            ? { ...fc, options: [...(fc.options ?? []), ...extra] }
            : fc,
        )
  perClass.set(className, merged)
  return merged
}

/** Every class's feature choices (for building removal sets and group lookups). */
export function allClassFeatureChoices(): FeatureChoice[] {
  return Object.keys(CLASSES).flatMap((name) => classFeatureChoices(name))
}
