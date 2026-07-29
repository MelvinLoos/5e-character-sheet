import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '@/stores/character'
import { useRulesStore } from '@/stores/rulesStore'
import { createBlankCharacter } from '@/domain'
import { useSpellcasting, formatLevel, generateSpellId } from '@/composables/useSpellcasting'
import type { CharacterData, CharacterFeature, CharacterSpell } from '@/types/character'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTestCharacter(overrides: Partial<CharacterData> = {}): CharacterData {
  const baseScores = { str: 10, dex: 10, con: 10, int: 16, wis: 12, cha: 14 }

  return {
    ...createBlankCharacter(),
    pointBuyBaseScores: { ...baseScores },
    abilityScores: { ...baseScores },
    backgroundBonusSelections: { plusTwo: null, plusOne: null },
    class: 'Wizard',
    renownTier: 1,
    profBonus: 2,
    spells: [],
    features: [],
    spellcasting: { ability: 'int', slotsSpent: {} },
    ...overrides,
  } as unknown as CharacterData
}

/** Create a character with a full-caster feature (Wizard Spellcasting). */
function createWizardCharacter(): CharacterData {
  return createTestCharacter({
    features: [
      {
        title: 'Spellcasting (Wizard)',
        desc: 'You can cast wizard spells.',
        casterType: 'full',
        key: true,
      },
    ] as CharacterFeature[],
  })
}

/** Create a pure Fighter (no magic). */
function createFighterCharacter(): CharacterData {
  return createTestCharacter({
    class: 'Fighter',
    features: [
      { title: 'Second Wind', desc: '...', key: true, uses: { total: 1, per: 'Short Rest' } },
    ] as CharacterFeature[],
    spellcasting: null,
  })
}

