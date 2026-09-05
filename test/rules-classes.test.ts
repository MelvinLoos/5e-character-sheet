import { describe, it, expect } from 'vitest'
import { CLASSES, CLASS_SPELLCASTING_FEATS } from '../src/data/rules'

describe('CLASSES dictionary', () => {
  describe('Fighter', () => {
    it('has a Fighter entry', () => {
      expect(CLASSES.Fighter).toBeDefined()
    })

    it('has both fighting-style and fighter-subclass featureChoices', () => {
      const choices = CLASSES.Fighter?.featureChoices
      expect(choices).toBeDefined()
      expect(choices).toHaveLength(2)
      const ids = choices?.map((c) => c.id)
      expect(ids).toEqual(['fighting-style', 'fighter-subclass'])
    })

    it('has Champion subclass with 6 traits across tiers', () => {
      const subclass = CLASSES.Fighter?.featureChoices?.find(
        (c) => c.id === 'fighter-subclass',
      )
      expect(subclass).toBeDefined()
      expect(subclass?.count).toBe(1)
      const champion = subclass?.options?.find((o) => o.id === 'champion')
      expect(champion).toBeDefined()
      expect(champion?.traits).toHaveLength(6)

      const traitTitles = champion?.traits.map((t) => t.title)
      expect(traitTitles).toEqual([
        'Improved Critical',
        'Remarkable Athlete',
        'Additional Fighting Style',
        'Heroic Warrior',
        'Superior Critical',
        'Survivor',
      ])

      // Verify minTier gating
      expect(champion?.traits.find((t) => t.title === 'Improved Critical')?.minTier).toBe(1)
      expect(champion?.traits.find((t) => t.title === 'Remarkable Athlete')?.minTier).toBe(1)
      expect(champion?.traits.find((t) => t.title === 'Additional Fighting Style')?.minTier).toBe(2)
      expect(champion?.traits.find((t) => t.title === 'Heroic Warrior')?.minTier).toBe(3)
      expect(champion?.traits.find((t) => t.title === 'Superior Critical')?.minTier).toBe(4)
      expect(champion?.traits.find((t) => t.title === 'Survivor')?.minTier).toBe(4)
    })
  })

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

    it('has paladin-oath featureChoice with Oath of Devotion', () => {
      const choices = CLASSES.Paladin?.featureChoices
      expect(choices).toBeDefined()
      expect(choices).toHaveLength(1)
      const oath = choices?.find((c) => c.id === 'paladin-oath')
      expect(oath).toBeDefined()
      expect(oath?.label).toBe('Sacred Oath')
      expect(oath?.count).toBe(1)
      const devotion = oath?.options?.find((o) => o.id === 'oath-of-devotion')
      expect(devotion).toBeDefined()
      expect(devotion?.traits).toHaveLength(5)

      const traitTitles = devotion?.traits.map((t) => t.title)
      expect(traitTitles).toEqual([
        'Sacred Weapon',
        'Oath Spells (Devotion)',
        'Aura of Devotion',
        'Smite of Protection',
        'Holy Nimbus',
      ])

      expect(devotion?.traits.find((t) => t.title === 'Sacred Weapon')?.minTier).toBe(1)
      expect(devotion?.traits.find((t) => t.title === 'Oath Spells (Devotion)')?.minTier).toBe(1)
      expect(devotion?.traits.find((t) => t.title === 'Aura of Devotion')?.minTier).toBe(2)
      expect(devotion?.traits.find((t) => t.title === 'Smite of Protection')?.minTier).toBe(4)
      expect(devotion?.traits.find((t) => t.title === 'Holy Nimbus')?.minTier).toBe(4)
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

    it('has monk-subclass featureChoice with Warrior of the Open Hand', () => {
      const choices = CLASSES.Monk?.featureChoices
      expect(choices).toBeDefined()
      expect(choices).toHaveLength(1)
      const subclass = choices?.find((c) => c.id === 'monk-subclass')
      expect(subclass).toBeDefined()
      expect(subclass?.label).toBe('Monastic Tradition')
      expect(subclass?.count).toBe(1)
      const openHand = subclass?.options?.find((o) => o.id === 'warrior-of-the-open-hand')
      expect(openHand).toBeDefined()
      expect(openHand?.traits).toHaveLength(4)

      const traitTitles = openHand?.traits.map((t) => t.title)
      expect(traitTitles).toEqual([
        'Open Hand Technique',
        'Wholeness of Body',
        'Fleet Step',
        'Quivering Palm',
      ])

      expect(openHand?.traits.find((t) => t.title === 'Open Hand Technique')?.minTier).toBe(1)
      expect(openHand?.traits.find((t) => t.title === 'Wholeness of Body')?.minTier).toBe(2)
      expect(openHand?.traits.find((t) => t.title === 'Fleet Step')?.minTier).toBe(4)
      expect(openHand?.traits.find((t) => t.title === 'Quivering Palm')?.minTier).toBe(4)
    })
  })

  describe('Ranger', () => {
    it('has a Ranger entry', () => {
      expect(CLASSES.Ranger).toBeDefined()
    })

    it('has ranger-conclave featureChoice with Hunter', () => {
      const choices = CLASSES.Ranger?.featureChoices
      expect(choices).toBeDefined()
      expect(choices).toHaveLength(1)
      const conclave = choices?.find((c) => c.id === 'ranger-conclave')
      expect(conclave).toBeDefined()
      expect(conclave?.label).toBe('Ranger Conclave')
      expect(conclave?.count).toBe(1)
      const hunter = conclave?.options?.find((o) => o.id === 'hunter')
      expect(hunter).toBeDefined()
      expect(hunter?.traits).toHaveLength(5)

      const traitTitles = hunter?.traits.map((t) => t.title)
      expect(traitTitles).toEqual([
        "Hunter's Lore",
        "Hunter's Prey",
        'Defensive Tactics',
        "Superior Hunter's Prey",
        "Superior Hunter's Defense",
      ])

      expect(hunter?.traits.find((t) => t.title === "Hunter's Lore")?.minTier).toBe(1)
      expect(hunter?.traits.find((t) => t.title === "Hunter's Prey")?.minTier).toBe(1)
      expect(hunter?.traits.find((t) => t.title === 'Defensive Tactics')?.minTier).toBe(2)
      expect(hunter?.traits.find((t) => t.title === "Superior Hunter's Prey")?.minTier).toBe(4)
      expect(hunter?.traits.find((t) => t.title === "Superior Hunter's Defense")?.minTier).toBe(4)
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

    it('has Contact Patron gated at minTier 3', () => {
      const contactPatron = CLASSES.Warlock?.features.find(
        (f) => f.title === 'Contact Patron',
      )
      expect(contactPatron).toBeDefined()
      expect(contactPatron?.minTier).toBe(3)
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
      expect(invocations?.count).toEqual({ 3: 3, 6: 5, 10: 7 })
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
