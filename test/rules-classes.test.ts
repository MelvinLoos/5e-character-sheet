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
})
