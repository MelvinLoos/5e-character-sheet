import { describe, it, expect } from 'vitest'
import { PREPARED_SPELL_PROGRESSION } from '@/data/progressions'
import {
  computePreparedSpellLimit,
  countSelectedSpells,
  remainingSpellSelections,
} from '@/domain/spellSelectionService'
import type { CharacterSpell } from '@/types/character'

// ---------------------------------------------------------------------------
// Pure prepared-spell selection service tests
//
// Figures verified against the open5e srd-2024 "Prepared Spells" column
// (System Reference Document 5.2, CC-BY-4.0).
// ---------------------------------------------------------------------------

describe('PREPARED_SPELL_PROGRESSION', () => {
  it('contains a full level-keyed table for every casting class', () => {
    for (const className of [
      'Bard',
      'Sorcerer',
      'Warlock',
      'Wizard',
      'Cleric',
      'Druid',
      'Paladin',
      'Ranger',
    ]) {
      expect(Object.keys(PREPARED_SPELL_PROGRESSION[className] ?? {})).toHaveLength(20)
    }
  })

  it('matches the SRD values at the supported tier levels', () => {
    // Bard / Sorcerer / Wizard / Cleric / Druid
    expect(PREPARED_SPELL_PROGRESSION.Bard[3]).toBe(6)
    expect(PREPARED_SPELL_PROGRESSION.Sorcerer[3]).toBe(6)
    expect(PREPARED_SPELL_PROGRESSION.Wizard[3]).toBe(6)
    expect(PREPARED_SPELL_PROGRESSION.Cleric[3]).toBe(6)
    expect(PREPARED_SPELL_PROGRESSION.Druid[3]).toBe(6)

    // Warlock
    expect(PREPARED_SPELL_PROGRESSION.Warlock[3]).toBe(4)
    expect(PREPARED_SPELL_PROGRESSION.Warlock[6]).toBe(7)
    expect(PREPARED_SPELL_PROGRESSION.Warlock[10]).toBe(10)

    // Paladin / Ranger (half casters)
    expect(PREPARED_SPELL_PROGRESSION.Paladin[3]).toBe(4)
    expect(PREPARED_SPELL_PROGRESSION.Paladin[6]).toBe(6)
    expect(PREPARED_SPELL_PROGRESSION.Paladin[10]).toBe(9)
    expect(PREPARED_SPELL_PROGRESSION.Ranger[10]).toBe(9)
  })
})

describe('computePreparedSpellLimit', () => {
  it('returns 6 for a Wizard at effective level 3 (Tier 1)', () => {
    expect(computePreparedSpellLimit('Wizard', 3)).toBe(6)
  })

  it('returns 15 for a Cleric at effective level 10 (Tier 3)', () => {
    expect(computePreparedSpellLimit('Cleric', 10)).toBe(15)
  })

  it('returns 4 for a Warlock at effective level 3 (Tier 1)', () => {
    expect(computePreparedSpellLimit('Warlock', 3)).toBe(4)
  })

  it('returns 4 for a Paladin at effective level 3 (Tier 1)', () => {
    expect(computePreparedSpellLimit('Paladin', 3)).toBe(4)
  })

  it('returns null for a non-caster class', () => {
    expect(computePreparedSpellLimit('Fighter', 3)).toBeNull()
    expect(computePreparedSpellLimit('Barbarian', 3)).toBeNull()
  })

  it('returns null for a missing class', () => {
    expect(computePreparedSpellLimit(null, 3)).toBeNull()
    expect(computePreparedSpellLimit(undefined, 3)).toBeNull()
    expect(computePreparedSpellLimit('', 3)).toBeNull()
  })

  it('returns null for an unsupported level', () => {
    expect(computePreparedSpellLimit('Wizard', 21)).toBeNull()
  })
})

describe('countSelectedSpells', () => {
  const spells = [
    { name: 'Fire Bolt', level: 0, desc: '' },
    { name: 'Magic Missile', level: 1, desc: '' },
    { name: 'Fireball', level: 3, desc: '' },
  ] as CharacterSpell[]

  it('counts only leveled spells, excluding cantrips', () => {
    expect(countSelectedSpells(spells)).toBe(2)
  })

  it('returns 0 for an empty list', () => {
    expect(countSelectedSpells([])).toBe(0)
  })

  it('returns 0 when only cantrips are selected', () => {
    expect(countSelectedSpells([{ name: 'Light', level: 0, desc: '' }])).toBe(1 - 1)
  })

  it('is defensive against a missing list', () => {
    expect(countSelectedSpells(undefined as unknown as CharacterSpell[])).toBe(0)
  })
})

describe('remainingSpellSelections', () => {
  const oneSpell = [{ name: 'Magic Missile', level: 1, desc: '' }] as CharacterSpell[]

  it('returns the difference between the limit and selected spells', () => {
    expect(remainingSpellSelections('Wizard', 3, oneSpell)).toBe(5)
  })

  it('never returns a negative value', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      name: `Spell ${i}`,
      level: 1,
      desc: '',
    })) as CharacterSpell[]
    expect(remainingSpellSelections('Paladin', 3, many)).toBe(0)
  })

  it('returns 0 for non-casters (no limit)', () => {
    expect(remainingSpellSelections('Fighter', 3, oneSpell)).toBe(0)
    expect(remainingSpellSelections(null, 3, oneSpell)).toBe(0)
  })
})
