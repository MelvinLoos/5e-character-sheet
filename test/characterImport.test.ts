import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { useCharacterStore } from '@/stores/character'
import { validateAgainstSchema } from '@/utils/validation'
import { loadCharacterSchema, createBlankCharacter } from '@/domain'
import { STORAGE_KEYS } from '@/constants/storage-keys'
import type { CharacterData } from '@/types/character'

// Load the schemas the app ships in /public so the tests exercise the real rules.
const characterSchema = JSON.parse(
  readFileSync(resolve(process.cwd(), 'public/character-schema.json'), 'utf-8'),
) as object
const llmSchema = JSON.parse(
  readFileSync(resolve(process.cwd(), 'public/llm-character-schema.json'), 'utf-8'),
) as object
const elara = JSON.parse(
  readFileSync(resolve(process.cwd(), 'public/characters/Elara.json'), 'utf-8'),
) as Record<string, unknown>

/** A character shaped exactly like one produced by exportCharacter(). */
function exportedCharacter(overrides: Partial<CharacterData> = {}): CharacterData {
  return {
    ...createBlankCharacter(),
    name: 'Exported Hero',
    class: 'Fighter',
    species: 'Human',
    background: 'Soldier',
    renownTier: 2,
    renownMilestones: 1,
    pointBuyBaseScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    abilityScores: { str: 17, dex: 14, con: 14, int: 12, wis: 10, cha: 8 },
    backgroundBonusSelections: { plusTwo: 'str', plusOne: 'con' },
    features: [{ title: 'Second Wind', desc: 'Regain hit points as a bonus action.' }],
    ...overrides,
  } as CharacterData
}

// ---------------------------------------------------------------------------
// character-schema.json (full round-trip contract)
// ---------------------------------------------------------------------------

describe('character-schema.json', () => {
  it('accepts a character exported from the app (renownTier + derived fields)', () => {
    const { valid, errors } = validateAgainstSchema(characterSchema, exportedCharacter())
    expect(errors).toEqual([])
    expect(valid).toBe(true)
  })

  it('accepts the shipped Elara sample character', () => {
    const { valid, errors } = validateAgainstSchema(characterSchema, elara)
    expect(errors).toEqual([])
    expect(valid).toBe(true)
  })

  it('requires a name (custom error message)', () => {
    const broken = exportedCharacter() as unknown as Record<string, unknown>
    delete broken.name
    const { valid, errors } = validateAgainstSchema(characterSchema, broken)
    expect(valid).toBe(false)
    expect(errors).toContain('Character name is required.')
  })

  it('rejects an out-of-range damage die on an attack', () => {
    const broken = exportedCharacter({
      attacks: [{ name: 'Sword', dmgDie: 'nope', type: 'slashing' } as never],
    })
    const { valid } = validateAgainstSchema(characterSchema, broken)
    expect(valid).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// llm-character-schema.json (authoring contract)
// ---------------------------------------------------------------------------

describe('llm-character-schema.json', () => {
  function minimalLlmCharacter() {
    return {
      name: 'Aria Swift',
      class: 'Rogue',
      species: 'Halfling',
      background: 'Urchin',
      pointBuyBaseScores: { str: 8, dex: 15, con: 14, int: 12, wis: 10, cha: 13 },
      backgroundBonusSelections: { plusTwo: 'dex', plusOne: 'con' },
      personality: {
        traits: 'Quick with a joke.',
        ideal: 'Freedom.',
        bond: 'My old crew.',
        flaw: 'I never pass up a gamble.',
      },
      features: [{ title: 'Sneak Attack', desc: 'Deal extra damage once per turn.' }],
      spells: [],
    }
  }

  it('accepts a well-formed authoring payload', () => {
    const { valid, errors } = validateAgainstSchema(llmSchema, minimalLlmCharacter())
    expect(errors).toEqual([])
    expect(valid).toBe(true)
  })

  it('rejects an unknown class value', () => {
    const broken = { ...minimalLlmCharacter(), class: 'Dragonrider' }
    const { valid } = validateAgainstSchema(llmSchema, broken)
    expect(valid).toBe(false)
  })

  it('rejects an ability score outside the point-buy range', () => {
    const broken = minimalLlmCharacter()
    broken.pointBuyBaseScores.dex = 99
    const { valid } = validateAgainstSchema(llmSchema, broken)
    expect(valid).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Store importCharacter action
// ---------------------------------------------------------------------------

describe('character store importCharacter', () => {
  let store: ReturnType<typeof useCharacterStore>

  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    store = useCharacterStore()

    // Serve the real character schema so validation runs during import.
    global.fetch = vi.fn((url: string | URL) => {
      const path = String(url)
      if (path.endsWith('character-schema.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(characterSchema),
        })
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
    }) as unknown as typeof fetch
    await loadCharacterSchema()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('imports a JSON string produced by exportCharacter', () => {
    const json = JSON.stringify(exportedCharacter())
    const result = store.importCharacter(json)

    expect(result).toEqual({ valid: true, errors: [] })
    expect(store.currentCharacterData.name).toBe('Exported Hero')
    expect(store.currentCharacterData.class).toBe('Fighter')
    expect(store.currentCharacterData.renownTier).toBe(2)
  })

  it('imports a parsed object', () => {
    const result = store.importCharacter(exportedCharacter({ name: 'Object Hero' }))
    expect(result.valid).toBe(true)
    expect(store.currentCharacterData.name).toBe('Object Hero')
  })

  it('persists the imported character to the library', () => {
    store.importCharacter(exportedCharacter({ name: 'Saved Hero' }))
    const library = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHARACTER_LIBRARY) || '{}')
    const names = Object.values(library as Record<string, CharacterData[]>)
      .flat()
      .map((c) => c.name)
    expect(names).toContain('Saved Hero')
  })

  it('rejects malformed JSON', () => {
    const result = store.importCharacter('{ not json ]')
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toMatch(/Invalid JSON/)
  })

  it('rejects data that fails schema validation', () => {
    const result = store.importCharacter({ class: 'Fighter' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Character name is required.')
  })
})

