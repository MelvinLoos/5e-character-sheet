import { describe, it, expect } from 'vitest'
import { SPELL_SLOT_PROGRESSION } from '@/data/rules'
import {
  computeSpellSlots,
  computeClassSpellSlots,
  computeGrantedSpellSlots,
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