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

  describe('Warlock', () => {
    it('has a Warlock entry', () => {
      expect(CLASSES.Warlock).toBeDefined()
    })

    it('is a pact-magic caster via CLASS_SPELLCASTING_FEATS', () => {
      const spellcasting = CLASS_SPELLCASTING_FEATS.Warlock
      expect(spellcasting).toBeDefined()
      expect(spellcasting.casterType).toBe('pact')
    })

    it('has 3 Tier 1 features: Magical Cunning, Warlock Subclass, Contact Patron', () => {
      const titles = CLASSES.Warlock?.features.map((f) => f.title)
      expect(titles).toEqual(
        expect.arrayContaining([
          'Magical Cunning',
          'Warlock Subclass',
          'Contact Patron',
        ]),
      )
      expect(CLASSES.Warlock?.features).toHaveLength(3)
    })

    it('has Contact Patron gated at minTier 2', () => {
      const contactPatron = CLASSES.Warlock?.features.find(
        (f) => f.title === 'Contact Patron',
      )
      expect(contactPatron).toBeDefined()
      expect(contactPatron?.minTier).toBe(2)
    })

    it('has Magical Cunning with 1 use per Long Rest', () => {
      const magicalCunning = CLASSES.Warlock?.features.find(
        (f) => f.title === 'Magical Cunning',
      )
      expect(magicalCunning?.uses).toEqual({ total: 1, per: 'Long Rest' })
    })

    it('has Eldritch Invocations featureChoice with 10 options', () => {
      const choices = CLASSES.Warlock?.featureChoices
      expect(choices).toBeDefined()
      const invocations = choices?.find((c) => c.id === 'eldritch-invocations')
      expect(invocations).toBeDefined()
      expect(invocations?.label).toBe('Eldritch Invocations')
      expect(invocations?.count).toBe(2)
      expect(invocations?.scalesPerTier).toBe(true)
      expect(invocations?.options).toHaveLength(10)
    })

    it('has invocation options with correct trait titles', () => {
      const invocations = CLASSES.Warlock?.featureChoices?.find(
        (c) => c.id === 'eldritch-invocations',
      )
      const optionTitles = invocations?.options?.map((o) => o.label)
      expect(optionTitles).toEqual(
        expect.arrayContaining([
          'Agonizing Blast',
          'Armor of Shadows',
          "Devil's Sight",
          'Repelling Blast',
          'Mask of Many Faces',
          'Eldritch Mind',
          'Fiendish Vigor',
          'Eldritch Sight',
          'Otherworldly Leap',
          'Lessons of the First Ones',
        ]),
      )
    })

    it('has prerequisite gating on Agonizing Blast, Repelling Blast, and Lessons of the First Ones', () => {
      const invocations = CLASSES.Warlock?.featureChoices?.find(
        (c) => c.id === 'eldritch-invocations',
      )
      const withPrereqs = invocations?.options?.filter((o) => o.prerequisite)
      expect(withPrereqs?.map((o) => o.id)).toEqual(
        expect.arrayContaining([
          'agonizing-blast',
          'repelling-blast',
          'lessons-of-the-first-ones',
        ]),
      )
    })
  })
})
