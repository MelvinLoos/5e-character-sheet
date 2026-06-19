import { logger } from '../utils/logger'
import { validateAgainstSchema } from '../utils/validation'

let _schema: object | null = null

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

export function validateCharacterData(data: unknown): { valid: boolean, errors: string[] } {
  if (!_schema) {
    logger.warn('Character schema not loaded, skipping validation.')
    return { valid: true, errors: [] }
  }
  return validateAgainstSchema(_schema, data)
}
