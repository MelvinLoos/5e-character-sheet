import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '@/stores/character'
import { useRulesStore } from '@/stores/rulesStore'
import { useProgressionStore } from '@/stores/progression'
import { createBlankCharacter } from '@/domain'
import { applyAllChanges, migrateCharacterData } from '@/utils/characterMutations'
import { useSpellcasting } from '@/composables/useSpellcasting'
import type { CharacterData, CharacterFeature } from '@/types/character'
import {
  CLASS_SPELLCASTING_FEATS,
  FEATS,
  SPELL_SLOT_PROGRESSION,
  getEffectiveLevel,
} from '@/data/rules'
import Elara from '../characters/Elara.json'

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
    class: null,
    renownTier: 1,
    profBonus: 2,
    spells: [],
    features: [],
    spellcasting: null,
    ...overrides,
  } as unknown as CharacterData
}

// ---------------------------------------------------------------------------
// Phase 1 TDD: Feat-based spellcasting tests
// ---------------------------------------------------------------------------

describe('feat-based spellcasting architecture', () => {
  let characterStore: ReturnType<typeof useCharacterStore>
  let rulesStore: ReturnType<typeof useRulesStore>
  let progressionStore: ReturnType<typeof useProgressionStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    characterStore = useCharacterStore()
    rulesStore = useRulesStore()
    progressionStore = useProgressionStore()
  })

  // -----------------------------------------------------------------------
  // Feat data definitions
  // -----------------------------------------------------------------------

  describe('spellcasting feat data', () => {
    it('exports CLASS_SPELLCASTING_FEATS for every spellcasting class', () => {
      const spellcastingClasses = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard']
      for (const className of spellcastingClasses) {
        expect(CLASS_SPELLCASTING_FEATS[className]).toBeDefined()
        expect(CLASS_SPELLCASTING_FEATS[className].casterType).not.toBe('none')
        expect(CLASS_SPELLCASTING_FEATS[className].casterType).toBeTruthy()
      }
    })

    it('exports a Magic Initiate feat that grants spells without a casterType', () => {
      const magicInitiate = FEATS.find((f) => f.title === 'Magic Initiate')
      expect(magicInitiate).toBeDefined()
      expect(magicInitiate?.grantsSpells).toBe(true)
      expect(magicInitiate?.grantedSpellLevels).toContain(1)
      expect(magicInitiate?.casterType).toBeFalsy()
    })
  })

  // -----------------------------------------------------------------------
  // Magic Initiate unlocks spellcasting without a class
  // -----------------------------------------------------------------------

  describe('Magic Initiate standalone spellcasting', () => {
    it('unlocks spellcasting when only Magic Initiate feat is present (no class)', () => {
      characterStore.currentCharacterData = createTestCharacter({
        class: null,
        features: [
          { title: 'Magic Initiate', desc: 'You learn spells.', grantsSpells: true, grantedSpellLevels: [0, 1], key: false },
        ] as CharacterFeature[],
      })

      const { hasSpellcasting, casterType, displaySpellSlots, maxSpellSlotLevel } = useSpellcasting(
        characterStore,
        rulesStore,
      )

      expect(hasSpellcasting.value).toBe(true)
      expect(casterType.value).toBe('granted')
      expect(displaySpellSlots.value).toEqual({ level1: 1 })
      expect(maxSpellSlotLevel.value).toBe(1)
    })

    it('allows a Fighter with Magic Initiate to access the spell library', () => {
      characterStore.currentCharacterData = createTestCharacter({
        class: 'Fighter',
        features: [
          { title: 'Second Wind', desc: '...', key: true },
          { title: 'Magic Initiate', desc: 'You learn spells.', grantsSpells: true, grantedSpellLevels: [0, 1], key: false },
        ] as CharacterFeature[],
      })

      const { hasSpellcasting } = useSpellcasting(characterStore, rulesStore)
      expect(hasSpellcasting.value).toBe(true)
    })
  })

  // -----------------------------------------------------------------------
  // Class auto-grants spellcasting feat
  // -----------------------------------------------------------------------

  describe('class auto-grants spellcasting feat', () => {
    it('grants Wizard Spellcasting feat when class is set to Wizard', () => {
      const char = createTestCharacter({ class: 'Wizard' })
      const result = applyAllChanges(char)

      const spellcastingFeat = result.features.find((f) => f.title === 'Wizard Spellcasting')
      expect(spellcastingFeat).toBeDefined()
      expect(spellcastingFeat?.casterType).toBe('full')

      const oldClassFeature = result.features.find(
        (f) => f.title === 'Spellcasting (Wizard)' && f.casterType,
      )
      expect(oldClassFeature).toBeUndefined()
    })

    it('grants Paladin Spellcasting feat (half caster) when class is set to Paladin', () => {
      const char = createTestCharacter({ class: 'Paladin' })
      const result = applyAllChanges(char)

      const spellcastingFeat = result.features.find((f) => f.title === 'Paladin Spellcasting')
      expect(spellcastingFeat).toBeDefined()
      expect(spellcastingFeat?.casterType).toBe('half')
    })

    it('grants Warlock Pact Magic feat (pact caster) when class is set to Warlock', () => {
      const char = createTestCharacter({ class: 'Warlock' })
      const result = applyAllChanges(char)

      const spellcastingFeat = result.features.find((f) => f.title === 'Warlock Pact Magic')
      expect(spellcastingFeat).toBeDefined()
      expect(spellcastingFeat?.casterType).toBe('pact')
    })

    it('does not grant a spellcasting feat to non-caster classes', () => {
      const char = createTestCharacter({ class: 'Fighter' })
      const result = applyAllChanges(char)

      const hasSpellcastingFeat = result.features.some((f) => f.casterType && f.casterType !== 'none')
      expect(hasSpellcastingFeat).toBe(false)
    })

    it('replaces the old spellcasting feat when switching from Wizard to Cleric', () => {
      let char = createTestCharacter({ class: 'Wizard' })
      char = applyAllChanges(char)
      expect(char.features.some((f) => f.title === 'Wizard Spellcasting')).toBe(true)
      expect(char.features.some((f) => f.title === 'Cleric Spellcasting')).toBe(false)

      char.class = 'Cleric'
      char = applyAllChanges(char)

      expect(char.features.some((f) => f.title === 'Wizard Spellcasting')).toBe(false)
      expect(char.features.some((f) => f.title === 'Cleric Spellcasting')).toBe(true)
    })

    it('removes the spellcasting feat when switching from Wizard to Fighter', () => {
      let char = createTestCharacter({ class: 'Wizard' })
      char = applyAllChanges(char)
      expect(char.features.some((f) => f.title === 'Wizard Spellcasting')).toBe(true)

      char.class = 'Fighter'
      char = applyAllChanges(char)

      expect(char.features.some((f) => f.title === 'Wizard Spellcasting')).toBe(false)
    })
  })

  // -----------------------------------------------------------------------
  // Spell slots derived from feats
  // -----------------------------------------------------------------------

  describe('spell slot derivation from feats', () => {
    it('computes correct slots for a full caster feat at tier 1', () => {
      characterStore.currentCharacterData = createTestCharacter({
        class: 'Wizard',
        renownTier: 1,
        features: [{ title: 'Wizard Spellcasting', desc: '...', casterType: 'full', key: true }] as CharacterFeature[],
      })

      const level = getEffectiveLevel(1)
      expect(progressionStore.spellSlots).toEqual(SPELL_SLOT_PROGRESSION.full[level])
    })

    it('computes correct slots for a half caster feat at tier 1', () => {
      characterStore.currentCharacterData = createTestCharacter({
        class: 'Paladin',
        renownTier: 1,
        features: [{ title: 'Paladin Spellcasting', desc: '...', casterType: 'half', key: true }] as CharacterFeature[],
      })

      const level = getEffectiveLevel(1)
      expect(progressionStore.spellSlots).toEqual(SPELL_SLOT_PROGRESSION.half[level])
    })

    it('computes pact magic slots for Warlock at tier 1', () => {
      characterStore.currentCharacterData = createTestCharacter({
        class: 'Warlock',
        renownTier: 1,
        features: [{ title: 'Warlock Pact Magic', desc: '...', casterType: 'pact', key: true }] as CharacterFeature[],
      })

      const level = getEffectiveLevel(1)
      expect(progressionStore.spellSlots).toEqual(SPELL_SLOT_PROGRESSION.pact[level])
    })

    it('merges granted slots with class slots when both are present', () => {
      characterStore.currentCharacterData = createTestCharacter({
        class: 'Wizard',
        renownTier: 1,
        features: [
          { title: 'Wizard Spellcasting', desc: '...', casterType: 'full', key: true },
          { title: 'Magic Initiate', desc: '...', grantsSpells: true, grantedSpellLevels: [1], key: false },
        ] as CharacterFeature[],
      })

      const { displaySpellSlots } = useSpellcasting(characterStore, rulesStore)
      const slots = displaySpellSlots.value
      expect(slots.level1).toBeGreaterThanOrEqual(1)
      expect(slots.level2).toBeGreaterThanOrEqual(2)
    })
  })

  // -----------------------------------------------------------------------
  // Migration from v1 class-based casterType to v2 feat-based
  // -----------------------------------------------------------------------

  describe('v1 to v2 migration', () => {
    it('migrates a v1 Wizard character to use Wizard Spellcasting feat', () => {
      const v1Char = {
        version: 1,
        name: 'Old Wizard',
        class: 'Wizard',
        renownTier: 1,
        features: [
          { title: 'Spellcasting (Wizard)', desc: '...', casterType: 'full', key: true },
          { title: 'Arcane Recovery', desc: '...' },
        ],
        spellcasting: { ability: 'int' },
      }

      const migrated = migrateCharacterData(v1Char)

      expect(migrated.features.some((f) => f.title === 'Wizard Spellcasting')).toBe(true)
      expect(migrated.features.some((f) => f.title === 'Spellcasting (Wizard)' && f.casterType)).toBe(false)
      expect(migrated.spellcasting).toBeDefined()
    })

    it('migrates a v1 Paladin character to use Paladin Spellcasting feat', () => {
      const v1Char = {
        version: 1,
        name: 'Old Paladin',
        class: 'Paladin',
        renownTier: 1,
        features: [
          { title: 'Spellcasting', desc: '...', casterType: 'half', key: true },
          { title: 'Lay on Hands', desc: '...' },
        ],
        spellcasting: { ability: 'cha' },
      }

      const migrated = migrateCharacterData(v1Char)

      expect(migrated.features.some((f) => f.title === 'Paladin Spellcasting')).toBe(true)
      expect(migrated.features.some((f) => f.title === 'Spellcasting' && f.casterType)).toBe(false)
    })

    it('does not add duplicate spellcasting feats if one already exists', () => {
      const v1Char = {
        version: 1,
        name: 'Old Wizard',
        class: 'Wizard',
        renownTier: 1,
        features: [
          { title: 'Spellcasting (Wizard)', desc: '...', casterType: 'full', key: true },
          { title: 'Wizard Spellcasting', desc: '...', casterType: 'full', key: true },
        ],
        spellcasting: { ability: 'int' },
      }

      const migrated = migrateCharacterData(v1Char)
      const wizardFeats = migrated.features.filter((f) => f.title === 'Wizard Spellcasting')
      expect(wizardFeats).toHaveLength(1)
    })

    it('leaves non-spellcasting v1 characters unchanged', () => {
      const v1Char = {
        version: 1,
        name: 'Old Fighter',
        class: 'Fighter',
        renownTier: 1,
        features: [{ title: 'Second Wind', desc: '...' }],
        spellcasting: null,
      }

      const migrated = migrateCharacterData(v1Char)
      expect(migrated.features.some((f) => f.casterType && f.casterType !== 'none')).toBe(false)
    })
  })

  // -----------------------------------------------------------------------
  // Real sample-character migration
  // -----------------------------------------------------------------------

  describe('real sample-character migration', () => {
    it('migrates the bundled Elara Wizard to use the Wizard Spellcasting feat', () => {
      const migrated = migrateCharacterData(Elara as CharacterData)

      // Original v1 legacy feature should be replaced by the canonical feat
      expect(migrated.features.some((f) => f.title === 'Wizard Spellcasting')).toBe(true)
      expect(migrated.features.some((f) => f.title === 'Spellcasting (Wizard)' && f.casterType)).toBe(false)

      // She should still have Arcane Recovery and Elf traits
      expect(migrated.features.some((f) => f.title === 'Arcane Recovery')).toBe(true)
      expect(migrated.features.some((f) => f.title === 'Darkvision')).toBe(true)

      // Spellcasting object preserved
      expect(migrated.spellcasting).toBeDefined()
      expect(migrated.spellcasting?.ability).toBe('int')
    })
  })

  // -----------------------------------------------------------------------
  // Store integration
  // -----------------------------------------------------------------------

  describe('store integration', () => {
    it('applyClassChange on a Wizard adds the Wizard Spellcasting feat', () => {
      characterStore.currentCharacterData = createTestCharacter({ class: 'Fighter' })
      characterStore.applyClassChange('Wizard')

      const features = characterStore.currentCharacterData.features
      expect(features.some((f) => f.title === 'Wizard Spellcasting')).toBe(true)
      expect(features.some((f) => f.title === 'Spellcasting (Wizard)' && f.casterType)).toBe(false)

      const { hasSpellcasting, casterType } = useSpellcasting(characterStore, rulesStore)
      expect(hasSpellcasting.value).toBe(true)
      expect(casterType.value).toBe('full')
    })

    it('applyClassChange from Wizard to Fighter removes the spellcasting feat', () => {
      characterStore.currentCharacterData = createTestCharacter({
        class: 'Wizard',
        background: 'Soldier',
      })
      characterStore.applyClassChange('Wizard') // ensure initial setup

      characterStore.applyClassChange('Fighter')

      const features = characterStore.currentCharacterData.features
      expect(features.some((f) => f.title === 'Wizard Spellcasting')).toBe(false)

      const { hasSpellcasting } = useSpellcasting(characterStore, rulesStore)
      expect(hasSpellcasting.value).toBe(false)
    })

    it('Magic Initiate added via Feats view unlocks spellcasting', () => {
      characterStore.currentCharacterData = createTestCharacter({ class: 'Fighter' })
      characterStore.currentCharacterData.features.push({
        title: 'Magic Initiate',
        desc: 'You learn spells.',
        grantsSpells: true,
        grantedSpellLevels: [0, 1],
        key: false,
      })
      progressionStore.recalculateAbilityScores()

      const { hasSpellcasting, casterType, displaySpellSlots } = useSpellcasting(characterStore, rulesStore)
      expect(hasSpellcasting.value).toBe(true)
      expect(casterType.value).toBe('granted')
      expect(displaySpellSlots.value.level1).toBe(1)
    })
  })
})
