import { describe, it, expect } from 'vitest'
import { CLASSES } from '../src/data/rules'

describe('CLASSES dictionary', () => {
  describe('Paladin', () => {
    it('has a Paladin entry', () => {
      expect(CLASSES.Paladin).toBeDefined()
    })

    it('is a half-caster', () => {
      const spellcasting = CLASSES.Paladin?.features.find(
        (feature) => feature.title === 'Spellcasting',
      )
      expect(spellcasting).toBeDefined()
      expect(spellcasting?.casterType).toBe('half')
    })

    it('has exactly 7 Tier 1 features', () => {
      expect(CLASSES.Paladin?.features).toHaveLength(7)
    })
  })

  describe('Monk', () => {
    it('has a Monk entry', () => {
      expect(CLASSES.Monk).toBeDefined()
    })

    it('has hit dice of 8 (average 5)', () => {
      expect(CLASSES.Monk?.hitDice).toBe(8)
      expect(CLASSES.Monk?.hitDiceAverage).toBe(5)
    })

    it('has saving throws str and dex', () => {
      expect(CLASSES.Monk?.savingThrows).toEqual(['str', 'dex'])
    })

    it('offers 2 skill choices from the correct list', () => {
      expect(CLASSES.Monk?.skillChoices?.count).toBe(2)
      expect(CLASSES.Monk?.skillChoices?.from).toEqual([
        'Acrobatics',
        'Athletics',
        'History',
        'Insight',
        'Religion',
        'Stealth',
      ])
    })

    it('includes all 6 Tier 1 features', () => {
      const titles = CLASSES.Monk?.features.map((feature) => feature.title)
      expect(CLASSES.Monk?.features).toHaveLength(6)
      expect(titles).toEqual(
        expect.arrayContaining([
          'Martial Arts',
          'Unarmored Defense',
          "Monk's Focus",
          'Unarmored Movement',
          'Deflect Attacks',
          'Monk Subclass',
        ]),
      )
    })

    it('has Martial Arts as a key feature', () => {
      const martialArts = CLASSES.Monk?.features.find(
        (feature) => feature.title === 'Martial Arts',
      )
      expect(martialArts).toBeDefined()
      expect(martialArts?.key).toBe(true)
    })

    it('is not a spellcaster', () => {
      const spellcasting = CLASSES.Monk?.features.find(
        (feature) => feature.casterType !== undefined && feature.casterType !== null,
      )
      expect(spellcasting).toBeUndefined()
    })
  })
})
