import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '@/stores/character'
import { useProgressionStore } from '@/stores/progression'
import { createBlankCharacter } from '@/domain'
import { applyBackgroundBonuses } from '@/utils/characterMutations'
import type { CharacterData, CharacterFeature } from '@/types/character'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_8 = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }

function makeChar(overrides: Partial<CharacterData> = {}): CharacterData {
  return {
    ...createBlankCharacter(),
    pointBuyBaseScores: { ...BASE_8 },
    abilityScores: { ...BASE_8 },
    backgroundBonusSelections: { plusTwo: null, plusOne: null },
    class: 'Fighter',
    renownTier: 1,
    ...overrides,
  } as CharacterData
}

// ---------------------------------------------------------------------------
// Background bonuses stack on top of the point buy cap (final 16/17/18)
// ---------------------------------------------------------------------------

describe('background bonuses stack on top of the point buy cap', () => {
  it('allows a base 15 to reach 17 with a +2 background bonus', () => {
    const char = makeChar({
      pointBuyBaseScores: { ...BASE_8, str: 15 },
      backgroundBonusSelections: { plusTwo: 'str', plusOne: null },
    })

    const result = applyBackgroundBonuses(char)

    expect(result.abilityScores.str).toBe(17) // 15 + 2
    expect(result.pointBuyBaseScores.str).toBe(15) // base is never mutated
  })

  it('allows a base 15 to reach 16 with a +1 background bonus', () => {
    const char = makeChar({
      pointBuyBaseScores: { ...BASE_8, str: 15 },
      backgroundBonusSelections: { plusTwo: null, plusOne: 'str' },
    })

    const result = applyBackgroundBonuses(char)

    expect(result.abilityScores.str).toBe(16) // 15 + 1
    expect(result.pointBuyBaseScores.str).toBe(15)
  })

  it('lets feature modifiers push the final score past the 15 base cap', () => {
    const char = makeChar({
      pointBuyBaseScores: { ...BASE_8, str: 15 },
      backgroundBonusSelections: { plusTwo: 'str', plusOne: null },
      features: [{ title: 'ASI', desc: '', abilityModifiers: { str: 1 } } as CharacterFeature],
    })

    const result = applyBackgroundBonuses(char)

    expect(result.abilityScores.str).toBe(18) // 15 + 2 (bg) + 1 (feature)
    expect(result.pointBuyBaseScores.str).toBe(15)
  })
})

// ---------------------------------------------------------------------------
// Point buy cost is isolated from background bonuses
// ---------------------------------------------------------------------------

describe('point buy cost is isolated from background bonuses', () => {
  let charStore: ReturnType<typeof useCharacterStore>
  let progStore: ReturnType<typeof useProgressionStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    charStore = useCharacterStore()
    progStore = useProgressionStore()
  })

  it('computes cost from base scores only, ignoring background selections', () => {
    // 15→9, 14→7, 13→5, 12→4, 10→2, 8→0 = 27
    charStore.currentCharacterData = makeChar({
      pointBuyBaseScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      backgroundBonusSelections: { plusTwo: 'str', plusOne: 'dex' },
    })

    expect(progStore.pointBuyPointsUsed).toBe(27)
    expect(progStore.pointBuyPointsRemaining).toBe(0)

    // Removing the background selections must not change the cost.
    charStore.currentCharacterData.backgroundBonusSelections = { plusTwo: null, plusOne: null }
    expect(progStore.pointBuyPointsUsed).toBe(27)
    expect(progStore.pointBuyPointsRemaining).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// adjustPointBuyScore enforces the base cap only (never the final score)
// ---------------------------------------------------------------------------

describe('adjustPointBuyScore enforces the base cap only', () => {
  let charStore: ReturnType<typeof useCharacterStore>
  let progStore: ReturnType<typeof useProgressionStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    charStore = useCharacterStore()
    progStore = useProgressionStore()
  })

  it('refuses to raise a base above 15 even when a bonus already pushed the final above 15', () => {
    charStore.currentCharacterData = makeChar({
      pointBuyBaseScores: { ...BASE_8, str: 15 },
      backgroundBonusSelections: { plusTwo: 'str', plusOne: null },
    })

    progStore.adjustPointBuyScore('str', 1)

    // Final score is 17, but the *base* is already at the 15 cap.
    expect(charStore.currentCharacterData.pointBuyBaseScores.str).toBe(15)
  })

  it('allows a base increment while the final score sits at 15 because of a bonus', () => {
    // base 13 + 2 background bonus = final 15, with budget remaining.
    charStore.currentCharacterData = makeChar({
      pointBuyBaseScores: { ...BASE_8, str: 13 },
      backgroundBonusSelections: { plusTwo: 'str', plusOne: null },
    })

    progStore.adjustPointBuyScore('str', 1)

    // Base may still climb to 14 (final becomes 16).
    expect(charStore.currentCharacterData.pointBuyBaseScores.str).toBe(14)
  })
})


