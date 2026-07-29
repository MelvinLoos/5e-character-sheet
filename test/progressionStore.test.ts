import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '@/stores/character'
import { useProgressionStore } from '@/stores/progression'
import { createBlankCharacter } from '@/domain'
import type { CharacterData } from '@/types/character'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeChar(overrides: Partial<CharacterData> = {}): CharacterData {
  const baseScores = { str: 16, dex: 14, con: 14, int: 10, wis: 10, cha: 10 }

  return {
    ...createBlankCharacter(),
    pointBuyBaseScores: { ...baseScores },
    abilityScores: { ...baseScores },
    backgroundBonusSelections: { plusTwo: null, plusOne: null },
    class: 'Fighter',
    renownTier: 1,
    profBonus: 2,
    combat: { ac: 16, hp_max: 28, hp_current: 28, speed: '30ft' },
    ...overrides,
  } as CharacterData
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useProgressionStore', () => {
  let charStore: ReturnType<typeof useCharacterStore>
  let progStore: ReturnType<typeof useProgressionStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    charStore = useCharacterStore()
    charStore.currentCharacterData = makeChar()
    progStore = useProgressionStore()
  })

  describe('derivedLevel and profBonus', () => {
    it('update reactively when renownTier changes', () => {
      expect(progStore.derivedLevel).toBe(3)   // tier 1 → 3
      expect(progStore.profBonus).toBe(2)       // level 3 → PB +2

      charStore.currentCharacterData.renownTier = 2
      expect(progStore.derivedLevel).toBe(6)   // tier 2 → 6
      expect(progStore.profBonus).toBe(3)       // level 6 → PB +3

      charStore.currentCharacterData.renownTier = 3
      expect(progStore.derivedLevel).toBe(10)  // tier 3 → 10
      expect(progStore.profBonus).toBe(4)       // level 10 → PB +4
    })
  })

  describe('maxHp', () => {
    it('calculates hit points based on class, level, and CON', () => {
      // Fighter tier 1 (level 3), CON 14 (+2)
      // hitDice 10 + conMod 2 = 12
      // Levels 2-3: (hitDiceAverage 6 + conMod 2) * 2 = 16
      // Total: 28
      expect(progStore.maxHp).toBe(28)
    })

    it('updates when tier changes', () => {
      charStore.currentCharacterData.renownTier = 2 // level 6
      // Tier 2 (level 6): 12 + (8 * 5) = 12 + 40 = 52
      expect(progStore.maxHp).toBe(52)
    })
  })

  describe('pointBuy getters', () => {
    it('tracks pointBuyPointsUsed and remaining', () => {
      // Base scores: str:16, dex:14, con:14, int:10, wis:10, cha:10
      // Cost: 16→12? Wait, point-buy max is 15, but abilityScores includes bonuses...
      // pointBuyBaseScores are what matter for cost calculation
      charStore.currentCharacterData.pointBuyBaseScores = {
        str: 15, dex: 14, con: 13, int: 10, wis: 10, cha: 8,
      }
      // Costs: 15→9, 14→7, 13→5, 10→2, 10→2, 8→0 = 25
      expect(progStore.pointBuyPointsUsed).toBe(25)
      expect(progStore.pointBuyPointsRemaining).toBe(2)
    })

    it('pointBuyCostForScore returns correct costs', () => {
      const costFn = progStore.pointBuyCostForScore
      expect(costFn(8)).toBe(0)
      expect(costFn(14)).toBe(7)
      expect(costFn(15)).toBe(9)
    })

    it('pointBuyMaxForScore prevents invalid increments', () => {
      // With only 2 points remaining, can we increment from 13 (cost 5) to 14 (cost 7)?
      // That would cost +2, and remaining is 2, so yes
      charStore.currentCharacterData.pointBuyBaseScores = {
        str: 15, dex: 14, con: 13, int: 10, wis: 10, cha: 8,
      }
      const maxFn = progStore.pointBuyMaxForScore
      // Can increment from 13→14? (7-5=2, remaining=2) → true
      expect(maxFn(13)).toBe(true)
      // Can increment from 14→15? (9-7=2, remaining=2) → true
      expect(maxFn(14)).toBe(true)
      // 15 is already max → false
      expect(maxFn(15)).toBe(false)
      // Below 8 → false
      expect(maxFn(7)).toBe(false)
    })
  })

  describe('adjustPointBuyScore', () => {
    it('increments score when points are available', () => {
      charStore.currentCharacterData.pointBuyBaseScores = {
        str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8,
      }
      // All 27 points available
      progStore.adjustPointBuyScore('str', 1)
      expect(charStore.currentCharacterData.pointBuyBaseScores['str']).toBe(9)
    })

    it('prevents increasing when score is already 15', () => {
      charStore.currentCharacterData.pointBuyBaseScores = {
        str: 15, dex: 8, con: 8, int: 8, wis: 8, cha: 8,
      }
      progStore.adjustPointBuyScore('str', 1)
      expect(charStore.currentCharacterData.pointBuyBaseScores['str']).toBe(15) // unchanged
    })

    it('prevents increasing when remaining points are insufficient', () => {
      // Spend 25 points, leaving 2
      charStore.currentCharacterData.pointBuyBaseScores = {
        str: 15, dex: 14, con: 13, int: 10, wis: 10, cha: 8,
      }
      // 25 points used, 2 remaining
      // Try to increment DEX 14→15 (cost +2, exactly 2 remaining) → should work
      progStore.adjustPointBuyScore('dex', 1)
      expect(charStore.currentCharacterData.pointBuyBaseScores['dex']).toBe(15)
      // Now 0 remaining, try to increment CON 13→14 (cost +2) → should fail
      progStore.adjustPointBuyScore('con', 1)
      expect(charStore.currentCharacterData.pointBuyBaseScores['con']).toBe(13) // unchanged
    })
  })

  describe('isValidBonusSelection', () => {
    it('returns false when same stat is used for both +2 and +1', () => {
      charStore.currentCharacterData.backgroundBonusSelections = {
        plusTwo: 'str',
        plusOne: 'str',
      }
      const validFn = progStore.isValidBonusSelection
      expect(validFn('str', '+1')).toBe(false)
      expect(validFn('str', '+2')).toBe(false)
    })

    it('detects cross-type conflicts', () => {
      charStore.currentCharacterData.backgroundBonusSelections = {
        plusTwo: 'str',
        plusOne: 'dex',
      }
      const validFn = progStore.isValidBonusSelection
      // Can't give +2 to dex because +1 is already dex → conflict
      expect(validFn('dex', '+2')).toBe(false)
      // Can't give +1 to str because +2 is already str → conflict
      expect(validFn('str', '+1')).toBe(false)
      // Can give +2 to con (not used by +1)
      expect(validFn('con', '+2')).toBe(true)
      // Can give +1 to con (not used by +2)
      expect(validFn('con', '+1')).toBe(true)
    })
  })
})