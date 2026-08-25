import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { setActivePinia, createPinia } from 'pinia'
import {
  migrateCharacterData,
  applyFeatureChoices,
  applyAllChanges,
} from '@/utils/characterMutations'
import { useCharacterStore } from '@/stores/character'
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

// ---------------------------------------------------------------------------
// Warlock — Eldritch Invocations tiers & cleanup
// ---------------------------------------------------------------------------

describe('applyAllChanges — Warlock invocations', () => {
  it('applies Warlock invocation traits at Tier 1', () => {
    const char = makeChar({
      class: 'Warlock',
      species: 'Human',
      background: 'Acolyte',
      renownTier: 1,
      features: [],
      proficiencies: { savingThrows: [], skills: [] },
      featureChoices: {
        'eldritch-invocations': ['armor-of-shadows', 'devils-sight'],
      },
    })
    const result = applyAllChanges(char)
    expect(
      result.features.some((f) => f.title === 'Armor of Shadows'),
    ).toBe(true)
    expect(
      result.features.some((f) => f.title === "Devil's Sight"),
    ).toBe(true)
    // Magical Cunning should be present as a class feature
    expect(
      result.features.some((f) => f.title === 'Magical Cunning'),
    ).toBe(true)
    // Contact Patron is always included (minTier filtering is a UI concern)
    expect(
      result.features.some((f) => f.title === 'Contact Patron'),
    ).toBe(true)
    // But it carries minTier: 2 for the UI to filter
    const contactPatron = result.features.find(
      (f) => f.title === 'Contact Patron',
    )
    expect(contactPatron?.minTier).toBe(2)
  })

  it('unlocks Contact Patron at Tier 2 via applyAllChanges', () => {
    const char = makeChar({
      class: 'Warlock',
      species: 'Human',
      background: 'Acolyte',
      renownTier: 2,
      features: [],
      proficiencies: { savingThrows: [], skills: [] },
      featureChoices: {
        'eldritch-invocations': ['armor-of-shadows'],
      },
    })
    const result = applyAllChanges(char)
    // Contact Patron should be present at Tier 2
    expect(
      result.features.some((f) => f.title === 'Contact Patron'),
    ).toBe(true)
  })

  it('allows 3 invocations at Tier 2 with scalesPerTier', () => {
    const char = makeChar({
      class: 'Warlock',
      species: 'Human',
      background: 'Acolyte',
      renownTier: 2,
      features: [],
      proficiencies: { savingThrows: [], skills: [] },
      featureChoices: {
        'eldritch-invocations': [
          'armor-of-shadows',
          'devils-sight',
          'eldritch-mind',
        ],
      },
    })
    const result = applyAllChanges(char)
    expect(
      result.features.filter((f) =>
        ['Armor of Shadows', "Devil's Sight", 'Eldritch Mind'].includes(
          f.title,
        ),
      ).length,
    ).toBe(3)
  })

  it('allows 4 invocations at Tier 3 with scalesPerTier', () => {
    const char = makeChar({
      class: 'Warlock',
      species: 'Human',
      background: 'Acolyte',
      renownTier: 3,
      features: [],
      proficiencies: { savingThrows: [], skills: [] },
      featureChoices: {
        'eldritch-invocations': [
          'armor-of-shadows',
          'devils-sight',
          'eldritch-mind',
          'fiendish-vigor',
        ],
      },
    })
    const result = applyAllChanges(char)
    const invocTitles = [
      'Armor of Shadows',
      "Devil's Sight",
      'Eldritch Mind',
      'Fiendish Vigor',
    ]
    expect(
      result.features.filter((f) => invocTitles.includes(f.title)).length,
    ).toBe(4)
  })

  it('cleans up invocation traits when switching from Warlock to Barbarian', () => {
    const char = makeChar({
      class: 'Barbarian',
      species: 'Human',
      background: 'Acolyte',
      renownTier: 1,
      features: [
        {
          title: 'Armor of Shadows',
          desc: '',
          key: true,
        } as CharacterFeature,
      ],
      proficiencies: { savingThrows: [], skills: [] },
      featureChoices: {
        'eldritch-invocations': ['armor-of-shadows'],
      },
    })
    const result = applyAllChanges(char)
    expect(
      result.features.some((f) => f.title === 'Armor of Shadows'),
    ).toBe(false)
  })

  it('does not include invocation traits when no invocations selected', () => {
    const char = makeChar({
      class: 'Warlock',
      species: 'Human',
      background: 'Acolyte',
      renownTier: 1,
      features: [],
      proficiencies: { savingThrows: [], skills: [] },
      featureChoices: {},
    })
    const result = applyAllChanges(char)
    expect(
      result.features.some((f) => f.title === 'Armor of Shadows'),
    ).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Store integration: applyFeatureChoice persists 2 invocations
// ---------------------------------------------------------------------------

describe('applyFeatureChoice store action — two invocations regression', () => {
  let store: ReturnType<typeof useCharacterStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCharacterStore()

    const blank = createBlankCharacter()
    store.currentCharacterData = {
      ...blank,
      name: 'Test Warlock',
      class: 'Warlock',
      renownTier: 1,
      species: 'Human',
      background: 'Acolyte',
      backgroundBonusSelections: { plusTwo: null, plusOne: null },
      pointBuyBaseScores: { ...baseScores },
      abilityScores: { ...baseScores },
      features: [],
      proficiencies: { savingThrows: [], skills: [] },
      featureChoices: {},
    } as CharacterData
  })

  it('persists two invocations when applyFeatureChoice is called with two IDs', () => {
    store.applyFeatureChoice('eldritch-invocations', [
      'armor-of-shadows',
      'devils-sight',
    ])

    const choices = store.currentCharacterData.featureChoices
    expect(choices).toBeDefined()
    const invocations = choices?.['eldritch-invocations']
    expect(invocations).toBeDefined()
    expect(invocations).toHaveLength(2)
    expect(invocations).toContain('armor-of-shadows')
    expect(invocations).toContain('devils-sight')
  })

  it('persists two invocations with Agonizing Blast (has prerequisite)', () => {
    store.applyFeatureChoice('eldritch-invocations', [
      'agonizing-blast',
      'armor-of-shadows',
    ])

    const choices = store.currentCharacterData.featureChoices
    const invocations = choices?.['eldritch-invocations']
    expect(invocations).toHaveLength(2)
    expect(invocations).toContain('agonizing-blast')
    expect(invocations).toContain('armor-of-shadows')
  })

  it('preserves featureChoices through applyAllChanges', () => {
    store.applyFeatureChoice('eldritch-invocations', [
      'armor-of-shadows',
      'devils-sight',
    ])
    store.recalculateAll()

    const choices = store.currentCharacterData.featureChoices
    const invocations = choices?.['eldritch-invocations']
    expect(invocations).toHaveLength(2)
  })
})
