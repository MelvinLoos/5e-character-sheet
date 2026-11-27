import { describe, it, expect, afterEach } from 'vitest'
import {
  SUBCLASS_CHOICE_IDS,
  allClassFeatureChoices,
  classFeatureChoices,
  setCustomSubclassSource,
  subclassOptionId,
  subclassToOption,
  tierForLevel,
  withCustomSubclasses,
} from '@/domain/customSubclasses'
import { CLASSES } from '@/data/classes'
import type { SubclassImport } from '@/types/rules'

const duelist: SubclassImport = {
  name: 'Blade Dancer',
  parentClass: 'Fighter',
  description: 'Graceful steel.',
  features: [
    { name: 'Opening Flourish', level: 3, description: 'First.' },
    { name: 'Whirl', level: 7, description: 'Second.' },
    { name: 'Dancing Death', level: 14, description: 'Third.' },
  ],
}

afterEach(() => setCustomSubclassSource(() => []))

describe('subclassOptionId', () => {
  it('slugs class and name behind a custom- prefix', () => {
    expect(subclassOptionId({ name: ' Circle of the Moon! ', parentClass: 'Druid' })).toBe(
      'custom-druid-circle-of-the-moon',
    )
  })
})

describe('tierForLevel', () => {
  it.each([
    [1, undefined],
    [2, undefined],
    [3, 1],
    [5, 1],
    [6, 2],
    [7, 2],
    [10, 3],
    [14, 4],
    [20, 4],
  ])('level %i -> tier %s', (level, tier) => expect(tierForLevel(level)).toBe(tier))
})

describe('subclassToOption', () => {
  it('maps features to class-feature traits gated by level and tier', () => {
    const option = subclassToOption(duelist)
    expect(option.id).toBe('custom-fighter-blade-dancer')
    expect(option.label).toBe('Blade Dancer')
    expect(option.traits.map((t) => [t.title, t.minLevel, t.minTier, t.featureType])).toEqual([
      ['Opening Flourish', 3, 1, 'Class Feature'],
      ['Whirl', 7, 2, 'Class Feature'],
      ['Dancing Death', 14, 4, 'Class Feature'],
    ])
  })
})

describe('classFeatureChoices', () => {
  it('returns the static list when nothing is registered', () => {
    expect(classFeatureChoices('Fighter')).toBe(CLASSES.Fighter!.featureChoices)
    expect(classFeatureChoices(null)).toEqual([])
  })

  it('appends custom options to the class subclass choice only', () => {
    setCustomSubclassSource(() => [duelist])
    const choices = classFeatureChoices('Fighter')
    const sub = choices.find((c) => c.id === 'fighter-subclass')!
    const staticSub = CLASSES.Fighter!.featureChoices!.find((c) => c.id === 'fighter-subclass')!
    expect(sub.options!.length).toBe(staticSub.options!.length + 1)
    expect(sub.options!.some((o) => o.id === 'custom-fighter-blade-dancer')).toBe(true)
    expect(classFeatureChoices('Wizard')).toBe(CLASSES.Wizard!.featureChoices)
  })

  it('matches parentClass case-insensitively and lets later duplicates win', () => {
    setCustomSubclassSource(() => [
      { ...duelist, parentClass: 'fighter', description: 'old' },
      { ...duelist, description: 'new' },
    ])
    const sub = classFeatureChoices('Fighter').find((c) => c.id === 'fighter-subclass')!
    const added = sub.options!.filter((o) => o.id === 'custom-fighter-blade-dancer')
    expect(added).toHaveLength(1)
    expect(added[0]!.description).toBe('new')
  })

  it('allClassFeatureChoices includes custom options', () => {
    setCustomSubclassSource(() => [duelist])
    const ids = allClassFeatureChoices()
      .flatMap((c) => c.options ?? [])
      .map((o) => o.id)
    expect(ids).toContain('custom-fighter-blade-dancer')
  })

  it('every subclass choice id exists on a class', () => {
    const present = new Set(
      Object.values(CLASSES).flatMap((c) => (c.featureChoices ?? []).map((f) => f.id)),
    )
    for (const id of SUBCLASS_CHOICE_IDS) expect(present.has(id)).toBe(true)
  })
})

describe('withCustomSubclasses', () => {
  it('scopes the list and restores the previous source', () => {
    setCustomSubclassSource(() => [])
    const inside = withCustomSubclasses([duelist], () =>
      classFeatureChoices('Fighter').some((c) => c.options?.some((o) => o.id.startsWith('custom-'))),
    )
    expect(inside).toBe(true)
    expect(classFeatureChoices('Fighter')).toBe(CLASSES.Fighter!.featureChoices)
  })

  it('restores the source when fn throws', () => {
    expect(() =>
      withCustomSubclasses([duelist], () => {
        throw new Error('boom')
      }),
    ).toThrow('boom')
    expect(classFeatureChoices('Fighter')).toBe(CLASSES.Fighter!.featureChoices)
  })
})
