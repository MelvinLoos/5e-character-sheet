import { logger } from '../utils/logger'
import { validateAgainstSchema } from '../utils/validation'

// The sparse *input* schema (used as documentation / AI authoring reference).
let _schema: object | null = null
// The comprehensive *round-trip* schema (CharacterData) used to validate
// imported characters and exported files.
let _characterSchema: object | null = null

export async function loadSchema(): Promise<object | null> {
  try {
    const response = await fetch('/schema.json')
    if (!response.ok) throw new Error('Network response was not ok for schema.json')
    _schema = await response.json()
    return _schema
  } catch (e) {
    logger.error('Error loading schema.json:', e)
    return null
  }
}

export function getSchema(): object | null {
  return _schema
}

/**
 * Loads the full character schema describing the persisted CharacterData shape.
 * This is the schema used to validate a character imported from a previously
 * exported JSON file, because it accepts derived fields and `renownTier`
 * (whereas schema.json expects the sparse `level` input shape).
 */
export async function loadCharacterSchema(): Promise<object | null> {
  try {
    const response = await fetch('/character-schema.json')
    if (!response.ok) throw new Error('Network response was not ok for character-schema.json')
    _characterSchema = await response.json()
    return _characterSchema
  } catch (e) {
    logger.error('Error loading character-schema.json:', e)
    return null
  }
}

export function getCharacterSchema(): object | null {
  return _characterSchema
}

export function validateCharacterData(data: unknown): { valid: boolean; errors: string[] } {
  // The sparse input schema is used to validate AI-generated authoring payloads.
  if (!_schema) {
    logger.warn('Character schema not loaded, skipping validation.')
    return { valid: true, errors: [] }
  }
  return validateAgainstSchema(_schema, data)
}

/**
 * Validates a character being imported from a previously exported file.
 * Uses the full round-trip `character-schema.json` (which accepts `renownTier`
 * and derived fields), falling back to the input schema if it failed to load.
 */
export function validateImportedCharacter(data: unknown): { valid: boolean; errors: string[] } {
  const schema = _characterSchema ?? _schema
  if (!schema) {
    logger.warn('Character schema not loaded, skipping validation.')
    return { valid: true, errors: [] }
  }
  return validateAgainstSchema(schema, data)
}
