import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { getEffectiveLevel, TIER_TO_LEVEL } from '../src/data/rules'
import { useCharacterStore } from '../src/stores/character'
import { useProgressionStore } from '../src/stores/progression'
import type { CharacterData } from '@/domain'

// ────────────────────────────────────────────────────
// Pure function tests — getEffectiveLevel
// ────────────────────────────────────────────────────

describe('getEffectiveLevel — Tier → Level mapping', () => {
  it('contains the correct constant mappings', () => {
    expect(TIER_TO_LEVEL).toEqual({ 1: 3, 2: 6, 3: 10 })
  })

  it('maps Tier 1 to effective level 3', () => {
    expect(getEffectiveLevel(1)).toBe(3)
  })

  it('maps Tier 2 to effective level 6', () => {
    expect(getEffectiveLevel(2)).toBe(6)
  })

  it('maps Tier 3 to effective level 10', () => {
    expect(getEffectiveLevel(3)).toBe(10)
  })

  describe('default / out-of-bounds tiers', () => {
    it('defaults to 3 for Tier 0', () => {
      expect(getEffectiveLevel(0)).toBe(3)
    })

    it('defaults to 3 for Tier 4 (Paragon — max tier)', () => {
      expect(getEffectiveLevel(4)).toBe(3)
    })

    it('defaults to 3 for negative tiers', () => {
      expect(getEffectiveLevel(-1)).toBe(3)
    })

    it('defaults to 3 for very large tiers', () => {
      expect(getEffectiveLevel(99)).toBe(3)
    })

    it('defaults to 3 for NaN (though unlikely in practice)', () => {
      expect(getEffectiveLevel(NaN)).toBe(3)
    })
  })
})

// ────────────────────────────────────────────────────
// Pinia store getter tests — spellSlots
// ────────────────────────────────────────────────────

/**
 * Minimal helper to build a CharacterData object with just the fields
 * the spellSlots getter cares about.  All other fields are filled with
 * sensible defaults so TypeScript is happy.
 */
function makeChar(overrides: Partial<CharacterData> = {}): CharacterData {
  return {
    name: 'Test',
    title: '',
    jobInParty: '',
    class: null,
    renownTier: 1,
    renownMilestones: 0,
    species: null,
    background: null,
    pointBuyBaseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
    backgroundBonusSelections: { plusTwo: null, plusOne: null },
    abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    profBonus: 2,
    proficiencies: { savingThrows: [], skills: [] },
    combat: { ac: 10, hp_max: 10, hp_current: 10, speed: '30ft' },
    attacks: [],
    features: [],
    equipment: '',
    gold: 0,
    supply: 0,
    influence: 0,
    inventorySlots: 10,
    equippedGear: [],
    consumables: [],
    personality: { traits: '', ideal: '', bond: '', flaw: '', notes: '' },
    spellcasting: null,
    spells: [],
    ...overrides,
  } as CharacterData
}

