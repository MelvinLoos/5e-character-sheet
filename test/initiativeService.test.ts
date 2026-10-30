import { describe, it, expect } from 'vitest'
import { createBlankCharacter, resetInitiativeFeatures, rollInitiative } from '@/domain'
import type { CharacterFeature } from '@/types/character'

/** rng returning values that make d20 produce the given faces in order. */
function seq(...faces: number[]): () => number {
  let i = 0
  return () => (faces[i++]! - 1) / 20
}

describe('rollInitiative', () => {
  it('rolls d20 plus modifier', () => {
    expect(rollInitiative(3, 'normal', seq(14))).toEqual({
      mode: 'normal', mod: 3, rolls: [14], kept: 14, total: 17,
    })
  })
  it('handles negative modifiers', () => {
    expect(rollInitiative(-2, 'normal', seq(1)).total).toBe(-1)
  })
  it('keeps the higher die with advantage', () => {
    const r = rollInitiative(2, 'advantage', seq(7, 14))
    expect(r.rolls).toEqual([7, 14])
    expect(r.kept).toBe(14)
    expect(r.total).toBe(16)
  })
  it('keeps the lower die with disadvantage', () => {
    const r = rollInitiative(2, 'disadvantage', seq(7, 14))
    expect(r.kept).toBe(7)
    expect(r.total).toBe(9)
  })
  it('covers faces 1 to 20', () => {
    expect(rollInitiative(0, 'normal', () => 0).kept).toBe(1)
    expect(rollInitiative(0, 'normal', () => 0.999).kept).toBe(20)
  })
})

describe('resetInitiativeFeatures', () => {
  const feat = (title: string, reset: string): CharacterFeature =>
    ({ title, desc: '', used: 1, resource: { resourceType: 'static', value: 1, reset } }) as CharacterFeature

  it('clears only Initiative features', () => {
    const c = createBlankCharacter()
    c.features = [feat('A', 'Initiative'), feat('B', 'Short Rest'), feat('C', 'initiative')]
    const next = resetInitiativeFeatures(c)
    expect(next.features.map((f) => f.used)).toEqual([0, 1, 0])
    expect(c.features[0]!.used).toBe(1)
  })
  it('honours legacy uses.per', () => {
    const c = createBlankCharacter()
    c.features = [{ title: 'L', desc: '', used: 1, uses: { total: 1, per: 'initiative' } } as CharacterFeature]
    expect(resetInitiativeFeatures(c).features[0]!.used).toBe(0)
  })
})
