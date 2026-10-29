import { describe, it, expect } from 'vitest'
import { SPELL_SLOT_PROGRESSION } from '@/data/rules'
import {
  computeSpellSlots,
  computeClassSpellSlots,
  computeGrantedSpellSlots,
  isSpellcastingFeature,
  hasSpellcasting,
  detectCasterType,
  clampSpentCount,
  clampSpentSlots,
} from '@/domain/spellSlotService'
import type { CharacterFeature } from '@/types/character'

// ---------------------------------------------------------------------------
// Pure spell-slot service tests
// ---------------------------------------------------------------------------

describe('computeClassSpellSlots', () => {
  it('returns slots for a full caster at effective level 3', () => {
    const features = [
      { title: 'Wizard Spellcasting', desc: '', casterType: 'full', key: true },
    ] as CharacterFeature[]

    expect(computeClassSpellSlots(features, 3)).toEqual({ level1: 4, level2: 2 })
  })

  it('returns 2 first-level slots for a half caster at level 1 (2024 rules)', () => {
    const features = [
      { title: 'Paladin Spellcasting', desc: '', casterType: 'half', key: true },
    ] as CharacterFeature[]

    expect(computeClassSpellSlots(features, 1)).toEqual({ level1: 2 })
  })

  it('returns {} when no feature has a casterType', () => {
    const features = [
      { title: 'Second Wind', desc: '', key: true },
    ] as CharacterFeature[]

    expect(computeClassSpellSlots(features, 3)).toEqual({})
  })

  it('returns {} for an unknown casterType', () => {
    const features = [
      { title: 'Mystery Caster', desc: '', casterType: 'none', key: true },
    ] as CharacterFeature[]

    expect(computeClassSpellSlots(features, 3)).toEqual({})
  })
})

describe('computeGrantedSpellSlots', () => {
  it('builds { level1: 1 } for a 1st-level granted spell feature', () => {
    const features = [
      { title: 'Magic Initiate', desc: '', grantsSpells: true, grantedSpellLevels: [1], key: false },
    ] as CharacterFeature[]

    expect(computeGrantedSpellSlots(features)).toEqual({ level1: 1 })
  })

  it('aggregates multiple granted features into { level1: 1, level2: 1 }', () => {
    const features = [
      { title: 'Magic Initiate', desc: '', grantsSpells: true, grantedSpellLevels: [1], key: false },
      { title: 'Fey Touched', desc: '', grantsSpells: true, grantedSpellLevels: [2], key: false },
    ] as CharacterFeature[]

    expect(computeGrantedSpellSlots(features)).toEqual({ level1: 1, level2: 1 })
  })

  it('counts two features granting the same level additively', () => {
    const features = [
      { title: 'Magic Initiate', desc: '', grantsSpells: true, grantedSpellLevels: [1], key: false },
      { title: 'Divinely Favored', desc: '', grantsSpells: true, grantedSpellLevels: [1], key: false },
    ] as CharacterFeature[]

    expect(computeGrantedSpellSlots(features)).toEqual({ level1: 2 })
  })

  it('excludes cantrips (level 0)', () => {
    const features = [
      { title: 'Magic Initiate', desc: '', grantsSpells: true, grantedSpellLevels: [0, 1], key: false },
    ] as CharacterFeature[]

    expect(computeGrantedSpellSlots(features)).toEqual({ level1: 1 })
    expect(computeGrantedSpellSlots(features)['level0']).toBeUndefined()
  })

  it('returns {} when no feature grants spells', () => {
    const features = [
      { title: 'Second Wind', desc: '', key: true },
    ] as CharacterFeature[]

    expect(computeGrantedSpellSlots(features)).toEqual({})
  })
})

