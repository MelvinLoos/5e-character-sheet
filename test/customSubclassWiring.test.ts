import { describe, it, expect, afterEach } from 'vitest'
import { setCustomSubclassSource } from '@/domain/customSubclasses'
import {
  featureGroup,
  validateFeatureChoices,
  validateSubclass,
  subclassChoiceFor,
} from '@/domain/creationRules'
import { eligibleFeatureChoices } from '@/utils/featureChoiceRules'
import { applyFeatureChoices } from '@/utils/characterMutations'
import { createBlankCharacter } from '@/domain/characterService'
import type { SubclassImport } from '@/types/rules'

const OPTION = 'custom-fighter-blade-dancer'
const bladeDancer: SubclassImport = {
  name: 'Blade Dancer',
  parentClass: 'Fighter',
  features: [
    { name: 'Opening Flourish', level: 3, description: 'First.' },
    { name: 'Whirl', level: 7, description: 'Second.' },
  ],
}

const fighter = (extra: Record<string, unknown> = {}) => ({
  ...createBlankCharacter(),
  class: 'Fighter',
  renownTier: 1,
  featureChoices: { 'fighter-subclass': [OPTION] },
  ...extra,
})

afterEach(() => setCustomSubclassSource(() => []))

describe('custom subclasses in creation rules', () => {
  it('offers the custom option in the subclass choice', () => {
    setCustomSubclassSource(() => [bladeDancer])
    const options = subclassChoiceFor('Fighter', { renownTier: 1 })!.options!
    expect(options.map((o) => o.id)).toContain(OPTION)
    expect(
      eligibleFeatureChoices('Fighter', { renownTier: 1 })
        .find((c) => c.id === 'fighter-subclass')!
        .options!.map((o) => o.id),
    ).toContain(OPTION)
  })

  it('accepts a registered custom id and rejects an unregistered one', () => {
    const c = fighter()
    expect(validateSubclass(c)[0]).toMatch(/not a Fighter/)
    expect(validateFeatureChoices(c)[0]).toMatch(/not an option/)

    setCustomSubclassSource(() => [bladeDancer])
    expect(validateSubclass(c)).toEqual([])
    expect(validateFeatureChoices(c)).toEqual([])
  })
})

describe('custom subclass traits', () => {
  const titles = (c: { features?: { title: string }[] }) => (c.features ?? []).map((f) => f.title)

  it('applies only the traits the tier unlocks', () => {
    setCustomSubclassSource(() => [bladeDancer])
    const t1 = applyFeatureChoices(fighter({ renownTier: 1 }) as never)
    expect(titles(t1)).toContain('Opening Flourish')
    expect(titles(t1)).not.toContain('Whirl')

    const t2 = applyFeatureChoices(fighter({ renownTier: 2 }) as never)
    expect(titles(t2)).toContain('Whirl')
  })

  it('gates by level in level mode', () => {
    setCustomSubclassSource(() => [bladeDancer])
    const base = { progressionMode: 'level' }
    expect(titles(applyFeatureChoices(fighter({ ...base, level: 6 }) as never))).not.toContain('Whirl')
    expect(titles(applyFeatureChoices(fighter({ ...base, level: 7 }) as never))).toContain('Whirl')
  })

  it('removes the traits when the class changes', () => {
    setCustomSubclassSource(() => [bladeDancer])
    const applied = applyFeatureChoices(fighter({ renownTier: 2 }) as never)
    const switched = applyFeatureChoices({ ...applied, class: 'Wizard' } as never)
    expect(titles(switched)).not.toContain('Opening Flourish')
    expect(titles(switched)).not.toContain('Whirl')
  })

  it('groups custom traits as class features by title', () => {
    setCustomSubclassSource(() => [bladeDancer])
    expect(featureGroup({ title: 'Opening Flourish' })).toBe('class')
  })
})
