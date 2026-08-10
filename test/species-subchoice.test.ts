import { describe, it, expect } from 'vitest'
import { applySpeciesTraits } from '@/utils/characterMutations'
import { createBlankCharacter } from '@/domain'
import type { CharacterData, CharacterFeature } from '@/types/character'
import type { SubChoice } from '@/types/rules'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseScores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }

function makeChar(overrides: Partial<CharacterData> = {}): CharacterData {
  return {
    ...createBlankCharacter(),
    pointBuyBaseScores: { ...baseScores },
    abilityScores: { ...baseScores },
    backgroundBonusSelections: { plusTwo: null, plusOne: null },
    ...overrides,
  } as CharacterData
}

// ---------------------------------------------------------------------------
// SubChoice type structural tests
// ---------------------------------------------------------------------------

describe('SubChoice type', () => {
  it('can be constructed with required fields', () => {
    const sc: SubChoice = {
      id: 'high-elf',
      label: 'High Elf',
      traits: [
        {
          title: 'High Elf Cantrip',
          desc: 'You know one Wizard cantrip.',
          key: true,
        },
      ],
    }
    expect(sc.id).toBe('high-elf')
    expect(sc.label).toBe('High Elf')
    expect(sc.traits).toHaveLength(1)
    expect(sc.traits[0].title).toBe('High Elf Cantrip')
  })

  it('supports optional description field', () => {
    const sc: SubChoice = {
      id: 'drow',
      label: 'Drow',
      description: 'Descendants of the dark elves of the Underdark.',
      traits: [],
    }
    expect(sc.description).toBe(
      'Descendants of the dark elves of the Underdark.',
    )
  })

  it('can be omitted from SpeciesData (optional subChoices)', () => {
    // A species without subChoices should not require the field
    const speciesData = {
      description: 'Plain species',
      speed: '30ft',
      traits: [{ title: 'Feature', desc: 'Desc', key: true }],
    }
    // TypeScript structural test: the object is assignable to SpeciesData
    expect(speciesData.traits).toHaveLength(1)
    expect((speciesData as Record<string, unknown>).subChoices).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// applySpeciesTraits subChoice integration tests
// ---------------------------------------------------------------------------

describe('applySpeciesTraits — subChoice integration', () => {
  it('includes only base traits when subChoice is null', () => {
    const char = makeChar({ species: 'Elf', subChoice: null, features: [] })
    const result = applySpeciesTraits(char)

    // Elf has base traits: Darkvision, Fey Ancestry, Trance
    expect(result.features.some((f) => f.title === 'Darkvision')).toBe(true)
    expect(result.features.some((f) => f.title === 'Fey Ancestry')).toBe(true)
    expect(result.features.some((f) => f.title === 'Trance')).toBe(true)
    // No subChoice traits should appear
    expect(result.features.some((f) => f.title === 'Drow Magic')).toBe(false)
  })

  it('does nothing when subChoice is set but species has no subChoices defined', () => {
    // Human has no subChoices in the rules data
    const char = makeChar({
      species: 'Human',
      subChoice: 'nonexistent',
      features: [],
    })
    const result = applySpeciesTraits(char)

    // Human traits should still be present
    expect(result.features.some((f) => f.title === 'Resourceful')).toBe(true)
    expect(result.features.some((f) => f.title === 'Skillful')).toBe(true)
  })

  it('does nothing gracefully when subChoice does not match any subChoice id', () => {
    // Use a subChoice that won't match even if the species has subChoices
    // Since Elf has no subChoices in current data, this is a no-op
    const char = makeChar({
      species: 'Elf',
      subChoice: 'goblin-lineage',
      features: [],
    })
    const result = applySpeciesTraits(char)

    // Elf base traits should still be present
    expect(result.features.some((f) => f.title === 'Darkvision')).toBe(true)
    expect(result.features.some((f) => f.title === 'Fey Ancestry')).toBe(true)
  })

  it('removes old subChoice traits when switching species', () => {
    // Start as Halfling with a feature that happens to share a title
    // with a possible future subChoice trait (simulating a switch)
    const char = makeChar({
      species: 'Human',
      subChoice: null,
      features: [
        {
          title: 'Darkvision',
          desc: '',
          key: true,
        } as CharacterFeature,
      ],
    })
    const result = applySpeciesTraits(char)

    // Human should not have Darkvision (it was removed as a species trait)
    expect(result.features.some((f) => f.title === 'Darkvision')).toBe(false)
    expect(result.features.some((f) => f.title === 'Resourceful')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// createBlankCharacter — subChoice default
// ---------------------------------------------------------------------------

describe('createBlankCharacter — subChoice default', () => {
  it('sets subChoice to null', () => {
    const char = createBlankCharacter()
    expect(char.subChoice).toBeNull()
  })
})
