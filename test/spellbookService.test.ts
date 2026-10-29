import { describe, it, expect } from 'vitest'
import {
  generateSpellId,
  formatLevel,
  createSpellFromLibrary,
  createBlankSpell,
  removeSpellById,
} from '@/domain/spellbookService'
import type { CharacterSpell } from '@/types/character'

describe('formatLevel', () => {
  it('formats ordinals', () => {
    expect(formatLevel(0)).toBe('Cantrip')
    expect(formatLevel(1)).toBe('1st')
    expect(formatLevel(2)).toBe('2nd')
    expect(formatLevel(3)).toBe('3rd')
    expect(formatLevel(4)).toBe('4th')
  })
})

describe('generateSpellId', () => {
  it('produces unique non-empty strings', () => {
    const a = generateSpellId()
    const b = generateSpellId()
    expect(a).toBeTruthy()
    expect(a).not.toBe(b)
  })
})

describe('createSpellFromLibrary', () => {
  const source = { name: 'Fireball', level: 3, desc: 'Boom', prepared: true } as CharacterSpell

  it('copies the spell with a fresh id and prepared=false', () => {
    const copy = createSpellFromLibrary(source)
    expect(copy.name).toBe('Fireball')
    expect(copy.id).toBeTruthy()
    expect(copy.prepared).toBe(false)
  })

  it('does not mutate the source spell', () => {
    createSpellFromLibrary(source)
    expect(source.prepared).toBe(true)
    expect(source.id).toBeUndefined()
  })
})

describe('createBlankSpell', () => {
  it('returns the manual-entry defaults', () => {
    const spell = createBlankSpell()
    expect(spell).toMatchObject({
      name: 'New Spell',
      level: 1,
      desc: 'Enter spell description...',
      prepared: false,
    })
    expect(spell.id).toBeTruthy()
  })
})

describe('removeSpellById', () => {
  it('removes in place and returns true when found', () => {
    const spells = [{ id: 'a' }, { id: 'b' }] as CharacterSpell[]
    expect(removeSpellById(spells, 'a')).toBe(true)
    expect(spells.map((s) => s.id)).toEqual(['b'])
  })

  it('returns false and leaves the list alone when not found', () => {
    const spells = [{ id: 'a' }] as CharacterSpell[]
    expect(removeSpellById(spells, 'zzz')).toBe(false)
    expect(spells).toHaveLength(1)
  })
})
