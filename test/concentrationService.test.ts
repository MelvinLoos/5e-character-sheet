import { describe, it, expect } from 'vitest'
import {
  concentrationCandidates,
  concentrationFromSpell,
  concentrationSaveDC,
} from '@/domain'
import type { CharacterSpell } from '@/types/character'

describe('concentrationSaveDC', () => {
  it('floors at 10 for damage up to 20', () => {
    for (const dmg of [0, 1, 10, 19, 20]) {
      expect(concentrationSaveDC(dmg)).toBe(10)
    }
  })

  it('is half the damage (rounded down) above 20', () => {
    expect(concentrationSaveDC(21)).toBe(10)
    expect(concentrationSaveDC(22)).toBe(11)
    expect(concentrationSaveDC(45)).toBe(22)
    expect(concentrationSaveDC(100)).toBe(50)
  })

  it('ignores negative damage', () => {
    expect(concentrationSaveDC(-5)).toBe(10)
  })
})

describe('concentrationCandidates', () => {
  const spells: CharacterSpell[] = [
    { name: 'Bless', level: 1, desc: '', concentration: true },
    { name: 'Fireball', level: 3, desc: '', concentration: false },
    { name: 'Hex', level: 1, desc: '', concentration: true },
    { name: 'Shield', level: 1, desc: '' },
  ]

  it('keeps only the spells flagged for concentration', () => {
    expect(concentrationCandidates(spells).map((s) => s.name)).toEqual(['Bless', 'Hex'])
  })

  it('handles a missing spell list', () => {
    expect(concentrationCandidates(undefined)).toEqual([])
  })
})

describe('concentrationFromSpell', () => {
  it('copies the identifying fields into the marker', () => {
    const spell: CharacterSpell = {
      id: 'abc',
      name: 'Bless',
      level: 1,
      desc: '',
      source: 'PHB',
      concentration: true,
    }

    expect(concentrationFromSpell(spell)).toEqual({
      spellId: 'abc',
      spellName: 'Bless',
      level: 1,
      source: 'PHB',
    })
  })
})
