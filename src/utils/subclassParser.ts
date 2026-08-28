/**
 * Parser for imported subclass JSON files.
 *
 * Uses basic JavaScript runtime type checks (no external validation library)
 * to verify the structure matches public/subclass-schema.json before accepting
 * data into the rules store.
 */

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

function parseFeature(value: unknown, subclassName: string): SubclassFeature {
  if (!isObject(value)) {
    throw new Error(`Feature in subclass "${subclassName}" must be an object`)
  }

  const name = requireString(value.name, 'name', `Feature in subclass "${subclassName}"`)

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

  const subclasses: SubclassImport[] = []

  for (const item of rawSubclasses) {
    if (!isObject(item)) {
      throw new Error('Each subclass entry must be an object')
    }

    const name = requireString(item.name, 'name', 'Subclass')
    const parentClass = requireString(item.parentClass, 'parentClass', `Subclass "${name}"`)

    if (!Array.isArray(item.features) || item.features.length === 0) {
      throw new Error(`Subclass "${name}" must have a non-empty "features" array`)
    }

    const features = item.features.map((feature) => parseFeature(feature, name))

    const subclass: SubclassImport = {
      name,
      parentClass,
      features,
    }

    if (item.description !== undefined) {
      subclass.description = requireString(item.description, 'description', `Subclass "${name}"`)
    }

    subclasses.push(subclass)
  }

  if (subclasses.length === 0) {
    throw new Error('No valid subclasses found in file')
  }

  return subclasses
}