/** Create a character with only a granted-spell feat (Magic Initiate). */
function createGrantedOnlyCharacter(): CharacterData {
  return createTestCharacter({
    class: null,
    features: [
      {
        title: 'Magic Initiate (Wizard)',
        desc: 'You learn two cantrips...',
        grantsSpells: true,
        grantedSpellLevels: [1],
        key: false,
      },
    ] as CharacterFeature[],
    spellcasting: null,
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('formatLevel (pure utility)', () => {
  it('returns "Cantrip" for level 0', () => {
    expect(formatLevel(0)).toBe('Cantrip')
  })
  it('returns "1st" for level 1', () => {
    expect(formatLevel(1)).toBe('1st')
  })
  it('returns "2nd" for level 2', () => {
    expect(formatLevel(2)).toBe('2nd')
  })
  it('returns "3rd" for level 3', () => {
    expect(formatLevel(3)).toBe('3rd')
  })
  it('returns "4th" for level 4', () => {
    expect(formatLevel(4)).toBe('4th')
  })
})

describe('generateSpellId (pure utility)', () => {
  it('produces unique non-empty strings', () => {
    const id1 = generateSpellId()
    const id2 = generateSpellId()
    expect(id1).toBeTruthy()
    expect(id2).toBeTruthy()
    expect(id1).not.toBe(id2)
  })
})

describe('useSpellcasting', () => {
  let characterStore: ReturnType<typeof useCharacterStore>
  let rulesStore: ReturnType<typeof useRulesStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    characterStore = useCharacterStore()
    rulesStore = useRulesStore()
    // Seed rules store with test spell data.
    // allSpells is a readonly getter backed by mutable state.spells.
    rulesStore.$patch({
      spells: [
        { name: 'Fireball', level: 3, desc: 'Big boom', classes: ['Wizard', 'Sorcerer'] },
        { name: 'Magic Missile', level: 1, desc: 'Auto-hit', classes: ['Wizard', 'Sorcerer'] },
        { name: 'Cure Wounds', level: 1, desc: 'Healing', classes: ['Cleric', 'Druid'] },
        { name: 'Eldritch Blast', level: 0, desc: 'Pew pew', classes: ['Warlock'] },
      ],
    })
  })

  // -----------------------------------------------------------------------
  // Caster Detection
  // -----------------------------------------------------------------------

  describe('hasSpellcasting', () => {
    it('returns true when a feature has casterType = "full"', () => {
      characterStore.currentCharacterData = createWizardCharacter()
      const { hasSpellcasting } = useSpellcasting(characterStore, rulesStore)
      expect(hasSpellcasting.value).toBe(true)
    })

    it('returns true when a feature has grantsSpells = true (no casterType)', () => {
      characterStore.currentCharacterData = createGrantedOnlyCharacter()
      const { hasSpellcasting } = useSpellcasting(characterStore, rulesStore)
      expect(hasSpellcasting.value).toBe(true)
    })

    it('returns false for a pure Fighter', () => {
      characterStore.currentCharacterData = createFighterCharacter()
      const { hasSpellcasting } = useSpellcasting(characterStore, rulesStore)
      expect(hasSpellcasting.value).toBe(false)
    })
  })

  describe('casterType', () => {
    it('returns "full" for Wizard features', () => {
      characterStore.currentCharacterData = createWizardCharacter()
      const { casterType } = useSpellcasting(characterStore, rulesStore)
      expect(casterType.value).toBe('full')
    })

    it('returns "granted" when features only grant spells (no class casterType)', () => {
      characterStore.currentCharacterData = createGrantedOnlyCharacter()
      const { casterType } = useSpellcasting(characterStore, rulesStore)
      expect(casterType.value).toBe('granted')
    })
  })

  // -----------------------------------------------------------------------
  // Slot Calculation
  // -----------------------------------------------------------------------

  describe('grantedSpellSlots', () => {
    it('builds { level1: 1 } for a 1st-level granted spell feature', () => {
      characterStore.currentCharacterData = createTestCharacter({
        features: [
          { title: 'Magic Initiate', desc: '', grantsSpells: true, grantedSpellLevels: [1], key: false },
        ] as CharacterFeature[],
        spellcasting: null,
      })
      const { grantedSpellSlots } = useSpellcasting(characterStore, rulesStore)
      expect(grantedSpellSlots.value).toEqual({ level1: 1 })
    })

    it('aggregates multiple granted features into { level1: 1, level2: 1 }', () => {
      characterStore.currentCharacterData = createTestCharacter({
        features: [
          { title: 'Magic Initiate', desc: '', grantsSpells: true, grantedSpellLevels: [1], key: false },
          { title: 'Fey Touched', desc: '', grantsSpells: true, grantedSpellLevels: [2], key: false },
        ] as CharacterFeature[],
        spellcasting: null,
      })
      const { grantedSpellSlots } = useSpellcasting(characterStore, rulesStore)
      expect(grantedSpellSlots.value).toEqual({ level1: 1, level2: 1 })
    })

    it('excludes cantrips (level 0)', () => {
      characterStore.currentCharacterData = createTestCharacter({
        features: [
          { title: 'Magic Initiate', desc: '', grantsSpells: true, grantedSpellLevels: [0, 1], key: false },
        ] as CharacterFeature[],
        spellcasting: null,
      })
      const { grantedSpellSlots } = useSpellcasting(characterStore, rulesStore)
      expect(grantedSpellSlots.value).toEqual({ level1: 1 })
      expect(grantedSpellSlots.value['level0']).toBeUndefined()
    })
  })

  describe('displaySpellSlots', () => {
    it('merges store class slots and granted slots', () => {
      // Simulate the store returning class-based slots
      // The actual store computed `spellSlots` depends on features + derivedLevel,
      // so we test the merge logic directly by setting state.
      characterStore.currentCharacterData = createTestCharacter({
        class: 'Wizard',
        features: [
          { title: 'Spellcasting (Wizard)', desc: '', casterType: 'full', key: true },
          { title: 'Magic Initiate', desc: '', grantsSpells: true, grantedSpellLevels: [1], key: false },
        ] as CharacterFeature[],
        spellcasting: { ability: 'int', slotsSpent: {} },
      })
      const { displaySpellSlots } = useSpellcasting(characterStore, rulesStore)

      // For a full caster with casterType='full', the store returns class slot progression.
      // The granted slots from Magic Initiate merge on top.
      const slots = displaySpellSlots.value
      // Should at minimum include the granted level1 slot
      expect(slots['level1']).toBeGreaterThanOrEqual(1)
    })
  })

  // -----------------------------------------------------------------------
  // Slot Tracking
  // -----------------------------------------------------------------------

  describe('getSpent / setSpent', () => {
    it('getSpent returns 0 for an unused spell level', () => {
      characterStore.currentCharacterData = createTestCharacter({
        spellcasting: { ability: 'int', slotsSpent: {} },
      })
      const { getSpent } = useSpellcasting(characterStore, rulesStore)
      expect(getSpent(1)).toBe(0)
    })

    it('setSpent clamps to maximum available slots', () => {
      characterStore.currentCharacterData = createTestCharacter({
        spellcasting: { ability: 'int', slotsSpent: { level1: 2 } },
        features: [
          { title: 'Spellcasting (Wizard)', desc: '', casterType: 'full', key: true },
        ] as CharacterFeature[],
      })
      const { setSpent, getSpent, displaySpellSlots } = useSpellcasting(characterStore, rulesStore)

      // The store will compute max for level1 based on full caster progression at level 3
      const max = displaySpellSlots.value['level1'] || 4 // should be 4 for level 3 full caster
      setSpent(1, 999) // try to overspend
      expect(getSpent(1)).toBe(max)
    })

    it('setSpent clamps to minimum 0', () => {
      characterStore.currentCharacterData = createTestCharacter({
        spellcasting: { ability: 'int', slotsSpent: { level1: 2 } },
      })
      const { setSpent, getSpent } = useSpellcasting(characterStore, rulesStore)

      setSpent(1, -5)
      expect(getSpent(1)).toBe(0)
    })
  })

  // -----------------------------------------------------------------------
  // Library Filtering
  // -----------------------------------------------------------------------

  describe('librarySpells', () => {
    it('excludes spells already on character spellbook', () => {
      characterStore.currentCharacterData = createTestCharacter({
        class: 'Wizard',
        spells: [{ id: '1', name: 'Fireball', level: 3, desc: '' }] as CharacterSpell[],
        features: [
          { title: 'Spellcasting (Wizard)', desc: '', casterType: 'full', key: true },
        ] as CharacterFeature[],
      })
      const { librarySpells } = useSpellcasting(characterStore, rulesStore)

      const names = librarySpells.value.map((s) => s.name)
      expect(names).not.toContain('Fireball')
      expect(names).toContain('Magic Missile')
    })

    it('filters by character class restrictions', () => {
      characterStore.currentCharacterData = createTestCharacter({
        class: 'Wizard',
        spells: [],
      } as Partial<CharacterData> as CharacterData)
      const { librarySpells } = useSpellcasting(characterStore, rulesStore)

      const names = librarySpells.value.map((s) => s.name)
      expect(names).toContain('Fireball')
      expect(names).toContain('Magic Missile')
      expect(names).not.toContain('Cure Wounds') // Cleric/Druid only
    })
  })
})