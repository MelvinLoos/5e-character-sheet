/**
 * Parser for imported subclass JSON files.
 *
 * Uses basic JavaScript runtime type checks (no external validation library)
 * to verify the structure matches public/subclass-schema.json before accepting
 * data into the rules store.
 */

import { CLASSES } from '@/data/classes'
import { CLASS_SPELLCASTING_FEATS } from '@/data/classSpellcasting'
import { FEATS } from '@/data/feats'
import { SPECIES } from '@/data/species'
import { BACKGROUNDS } from '@/data/backgrounds'
import { SUBCLASS_CHOICE_IDS, subclassOptionId } from '@/domain/customSubclasses'
import type { SubclassImport, SubclassFeature } from '@/types/rules'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireString(value: unknown, field: string, context: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${context} must have a non-empty "${field}" string`)
  }
  return value.trim()
}

/** The CLASSES key for `name` (case-insensitive) when that class offers a subclass choice. */
function resolveParentClass(name: string, subclassName: string): string {
  const key = Object.keys(CLASSES).find((k) => k.toLowerCase() === name.toLowerCase())
  if (!key) {
    throw new Error(`Subclass "${subclassName}" has unknown parentClass "${name}"`)
  }
  if (!subclassChoiceOf(key)) {
    throw new Error(`Class "${key}" does not offer a subclass choice (subclass "${subclassName}")`)
  }
  return key
}

function subclassChoiceOf(className: string) {
  return CLASSES[className]?.featureChoices?.find((c) => SUBCLASS_CHOICE_IDS.includes(c.id))
}

let reservedTitles: Set<string> | null = null

/**
 * Titles of built-in features. Choice-granted traits are removed by title when
 * a class changes, so an imported feature reusing one would delete the
 * built-in feature from the sheet.
 */
function getReservedTitles(): Set<string> {
  if (reservedTitles) return reservedTitles
  const titles = new Set<string>()
  const add = (title?: string) => title && titles.add(title)
  for (const cls of Object.values(CLASSES)) {
    cls.features.forEach((f) => add(f.title))
    for (const fc of cls.featureChoices ?? []) {
      for (const o of fc.options ?? []) o.traits.forEach((t) => add(t.title))
    }
  }
  Object.values(CLASS_SPELLCASTING_FEATS).forEach((f) => add(f.title))
  FEATS.forEach((f) => add(f.title))
  for (const sp of Object.values(SPECIES)) {
    sp.traits.forEach((t) => add(t.title))
    for (const sc of sp.subChoices ?? []) sc.traits.forEach((t) => add(t.title))
  }
  Object.values(BACKGROUNDS).forEach((b) => add(b.feature?.title))
  reservedTitles = titles
  return titles
}

function parseFeature(value: unknown, subclassName: string): SubclassFeature {
  if (!isObject(value)) {
    throw new Error(`Feature in subclass "${subclassName}" must be an object`)
  }

  const name = requireString(value.name, 'name', `Feature in subclass "${subclassName}"`)

  if (getReservedTitles().has(name)) {
    throw new Error(
      `Feature "${name}" in subclass "${subclassName}" reuses the name of a built-in feature; choose a different name`,
    )
  }

  if (typeof value.level !== 'number' || !Number.isInteger(value.level) || value.level < 1 || value.level > 20) {
    throw new Error(
      `Feature "${name}" in subclass "${subclassName}" must have an integer "level" between 1 and 20`,
    )
  }

  const description = requireString(
    value.description,
    'description',
    `Feature "${name}" in subclass "${subclassName}"`,
  )

  return { name, level: value.level, description }
}

/**
 * Parse and validate a single subclass entry.
 *
 * Canonicalises `parentClass` to the rules-compendium class name and rejects
 * names that collide with a built-in subclass of that class.
 */
export function parseSubclass(item: unknown): SubclassImport {
  if (!isObject(item)) {
    throw new Error('Each subclass entry must be an object')
  }

  const name = requireString(item.name, 'name', 'Subclass')
  const rawParent = requireString(item.parentClass, 'parentClass', `Subclass "${name}"`)
  const parentClass = resolveParentClass(rawParent, name)

  const builtIn = subclassChoiceOf(parentClass)?.options ?? []
  if (builtIn.some((o) => o.label.toLowerCase() === name.toLowerCase())) {
    throw new Error(`Subclass "${name}" already exists for ${parentClass}`)
  }

  if (!Array.isArray(item.features) || item.features.length === 0) {
    throw new Error(`Subclass "${name}" must have a non-empty "features" array`)
  }

  const features = item.features.map((feature) => parseFeature(feature, name))

  const subclass: SubclassImport = { name, parentClass, features }

  if (item.description !== undefined) {
    subclass.description = requireString(item.description, 'description', `Subclass "${name}"`)
  }

  return subclass
}

/**
 * Parse and validate an uploaded subclass JSON document.
 *
 * Accepts either a top-level array of subclasses or an object with a
 * `subclasses` array (matching public/subclass-schema.json).
 *
 * @param data - The raw JSON-parsed value from the uploaded file.
 * @returns A validated array of SubclassImport objects.
 * @throws Error with a descriptive message when validation fails.
 */
export function parseSubclassImport(data: unknown): SubclassImport[] {
  // Support both array format and object with 'subclasses' array
  const rawSubclasses = Array.isArray(data) ? data : isObject(data) ? data.subclasses : undefined

  if (!Array.isArray(rawSubclasses)) {
    throw new Error('File must contain a "subclasses" array')
  }

  const subclasses = rawSubclasses.map(parseSubclass)

  if (subclasses.length === 0) {
    throw new Error('No valid subclasses found in file')
  }

  const seen = new Set<string>()
  for (const s of subclasses) {
    const id = subclassOptionId(s)
    if (seen.has(id)) {
      throw new Error(`Duplicate subclass "${s.name}" for ${s.parentClass} in file`)
    }
    seen.add(id)
  }

  return subclasses
}
