import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '@/stores/character'
import { useProgressionStore } from '@/stores/progression'
import { useSpellStore } from '@/stores/spellStore'
import { createBlankCharacter } from '@/domain'
import type { CharacterData, CharacterFeature } from '@/types/character'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeChar(overrides: Partial<CharacterData> = {}): CharacterData {
  const baseScores = { str: 10, dex: 12, con: 12, int: 18, wis: 14, cha: 16 }

  return {
    ...createBlankCharacter(),
    pointBuyBaseScores: { ...baseScores },
    abilityScores: { ...baseScores },
    backgroundBonusSelections: { plusTwo: null, plusOne: null },
    class: 'Wizard',
    renownTier: 1,
    profBonus: 2,
    features: [
      { title: 'Spellcasting (Wizard)', desc: '', key: true, casterType: 'full' } as CharacterFeature,
    ],
    spellcasting: { ability: 'int' },
    ...overrides,
  } as CharacterData
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSpellStore', () => {
  let charStore: ReturnType<typeof useCharacterStore>
  let progStore: ReturnType<typeof useProgressionStore>
  let spellStore: ReturnType<typeof useSpellStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    charStore = useCharacterStore()
    progStore = useProgressionStore()
    spellStore = useSpellStore()
    charStore.currentCharacterData = makeChar()
  })

  // -----------------------------------------------------------------------
  // Magic Vitals
  // -----------------------------------------------------------------------

  describe('spellcastingAbility', () => {
    it('returns the casting stat for the character', () => {
      expect(spellStore.spellcastingAbility).toBe('int')
    })

    it('defaults to "int" when spellcasting object has no ability', () => {
      charStore.currentCharacterData.spellcasting = null as any
      expect(spellStore.spellcastingAbility).toBe('int')
    })
  })

  describe('spellMod, spellSaveDC, spellAttack', () => {
    it('calculates correctly for Wizard with INT 18 (+4) at tier 1 (PB +2)', () => {
      // INT 18 → +4, PB +2
      expect(spellStore.spellMod).toBe(4)
      expect(spellStore.spellSaveDC).toBe(14)  // 8 + 2 + 4
      expect(spellStore.spellAttack).toBe(6)    // 2 + 4
    })

    it('reactively updates when ability scores change', () => {
      expect(spellStore.spellMod).toBe(4)

      charStore.currentCharacterData.abilityScores['int'] = 20
      expect(spellStore.spellMod).toBe(5)
      expect(spellStore.spellSaveDC).toBe(15)  // 8 + 2 + 5
    })

    it('reactively updates when proficiency bonus changes', () => {
      expect(spellStore.spellAttack).toBe(6)

      charStore.currentCharacterData.renownTier = 2 // level 6 → PB +3
      expect(spellStore.spellAttack).toBe(7)         // 3 + 4
    })
  })

  // -----------------------------------------------------------------------
  // Feature Getters
  // -----------------------------------------------------------------------

  describe('keyFeatures and otherFeatures', () => {
    it('separates features by the key property', () => {
      charStore.currentCharacterData.features = [
        { title: 'A', desc: '', key: true } as CharacterFeature,
        { title: 'B', desc: '', key: false } as CharacterFeature,
        { title: 'C', desc: '' } as CharacterFeature, // key undefined → other
      ]
      expect(spellStore.keyFeatures).toHaveLength(1)
      expect(spellStore.keyFeatures[0].title).toBe('A')
      expect(spellStore.otherFeatures).toHaveLength(2)
    })
  })

  // -----------------------------------------------------------------------
  // getFeatureMaxUses
  // -----------------------------------------------------------------------

  describe('getFeatureMaxUses', () => {
    it('returns value for static resource', () => {
      const feat = {
        title: 'Channel Divinity',
        resource: { resourceType: 'static', value: 2 },
      } as CharacterFeature
      expect(spellStore.getFeatureMaxUses(feat)).toBe(2)
    })

    it('returns profBonus for pb-scaling resource', () => {
      const feat = {
        title: 'PB Uses',
        resource: { resourceType: 'scaling', scalingStat: 'pb' },
      } as CharacterFeature
      expect(spellStore.getFeatureMaxUses(feat)).toBe(2) // tier 1 PB = 2
    })

    it('returns ability mod for ability-scaling resource (min 1)', () => {
      const feat = {
        title: 'WIS Uses',
        resource: { resourceType: 'scaling', scalingStat: 'wis' },
      } as CharacterFeature
      // WIS 14 → +2
      expect(spellStore.getFeatureMaxUses(feat)).toBe(2)
    })

    it('returns legacy uses.total for backward compatibility', () => {
      const feat = {
        title: 'Rage',
        uses: { total: 3, per: 'Long Rest' },
      } as CharacterFeature
      expect(spellStore.getFeatureMaxUses(feat)).toBe(3)
    })

    it('returns null for features with no resource tracking', () => {
      const feat = { title: 'Passive' } as CharacterFeature
      expect(spellStore.getFeatureMaxUses(feat)).toBeNull()
    })

    it('returns null for null/undefined input', () => {
      expect(spellStore.getFeatureMaxUses(null)).toBeNull()
      expect(spellStore.getFeatureMaxUses(undefined)).toBeNull()
    })
  })
})