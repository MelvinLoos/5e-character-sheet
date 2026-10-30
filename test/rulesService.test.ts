import { describe, it, expect } from 'vitest'
import { getEffectiveLevel, getSpellcastingAbility } from '@/domain'
import { TIER_TO_LEVEL } from '@/data/progressions'
import { CLASS_SPELLCASTING_ABILITY } from '@/data/classSpellcasting'

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

describe('CLASS_SPELLCASTING_ABILITY', () => {
  it('maps every spellcasting class to the correct ability', () => {
    expect(CLASS_SPELLCASTING_ABILITY).toEqual({
      Bard: 'cha',
      Cleric: 'wis',
      Druid: 'wis',
      Paladin: 'cha',
      Ranger: 'wis',
      Sorcerer: 'cha',
      Warlock: 'cha',
      Wizard: 'int',
    })
  })
})

describe('getSpellcastingAbility', () => {
  it('returns the mapped ability for a known spellcaster class', () => {
    expect(getSpellcastingAbility('Cleric')).toBe('wis')
    expect(getSpellcastingAbility('Druid')).toBe('wis')
    expect(getSpellcastingAbility('Bard')).toBe('cha')
    expect(getSpellcastingAbility('Sorcerer')).toBe('cha')
    expect(getSpellcastingAbility('Warlock')).toBe('cha')
    expect(getSpellcastingAbility('Paladin')).toBe('cha')
    expect(getSpellcastingAbility('Ranger')).toBe('wis')
    expect(getSpellcastingAbility('Wizard')).toBe('int')
  })

  it('falls back to int for non-casters or missing class values', () => {
    expect(getSpellcastingAbility('Fighter')).toBe('int')
    expect(getSpellcastingAbility('Barbarian')).toBe('int')
    expect(getSpellcastingAbility(null)).toBe('int')
    expect(getSpellcastingAbility(undefined)).toBe('int')
  })
})
