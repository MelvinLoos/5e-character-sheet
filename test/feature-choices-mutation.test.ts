import { describe, it, expect } from 'vitest'
import {
  migrateCharacterData,
  applyFeatureChoices,
  applyAllChanges,
} from '@/utils/characterMutations'
import { createBlankCharacter } from '@/domain'
import type { CharacterData, CharacterFeature } from '@/types/character'

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
// migrateCharacterData — tolerates missing featureChoices
// ---------------------------------------------------------------------------

describe('migrateCharacterData — featureChoices tolerance', () => {
  it('defaults missing featureChoices to an empty object', () => {
    const result = migrateCharacterData({ name: 'OldChar' })
    expect(result.featureChoices).toEqual({})
  })

  it('preserves existing featureChoices', () => {
    const data = {
      name: 'Fighter',
      featureChoices: { 'fighting-style': ['defense'] },
    }
    const result = migrateCharacterData(data)
    expect(result.featureChoices).toEqual({ 'fighting-style': ['defense'] })
  })

  it('does not throw when featureChoices is null', () => {
    const data = {
      name: 'NullChar',
      featureChoices: null,
    }
    const result = migrateCharacterData(data)
    expect(result.featureChoices).toEqual({})
  })
})

// ---------------------------------------------------------------------------
// applyFeatureChoices
// ---------------------------------------------------------------------------

describe('applyFeatureChoices', () => {
  it('does nothing for null class', () => {
    const char = makeChar({ class: null, features: [] })
    const result = applyFeatureChoices(char)
    expect(result).toEqual(char)
  })

  it('does nothing for class with no featureChoices', () => {
    const char = makeChar({
      class: 'Barbarian',
      features: [],
    })
    const result = applyFeatureChoices(char)
    expect(result.features).toEqual(char.features)
  })

  it('does nothing for class with featureChoices but no selections', () => {
    const char = makeChar({
      class: 'Fighter',
      features: [],
      featureChoices: {},
    })
    const result = applyFeatureChoices(char)
    expect(
      result.features.some((f) =>
        f.title.startsWith('Fighting Style:'),
      ),
    ).toBe(false)
  })

  it('appends Fighting Style: Defense trait when selected', () => {
    const char = makeChar({
      class: 'Fighter',
      features: [],
      featureChoices: { 'fighting-style': ['defense'] },
    })
    const result = applyFeatureChoices(char)
    expect(
      result.features.some((f) => f.title === 'Fighting Style: Defense'),
    ).toBe(true)
    const trait = result.features.find(
      (f) => f.title === 'Fighting Style: Defense',
    )
    expect(trait?.desc).toContain('+1 bonus to AC')
  })

  it('appends Fighting Style: Dueling trait when selected', () => {
    const char = makeChar({
      class: 'Fighter',
      features: [],
      featureChoices: { 'fighting-style': ['dueling'] },
    })
    const result = applyFeatureChoices(char)
    expect(
      result.features.some((f) => f.title === 'Fighting Style: Dueling'),
    ).toBe(true)
  })

  it('appends multiple fighting style traits', () => {
    const char = makeChar({
      class: 'Fighter',
      features: [],
      featureChoices: { 'fighting-style': ['defense', 'dueling'] },
    })
    const result = applyFeatureChoices(char)
    expect(
      result.features.some((f) => f.title === 'Fighting Style: Defense'),
    ).toBe(true)
    expect(
      result.features.some((f) => f.title === 'Fighting Style: Dueling'),
    ).toBe(true)
  })

  it('removes old choice traits when selection changes', () => {
    const char = makeChar({
      class: 'Fighter',
      features: [
        {
          title: 'Fighting Style: Defense',
          desc: 'Old defense',
          key: false,
        } as CharacterFeature,
      ],
      featureChoices: { 'fighting-style': ['dueling'] },
    })
    const result = applyFeatureChoices(char)
    expect(
      result.features.some((f) => f.title === 'Fighting Style: Defense'),
    ).toBe(false)
    expect(
      result.features.some((f) => f.title === 'Fighting Style: Dueling'),
    ).toBe(true)
  })

  it('preserves non-choice features when applying', () => {
    const char = makeChar({
      class: 'Fighter',
      features: [
        {
          title: 'Second Wind',
          desc: '',
          key: true,
        } as CharacterFeature,
      ],
      featureChoices: { 'fighting-style': ['defense'] },
    })
    const result = applyFeatureChoices(char)
    expect(
      result.features.some((f) => f.title === 'Second Wind'),
    ).toBe(true)
    expect(
      result.features.some((f) => f.title === 'Fighting Style: Defense'),
    ).toBe(true)
  })

  it('cleans up choice traits when featureChoices is cleared', () => {
    const char = makeChar({
      class: 'Fighter',
      features: [
        {
          title: 'Fighting Style: Defense',
          desc: '',
          key: false,
        } as CharacterFeature,
      ],
      featureChoices: {},
    })
    const result = applyFeatureChoices(char)
    expect(
      result.features.some((f) => f.title === 'Fighting Style: Defense'),
    ).toBe(false)
  })

  it('ignores unknown option IDs gracefully', () => {
    const char = makeChar({
      class: 'Fighter',
      features: [],
      featureChoices: { 'fighting-style': ['nonexistent-option'] },
    })
    const result = applyFeatureChoices(char)
    expect(
      result.features.some((f) =>
        f.title.startsWith('Fighting Style:'),
      ),
    ).toBe(false)
  })

  it('handles undefined featureChoices on character', () => {
    const char: Record<string, unknown> = {
      ...makeChar({
        class: 'Fighter',
        features: [],
      }),
    }
    delete char.featureChoices
    const result = applyFeatureChoices(char as unknown as CharacterData)
    expect(result.features.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// applyAllChanges — pipeline includes applyFeatureChoices
// ---------------------------------------------------------------------------

describe('applyAllChanges — featureChoices pipeline', () => {
  it('applies feature choices as part of full recalculate', () => {
    const char = makeChar({
      class: 'Fighter',
      species: 'Human',
      background: 'Acolyte',
      backgroundBonusSelections: { plusTwo: 'str', plusOne: 'dex' },
      features: [],
      proficiencies: { savingThrows: [], skills: [] },
      featureChoices: { 'fighting-style': ['defense'] },
    })
    const result = applyAllChanges(char)
    expect(
      result.features.some((f) => f.title === 'Fighting Style: Defense'),
    ).toBe(true)
    expect(
      result.features.some((f) => f.title === 'Second Wind'),
    ).toBe(true)
  })

  it('handles class switch clearing old feature choice traits', () => {
    const char = makeChar({
      class: 'Barbarian',
      species: 'Human',
      background: 'Acolyte',
      features: [
        {
          title: 'Fighting Style: Defense',
          desc: '',
          key: false,
        } as CharacterFeature,
      ],
      featureChoices: { 'fighting-style': ['defense'] },
    })
    const result = applyAllChanges(char)
    expect(
      result.features.some((f) => f.title === 'Fighting Style: Defense'),
    ).toBe(false)
  })
})
