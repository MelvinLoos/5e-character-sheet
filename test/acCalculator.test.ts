import { describe, it, expect } from 'vitest'
import { calculateArmorClass } from '@/utils/acCalculator'
import type { EquippedGear } from '@/types/character'

function gear(id: string, name: string = id): EquippedGear {
  return {
    id,
    name,
    type: 'gear',
    description: '',
    slotCost: 1,
  }
}

describe('calculateArmorClass', () => {
  describe('unarmored', () => {
    it('returns 10 + positive DEX modifier when no armor is equipped', () => {
      expect(calculateArmorClass([], 2)).toBe(12)
    })

    it('returns 10 + negative DEX modifier when no armor is equipped', () => {
      expect(calculateArmorClass([], -1)).toBe(9)
    })

    it('returns 10 with DEX 10', () => {
      expect(calculateArmorClass([], 0)).toBe(10)
    })
  })

  describe('light armor', () => {
    it('adds full DEX modifier to leather armor base AC', () => {
      expect(calculateArmorClass([gear('leather')], 3)).toBe(14)
    })

    it('adds negative DEX modifier to leather armor base AC', () => {
      expect(calculateArmorClass([gear('leather')], -1)).toBe(10)
    })

    it('adds full positive DEX modifier to studded leather armor', () => {
      expect(calculateArmorClass([gear('studded-leather')], 5)).toBe(17)
    })
  })

  describe('medium armor', () => {
    it('caps DEX bonus at +2 for scale mail', () => {
      expect(calculateArmorClass([gear('scale-mail')], 4)).toBe(16)
    })

    it('uses exact DEX bonus when it equals the +2 cap', () => {
      expect(calculateArmorClass([gear('scale-mail')], 2)).toBe(16)
    })

    it('uses lower DEX bonus when below the cap', () => {
      expect(calculateArmorClass([gear('scale-mail')], 1)).toBe(15)
    })

    it('applies negative DEX modifier to medium armor', () => {
      expect(calculateArmorClass([gear('scale-mail')], -1)).toBe(13)
    })
  })

  describe('heavy armor', () => {
    it('ignores positive DEX modifier for chain mail', () => {
      expect(calculateArmorClass([gear('chain-mail')], 2)).toBe(16)
    })

    it('ignores negative DEX modifier entirely for chain mail', () => {
      expect(calculateArmorClass([gear('chain-mail')], -1)).toBe(16)
    })

    it('ignores DEX for plate armor', () => {
      expect(calculateArmorClass([gear('plate')], 5)).toBe(18)
    })
  })

  describe('shields', () => {
    it('adds +2 when only a shield is equipped', () => {
      expect(calculateArmorClass([gear('shield')], 2)).toBe(14)
    })

    it('adds +2 to light armor when a shield is equipped', () => {
      expect(calculateArmorClass([gear('leather'), gear('shield')], 3)).toBe(16)
    })

    it('adds +2 to heavy armor when a shield is equipped', () => {
      expect(calculateArmorClass([gear('chain-mail'), gear('shield')], 2)).toBe(18)
    })
  })

  describe('multiple armors', () => {
    it('picks the highest AC when both leather and plate are equipped', () => {
      expect(calculateArmorClass([gear('leather'), gear('plate')], 2)).toBe(18)
    })

    it('picks the highest AC when two medium armors tie', () => {
      expect(calculateArmorClass([gear('studded-leather'), gear('hide')], 2)).toBe(14)
    })

    it('picks the higher AC when chain shirt beats leather', () => {
      expect(calculateArmorClass([gear('chain-shirt'), gear('leather')], 2)).toBe(15)
    })
  })

  describe('non-armor gear', () => {
    it('ignores weapons and adventuring gear', () => {
      expect(calculateArmorClass([gear('longsword'), gear('backpack')], 2)).toBe(12)
    })
  })
})
