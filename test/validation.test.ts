import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { validateAgainstSchema } from '../src/utils/validation'

// Load the same schema the app ships in /public so the test exercises the
// real validation rules (including the ajv-errors `errorMessage` keywords).
// Vitest runs with the repo root as cwd (see vitest.config.ts).
const schemaPath = resolve(process.cwd(), 'public/schema.json')
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8')) as object

function validCharacter() {
  return {
    name: 'Test Hero',
    class: 'Fighter',
    level: 3,
    species: 'Human',
    background: 'Soldier',
    pointBuyBaseScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    backgroundBonusSelections: { plusTwo: 'str', plusOne: 'con' },
    personality: {
      traits: 'Brave and determined',
      ideal: 'Protect the innocent',
      bond: 'My squad',
      flaw: 'Can be reckless',
    },
  }
}

describe('validateAgainstSchema', () => {
  it('accepts a well-formed character', () => {
    const { valid, errors } = validateAgainstSchema(schema, validCharacter())
    expect(valid).toBe(true)
    expect(errors).toEqual([])
  })

  it('reports a custom errorMessage for missing required fields', () => {
    // Simulates an AI-generated character that dropped required top-level keys.
    const broken = validCharacter() as Record<string, unknown>
    delete broken.name
    delete broken.class

    const { valid, errors } = validateAgainstSchema(schema, broken)
    expect(valid).toBe(false)
    expect(errors).toContain('Character name is required.')
    expect(errors).toContain('Class is required.')
  })

  it('reports custom errorMessage for out-of-range ability scores', () => {
    const broken = validCharacter()
    broken.pointBuyBaseScores.str = 99 // above the allowed 8-15 range

    const { valid, errors } = validateAgainstSchema(schema, broken)
    expect(valid).toBe(false)
    expect(errors).toContain('Strength score must be between 8 and 15.')
  })

  it('reports an invalid level', () => {
    const broken = validCharacter()
    broken.level = 42

    const { valid, errors } = validateAgainstSchema(schema, broken)
    expect(valid).toBe(false)
    expect(errors).toContain('Level must be a number between 1 and 20.')
  })

  it('de-duplicates repeated error messages', () => {
    const { errors } = validateAgainstSchema(schema, {})
    // Every message should be unique after de-duplication.
    expect(new Set(errors).size).toBe(errors.length)
    expect(errors.length).toBeGreaterThan(0)
  })
})
