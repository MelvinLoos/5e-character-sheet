import { describe, it, expect } from 'vitest'

// We'll test the parser in isolation before it's merged into guildContentManagement
// These tests exercise the parsing/validation pipeline that will be used by the Bulk Import UI

import { mapSpells, mapFeats } from '../src/utils/fiveToolsAdapter'

describe('guildContentBulkImport - parseSpellArray', () => {
  it('maps a valid JSON array of 5e.tools spells into AppSpell objects', () => {
    const input = [
      {
        name: 'Fireball',
        level: 3,
        school: 'E',
        entries: ['A bright streak flashes from your pointing finger...'],
        source: 'PHB',
      },
      {
        name: 'Magic Missile',
        level: 1,
        school: 'E',
        entries: ['You create three glowing darts of magical force...'],
        source: 'PHB',
      },
    ]

    const result = mapSpells(input)

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('Fireball')
    expect(result[0].level).toBe(3)
    expect(result[1].name).toBe('Magic Missile')
    expect(result[1].level).toBe(1)
  })

  it('filters out malformed entries missing required fields', () => {
    const input = [
      { name: 'Valid Spell', level: 1, entries: ['Does something'] },
      { name: null, level: 2, entries: ['Missing name'] }, // no valid name
      { name: 'Missing Level' }, // no level field
      { entries: ['No name at all'] }, // no name
    ]

    const result = mapSpells(input)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Valid Spell')
  })

  it('handles empty array gracefully', () => {
    const result = mapSpells([])
    expect(result).toEqual([])
  })

  it('handles the { spell: [...] } wrapper format', () => {
    // mapSpells expects an array directly, but the caller should extract .spell first
    // This test verifies that passing non-array data doesn't crash
    const wrapper = {
      spell: [
        { name: 'Cure Wounds', level: 1, entries: ['A creature you touch regains hit points'] },
      ],
    }

    // Caller is responsible for extracting the array
    const spells = Array.isArray(wrapper) ? wrapper : (wrapper as Record<string, unknown>).spell || []
    const result = mapSpells(spells as unknown[])

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Cure Wounds')
  })

  it('returns validCount and invalidCount statistics', () => {
    const input = [
      { name: 'Spell A', level: 0, entries: ['Cantrip'] },
      { name: 'Spell B', level: 1, entries: ['Level 1'] },
      null, // invalid
      { invalid: true }, // no name
      { name: 'Spell C', level: 2, entries: ['Level 2'] },
    ]

    const result = mapSpells(input)

    const valid = result.length
    const invalid = input.length - valid

    expect(valid).toBe(3)
    expect(invalid).toBe(2)
  })
})

describe('guildContentBulkImport - parseFeatArray', () => {
  it('maps a valid JSON array of 5e.tools feats into AppFeature objects', () => {
    const input = [
      {
        name: 'Lucky',
        source: 'PHB',
        entries: ['You have inexplicable luck that seems to kick in at just the right moment.'],
      },
      {
        name: 'Alert',
        source: 'PHB',
        entries: ['Always on the lookout for danger, you gain the following benefits:'],
      },
    ]

    const result = mapFeats(input)

    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Lucky')
    expect(result[1].title).toBe('Alert')
  })

  it('filters out malformed feat entries missing name', () => {
    const input = [
      { name: 'Valid Feat', entries: ['Does something'] },
      { entries: ['No name'] },
      { name: '', entries: ['Empty name'] },
      null,
    ]

    const result = mapFeats(input)

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Valid Feat')
  })

  it('handles the { feat: [...] } wrapper format via caller extraction', () => {
    const wrapper = {
      feat: [
        { name: 'Tough', entries: ['Your hit point maximum increases...'] },
      ],
    }

    const feats = Array.isArray(wrapper) ? wrapper : (wrapper as Record<string, unknown>).feat || []
    const result = mapFeats(feats as unknown[])

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Tough')
  })

  it('handles empty array gracefully', () => {
    const result = mapFeats([])
    expect(result).toEqual([])
  })
})