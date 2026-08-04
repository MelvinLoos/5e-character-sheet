import { describe, it, expect } from 'vitest'
import { CLASSES, CLASS_SPELLCASTING_FEATS } from '../src/data/rules'

describe('CLASSES dictionary', () => {
  describe('Paladin', () => {
    it('has a Paladin entry', () => {
      expect(CLASSES.Paladin).toBeDefined()
    })

    it('is a half-caster via CLASS_SPELLCASTING_FEATS', () => {
      const spellcasting = CLASS_SPELLCASTING_FEATS.Paladin
      expect(spellcasting).toBeDefined()
      expect(spellcasting.casterType).toBe('half')
    })

    it('has 6 non-spellcasting Tier 1 features', () => {
      expect(CLASSES.Paladin?.features).toHaveLength(6)
    })
  })
})