describe('spellSlots store getter — Tier-based slot calculation', () => {
  let store: ReturnType<typeof useCharacterStore>
  let progressionStore: ReturnType<typeof useProgressionStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useCharacterStore()
    progressionStore = useProgressionStore()
  })

  // ── Full Caster (Wizard, Cleric, Bard, Druid, Sorcerer) ──

  describe('Full Caster (Wizard)', () => {
    const fullCasterFeature = {
      title: 'Spellcasting (Wizard)',
      desc: 'Wizard spells',
      casterType: 'full',
      key: true,
    }

    it('Tier 1 → level 3 full caster: 4×L1 + 2×L2', () => {
      store.currentCharacterData = makeChar({
        renownTier: 1,
        features: [fullCasterFeature],
      })
      expect(progressionStore.spellSlots).toEqual({ level1: 4, level2: 2 })
    })

    it('Tier 2 → level 6 full caster: 4×L1 + 3×L2 + 3×L3', () => {
      store.currentCharacterData = makeChar({
        renownTier: 2,
        features: [fullCasterFeature],
      })
      expect(progressionStore.spellSlots).toEqual({ level1: 4, level2: 3, level3: 3 })
    })

    it('Tier 3 → level 10 full caster: 4×L1 + 3×L2 + 3×L3 + 3×L4 + 2×L5', () => {
      store.currentCharacterData = makeChar({
        renownTier: 3,
        features: [fullCasterFeature],
      })
      expect(progressionStore.spellSlots).toEqual({
        level1: 4,
        level2: 3,
        level3: 3,
        level4: 3,
        level5: 2,
      })
    })
  })

  // ── Half Caster (Ranger, Paladin) ──

  describe('Half Caster (Ranger)', () => {
    const halfCasterFeature = {
      title: 'Spellcasting (Ranger)',
      desc: 'Ranger spells',
      casterType: 'half',
      key: true,
    }

    it('Tier 1 → level 3 half caster: 3×L1', () => {
      store.currentCharacterData = makeChar({
        renownTier: 1,
        features: [halfCasterFeature],
      })
      expect(progressionStore.spellSlots).toEqual({ level1: 3 })
    })

    it('Tier 2 → level 6 half caster: 4×L1 + 2×L2', () => {
      store.currentCharacterData = makeChar({
        renownTier: 2,
        features: [halfCasterFeature],
      })
      expect(progressionStore.spellSlots).toEqual({ level1: 4, level2: 2 })
    })

    it('Tier 3 → level 10 half caster: 4×L1 + 3×L2 + 2×L3', () => {
      store.currentCharacterData = makeChar({
        renownTier: 3,
        features: [halfCasterFeature],
      })
      expect(progressionStore.spellSlots).toEqual({ level1: 4, level2: 3, level3: 2 })
    })
  })

  // ── Pact Caster (Warlock) ──

  describe('Pact Caster (Warlock)', () => {
    const pactFeature = {
      title: 'Pact Magic (Warlock)',
      desc: 'Warlock pact magic',
      casterType: 'pact',
      key: true,
    }

    it('Tier 1 → level 3 pact caster: 2×L2 slots', () => {
      store.currentCharacterData = makeChar({
        renownTier: 1,
        features: [pactFeature],
      })
      expect(progressionStore.spellSlots).toEqual({ level2: 2 })
    })

    it('Tier 2 → level 6 pact caster: 2×L3 slots', () => {
      store.currentCharacterData = makeChar({
        renownTier: 2,
        features: [pactFeature],
      })
      expect(progressionStore.spellSlots).toEqual({ level3: 2 })
    })

    it('Tier 3 → level 10 pact caster: 2×L5 slots', () => {
      store.currentCharacterData = makeChar({
        renownTier: 3,
        features: [pactFeature],
      })
      expect(progressionStore.spellSlots).toEqual({ level5: 2 })
    })
  })

  // ── Third Caster (Eldritch Knight / Arcane Trickster) ──

  describe('Third Caster (Eldritch Knight)', () => {
    const thirdCasterFeature = {
      title: 'Spellcasting (Eldritch Knight)',
      desc: 'EK spells',
      casterType: 'third',
      key: true,
    }

    it('Tier 1 → level 3 third caster: 2×L1', () => {
      store.currentCharacterData = makeChar({
        renownTier: 1,
        features: [thirdCasterFeature],
      })
      expect(progressionStore.spellSlots).toEqual({ level1: 2 })
    })

    it('Tier 2 → level 6 third caster: 3×L1', () => {
      store.currentCharacterData = makeChar({
        renownTier: 2,
        features: [thirdCasterFeature],
      })
      expect(progressionStore.spellSlots).toEqual({ level1: 3 })
    })

    it('Tier 3 → level 10 third caster: 4×L1 + 3×L2', () => {
      store.currentCharacterData = makeChar({
        renownTier: 3,
        features: [thirdCasterFeature],
      })
      expect(progressionStore.spellSlots).toEqual({ level1: 4, level2: 3 })
    })
  })

  // ── Edge cases ──

  describe('Edge cases', () => {
    it('returns empty object for a non-spellcaster (Barbarian)', () => {
      store.currentCharacterData = makeChar({
        renownTier: 1,
        features: [
          {
            title: 'Rage',
            desc: 'Angry',
            casterType: null,
            key: true,
          },
        ],
      })
      expect(progressionStore.spellSlots).toEqual({})
    })

    it('returns empty object when renownTier is out of bounds', () => {
      store.currentCharacterData = makeChar({
        renownTier: 99,
        features: [
          {
            title: 'Spellcasting (Wizard)',
            desc: 'Wizard spells',
            casterType: 'full',
            key: true,
          },
        ],
      })
      // getEffectiveLevel(99) → 3, so it should return level 3 full caster slots
      expect(progressionStore.spellSlots).toEqual({ level1: 4, level2: 2 })
    })

    it('reactively updates when tier is changed', () => {
      store.currentCharacterData = makeChar({
        renownTier: 1,
        features: [
          {
            title: 'Spellcasting (Wizard)',
            desc: 'Wizard spells',
            casterType: 'full',
            key: true,
          },
        ],
      })
      expect(progressionStore.spellSlots).toEqual({ level1: 4, level2: 2 })

      // Advance to Tier 2
      store.currentCharacterData.renownTier = 2
      expect(progressionStore.spellSlots).toEqual({ level1: 4, level2: 3, level3: 3 })

      // Advance to Tier 3
      store.currentCharacterData.renownTier = 3
      expect(progressionStore.spellSlots).toEqual({
        level1: 4,
        level2: 3,
        level3: 3,
        level4: 3,
        level5: 2,
      })

      // Demote back to Tier 1
      store.currentCharacterData.renownTier = 1
      expect(progressionStore.spellSlots).toEqual({ level1: 4, level2: 2 })
    })
  })
})