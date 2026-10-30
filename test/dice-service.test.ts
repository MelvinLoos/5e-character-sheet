import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  DICE_TYPES,
  HAPTIC_CRIT,
  HAPTIC_FUMBLE,
  HAPTIC_TAP,
  MAX_DICE,
  MAX_MODIFIER,
  buildNotation,
  clampDice,
  clampModifier,
  formatNotation,
  hapticPattern,
  rollDice,
  summarizeRoll,
  triggerHaptics,
  type RawRollResult,
} from '@/domain'

/** Build an engine-shaped aggregate result for the given dice. */
function rawRoll(sides: number, values: number[], modifier = 0): RawRollResult {
  const rolls = values.map((value, id) => ({ type: `d${sides}`, sides, id, value }))
  const diceTotal = values.reduce((sum, value) => sum + value, 0)
  return {
    notation: formatNotation(values.length, sides, modifier),
    sets: [{ num: values.length, type: `d${sides}`, sides, rolls, total: diceTotal }],
    modifier,
    total: diceTotal + modifier,
  }
}

/** rng that makes a die produce the given faces in order. */
function seq(faces: number[], sides: number): () => number {
  let index = 0
  return () => (faces[index++]! - 1) / sides
}

describe('DICE_TYPES', () => {
  it('offers the seven standard polyhedral dice', () => {
    expect([...DICE_TYPES]).toEqual([4, 6, 8, 10, 12, 20, 100])
  })
})

describe('formatNotation', () => {
  it('omits a zero modifier', () => {
    expect(formatNotation(1, 20)).toBe('1d20')
    expect(formatNotation(4, 6, 0)).toBe('4d6')
  })

  it('renders positive and negative modifiers', () => {
    expect(formatNotation(2, 6, 3)).toBe('2d6+3')
    expect(formatNotation(1, 20, -1)).toBe('1d20-1')
  })
})

describe('buildNotation', () => {
  it('builds a plain command without predetermined values', () => {
    expect(buildNotation(1, 20)).toBe('1d20')
    expect(buildNotation(2, 6, 3)).toBe('2d6+3')
  })

  it('appends predetermined values after the modifier', () => {
    // The engine splits on `@` before parsing the dice expression, so the
    // modifier has to come first.
    expect(buildNotation(1, 20, 0, [20])).toBe('1d20@20')
    expect(buildNotation(3, 6, 2, [4, 4, 4])).toBe('3d6+2@4,4,4')
  })

  it('ignores an empty predetermined list', () => {
    expect(buildNotation(1, 20, 5, [])).toBe('1d20+5')
  })
})

describe('clampDice', () => {
  it('keeps counts within 1..MAX_DICE', () => {
    expect(clampDice(0)).toBe(1)
    expect(clampDice(-3)).toBe(1)
    expect(clampDice(1)).toBe(1)
    expect(clampDice(99)).toBe(MAX_DICE)
    expect(clampDice(3.7)).toBe(3)
  })

  it('falls back to a single die for non-finite input', () => {
    expect(clampDice(Number.NaN)).toBe(1)
    expect(clampDice(Number.POSITIVE_INFINITY)).toBe(1)
  })
})

describe('clampModifier', () => {
  it('keeps modifiers within ±MAX_MODIFIER', () => {
    expect(clampModifier(1000)).toBe(MAX_MODIFIER)
    expect(clampModifier(-1000)).toBe(-MAX_MODIFIER)
    expect(clampModifier(3.9)).toBe(3)
    expect(clampModifier(Number.NaN)).toBe(0)
  })
})