describe('computeSpellSlots (additive merge)', () => {
  it('adds class slots and feat slots for the same level', () => {
    // Wizard tier 1 (effective level 3): 4×L1 + 2×L2
    // Magic Initiate: +1×L1
    const features = [
      { title: 'Wizard Spellcasting', desc: '', casterType: 'full', key: true },
      { title: 'Magic Initiate', desc: '', grantsSpells: true, grantedSpellLevels: [1], key: false },
    ] as CharacterFeature[]

    expect(computeSpellSlots(features, 3)).toEqual({ level1: 5, level2: 2 })
  })

  it('returns feat-only slots when no class casterType exists', () => {
    const features = [
      { title: 'Magic Initiate', desc: '', grantsSpells: true, grantedSpellLevels: [1], key: false },
    ] as CharacterFeature[]

    expect(computeSpellSlots(features, 3)).toEqual({ level1: 1 })
  })

  it('returns {} when the character has no spellcasting at all', () => {
    const features = [
      { title: 'Second Wind', desc: '', key: true },
    ] as CharacterFeature[]

    expect(computeSpellSlots(features, 3)).toEqual({})
  })
})

describe('SPELL_SLOT_PROGRESSION.half (2024 rules)', () => {
  it('has 2 first-level slots at level 1 (no empty 2014 progression)', () => {
    expect(SPELL_SLOT_PROGRESSION.half[1]).toEqual({ level1: 2 })
  })
})

describe('isSpellcastingFeature / hasSpellcasting', () => {
  const full = { title: 'Wizard Spellcasting', desc: '', casterType: 'full' } as CharacterFeature
  const none = { title: 'Fighter', desc: '', casterType: 'none' } as CharacterFeature
  const granted = { title: 'Magic Initiate', desc: '', grantsSpells: true } as CharacterFeature
  const plain = { title: 'Second Wind', desc: '' } as CharacterFeature

  it('accepts class casterTypes and granted-spell features', () => {
    expect(isSpellcastingFeature(full)).toBe(true)
    expect(isSpellcastingFeature(granted)).toBe(true)
  })

  it('rejects casterType "none" and plain features', () => {
    expect(isSpellcastingFeature(none)).toBe(false)
    expect(isSpellcastingFeature(plain)).toBe(false)
  })

  it('hasSpellcasting is true when any feature qualifies', () => {
    expect(hasSpellcasting([plain, full])).toBe(true)
    expect(hasSpellcasting([plain, none])).toBe(false)
    expect(hasSpellcasting([])).toBe(false)
  })
})

describe('detectCasterType', () => {
  it('returns the first class casterType', () => {
    const features = [
      { title: 'A', desc: '' },
      { title: 'B', desc: '', casterType: 'half' },
    ] as CharacterFeature[]
    expect(detectCasterType(features)).toBe('half')
  })

  it('returns "granted" when only grantsSpells features exist', () => {
    const features = [{ title: 'MI', desc: '', grantsSpells: true }] as CharacterFeature[]
    expect(detectCasterType(features)).toBe('granted')
  })

  it('prefers a class casterType over granted spells', () => {
    const features = [
      { title: 'MI', desc: '', grantsSpells: true },
      { title: 'Pact', desc: '', casterType: 'pact' },
    ] as CharacterFeature[]
    expect(detectCasterType(features)).toBe('pact')
  })

  it('returns null for casterType "none" or no features', () => {
    expect(detectCasterType([{ title: 'F', desc: '', casterType: 'none' }] as CharacterFeature[])).toBeNull()
    expect(detectCasterType([])).toBeNull()
  })
})

describe('clampSpentCount', () => {
  it('clamps into [0, max]', () => {
    expect(clampSpentCount(5, 3)).toBe(3)
    expect(clampSpentCount(-1, 3)).toBe(0)
    expect(clampSpentCount(2, 3)).toBe(2)
    expect(clampSpentCount(2, 0)).toBe(0)
  })
})

describe('clampSpentSlots', () => {
  it('clamps spent slots that exceed the new maximum', () => {
    expect(clampSpentSlots({ level1: 4, level2: 2 }, { level1: 2, level2: 2 })).toEqual({
      level1: 2,
      level2: 2,
    })
  })

  it('leaves levels under the maximum and levels missing from maxSlots untouched', () => {
    expect(clampSpentSlots({ level1: 1, level3: 2 }, { level1: 4 })).toEqual({
      level1: 1,
      level3: 2,
    })
  })

  it('does not mutate its input', () => {
    const spent = { level1: 4 }
    clampSpentSlots(spent, { level1: 2 })
    expect(spent).toEqual({ level1: 4 })
  })
})