// ---------------------------------------------------------------------------
// recalculateAbilityScores produces 16/17 finals from a base of 15
// ---------------------------------------------------------------------------

describe('recalculateAbilityScores produces 16/17 finals from a base of 15', () => {
  let charStore: ReturnType<typeof useCharacterStore>
  let progStore: ReturnType<typeof useProgressionStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    charStore = useCharacterStore()
    progStore = useProgressionStore()
  })

  it('recalculates a final 17 from base 15 + 2 background bonus without mutating base', () => {
    charStore.currentCharacterData = makeChar({
      pointBuyBaseScores: { ...BASE_8, str: 15 },
      backgroundBonusSelections: { plusTwo: 'str', plusOne: null },
    })

    progStore.recalculateAbilityScores()

    expect(charStore.currentCharacterData.abilityScores.str).toBe(17)
    expect(charStore.currentCharacterData.pointBuyBaseScores.str).toBe(15)
  })
})

// ---------------------------------------------------------------------------
// pointBuyCanIncrementBase — key-based, base-aware increment check
// ---------------------------------------------------------------------------

describe('pointBuyCanIncrementBase', () => {
  let charStore: ReturnType<typeof useCharacterStore>
  let progStore: ReturnType<typeof useProgressionStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    charStore = useCharacterStore()
    progStore = useProgressionStore()
  })

  it('reads the base score rather than the final score when deciding to increment', () => {
    // base 13 + 2 background bonus => final 15.
    charStore.currentCharacterData = makeChar({
      pointBuyBaseScores: { ...BASE_8, str: 13 },
      backgroundBonusSelections: { plusTwo: 'str', plusOne: null },
    })

    // The raw-score helper sees the final value of 15 and wrongly reports "max".
    expect(progStore.pointBuyMaxForScore(15)).toBe(false)
    // The base-aware helper correctly reports the base can still climb.
    expect(progStore.pointBuyCanIncrementBase('str')).toBe(true)
  })

  it('returns false when the base score is already 15', () => {
    charStore.currentCharacterData = makeChar({
      pointBuyBaseScores: { ...BASE_8, str: 15 },
    })

    expect(progStore.pointBuyCanIncrementBase('str')).toBe(false)
  })

  it('returns false when the base is below 15 but no points remain', () => {
    // 15→9, 14→7, 13→5, 12→4, 10→2, 8→0 = 27 (no budget left).
    charStore.currentCharacterData = makeChar({
      pointBuyBaseScores: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
    })

    expect(progStore.pointBuyCanIncrementBase('dex')).toBe(false) // 14→15 costs +2, 0 left
    expect(progStore.pointBuyCanIncrementBase('str')).toBe(false) // already at the 15 cap
  })
})

// ---------------------------------------------------------------------------
// Base score coercion robustness
// ---------------------------------------------------------------------------

describe('adjustPointBuyScore base coercion', () => {
  let charStore: ReturnType<typeof useCharacterStore>
  let progStore: ReturnType<typeof useProgressionStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    charStore = useCharacterStore()
    progStore = useProgressionStore()
  })

  it('does not coerce an explicit 0 base score into 8', () => {
    charStore.currentCharacterData = makeChar({
      pointBuyBaseScores: { ...BASE_8, str: 0 },
    })

    progStore.adjustPointBuyScore('str', 1)

    // A value of 0 is below the legal 8 floor, so the increment is rejected
    // (it must not be silently treated as a base of 8 and bumped to 9).
    expect(charStore.currentCharacterData.pointBuyBaseScores.str).toBe(0)
  })
})