describe('summarizeRoll', () => {
  it('flags a lone d20 that landed on 20', () => {
    const summary = summarizeRoll(rawRoll(20, [20]))
    expect(summary).toMatchObject({ faces: 20, values: [20], total: 20, isNat20: true, isNat1: false })
  })

  it('flags a lone d20 that landed on 1', () => {
    const summary = summarizeRoll(rawRoll(20, [1]))
    expect(summary.isNat1).toBe(true)
    expect(summary.isNat20).toBe(false)
  })

  it('adds the modifier to the total without affecting the natural flags', () => {
    const summary = summarizeRoll(rawRoll(20, [20], 5))
    expect(summary.total).toBe(25)
    expect(summary.modifier).toBe(5)
    expect(summary.isNat20).toBe(true)
  })

  it('reports a clean display notation without the predetermined suffix', () => {
    expect(summarizeRoll(rawRoll(20, [20], 5)).notation).toBe('1d20+5')
  })

  it('never flags natural 20/1 on a multi-die roll', () => {
    const summary = summarizeRoll(rawRoll(6, [1, 2, 3]))
    expect(summary.values).toEqual([1, 2, 3])
    expect(summary.total).toBe(6)
    expect(summary.isNat1).toBe(false)
    expect(summary.isNat20).toBe(false)
  })

  it('never flags a natural 20 when two d20s are rolled', () => {
    expect(summarizeRoll(rawRoll(20, [20, 20])).isNat20).toBe(false)
  })

  it('flattens multiple sets and uses the first die for the face count', () => {
    const raw: RawRollResult = {
      notation: '1d20+2d6',
      sets: [
        { num: 1, type: 'd20', sides: 20, rolls: [{ sides: 20, value: 14 }], total: 14 },
        { num: 2, type: 'd6', sides: 6, rolls: [{ sides: 6, value: 3 }, { sides: 6, value: 4 }], total: 7 },
      ],
      modifier: 0,
      total: 21,
    }
    const summary = summarizeRoll(raw)
    expect(summary.values).toEqual([14, 3, 4])
    expect(summary.faces).toBe(20)
    expect(summary.total).toBe(21)
  })
})

describe('rollDice (instant fallback)', () => {
  it('uses the injected rng', () => {
    expect(rollDice(3, 6, 0, seq([2, 5, 6], 6)).values).toEqual([2, 5, 6])
  })

  it('applies the modifier and honours predetermined values', () => {
    const summary = rollDice(2, 6, 3, seq([1, 1], 6), [6, 4])
    expect(summary.values).toEqual([6, 4])
    expect(summary.total).toBe(13)
    expect(summary.notation).toBe('2d6+3')
  })

  it('clamps predetermined values into the die range', () => {
    expect(rollDice(3, 6, 0, seq([1, 1, 1], 6), [0, 99, 3]).values).toEqual([1, 6, 3])
  })

  it('clamps the count and the modifier', () => {
    const summary = rollDice(99, 6, 1000, seq(Array(MAX_DICE).fill(1), 6))
    expect(summary.values).toHaveLength(MAX_DICE)
    expect(summary.modifier).toBe(MAX_MODIFIER)
  })
})

describe('hapticPattern', () => {
  it('uses the strong triple pulse for a Natural 20', () => {
    expect(hapticPattern(summarizeRoll(rawRoll(20, [20])))).toEqual(HAPTIC_CRIT)
  })

  it('uses a long buzz for a Natural 1', () => {
    expect(hapticPattern(summarizeRoll(rawRoll(20, [1])))).toEqual(HAPTIC_FUMBLE)
  })

  it('uses a short tap otherwise', () => {
    expect(hapticPattern(summarizeRoll(rawRoll(20, [7])))).toBe(HAPTIC_TAP)
    expect(hapticPattern(summarizeRoll(rawRoll(6, [1, 2, 3])))).toBe(HAPTIC_TAP)
  })
})

describe('triggerHaptics', () => {
  afterEach(() => {
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: undefined })
  })

  it('forwards the pattern to the injected vibrate function', () => {
    const vibrate = vi.fn(() => true)
    expect(triggerHaptics(HAPTIC_CRIT, vibrate)).toBe(true)
    expect(vibrate).toHaveBeenCalledWith(HAPTIC_CRIT)
  })

  it('reads navigator.vibrate when no function is injected', () => {
    const vibrate = vi.fn(() => true)
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate })
    expect(triggerHaptics(HAPTIC_TAP)).toBe(true)
    expect(vibrate).toHaveBeenCalledWith(HAPTIC_TAP)
  })

  it('degrades to a no-op when navigator.vibrate is missing (iOS Safari)', () => {
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: undefined })
    expect(triggerHaptics(HAPTIC_TAP)).toBe(false)
  })

  it('never throws when vibrate does', () => {
    const vibrate = vi.fn(() => {
      throw new Error('blocked by permissions policy')
    })
    expect(triggerHaptics(HAPTIC_TAP, vibrate)).toBe(false)
  })
})
