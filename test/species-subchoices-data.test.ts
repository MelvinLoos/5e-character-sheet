import { describe, it, expect } from 'vitest'
import { SPECIES } from '../src/data/rules'
import type { SubChoice, RulesFeature } from '@/types/rules'

describe('SPECIES sub-choices', () => {
  // ──── Helpers ────

  function allSubChoiceIds(): { species: string; id: string }[] {
    const result: { species: string; id: string }[] = []
    for (const [speciesName, speciesData] of Object.entries(SPECIES)) {
      for (const sc of speciesData.subChoices || []) {
        result.push({ species: speciesName, id: sc.id })
      }
    }
    return result
  }

  function subChoiceTraitTitles(sc: SubChoice): string[] {
    return sc.traits.map((t) => t.title)
  }

  function sharedTraitTitles(speciesName: string): string[] {
    const species = SPECIES[speciesName]
    if (!species) return []
    return species.traits.map((t) => t.title)
  }

  // ──── Elf ────

  describe('Elf', () => {
    const elf = SPECIES.Elf
    const ids = elf?.subChoices?.map((sc) => sc.id) || []

    it('has exactly 3 subChoices', () => {
      expect(elf?.subChoices).toHaveLength(3)
    })

    it('subChoice ids: drow, high-elf, wood-elf', () => {
      expect(ids).toEqual(expect.arrayContaining(['drow', 'high-elf', 'wood-elf']))
    })

    it('each subChoice has id, label, and non-empty traits', () => {
      for (const sc of elf?.subChoices || []) {
        expect(sc.id).toBeTruthy()
        expect(sc.label).toBeTruthy()
        expect(sc.traits.length).toBeGreaterThan(0)
      }
    })

    it('Drow includes Superior Darkvision and 3 innate spells', () => {
      const drow = elf?.subChoices?.find((sc) => sc.id === 'drow')
      const titles = subChoiceTraitTitles(drow!)
      expect(titles.some((t) => t.includes('Superior Darkvision'))).toBe(true)
      expect(titles.some((t) => t.includes('Drow Magic'))).toBe(true)
    })

    it('Drow Faerie Fire has minTier: 1', () => {
      const drow = elf?.subChoices?.find((sc) => sc.id === 'drow')
      const ff = drow?.traits.find((t) => t.title.includes('Faerie Fire'))
      expect(ff?.minTier).toBe(1)
    })

    it('Drow Darkness has minTier: 2', () => {
      const drow = elf?.subChoices?.find((sc) => sc.id === 'drow')
      const darkness = drow?.traits.find((t) => t.title.includes('Darkness'))
      expect(darkness?.minTier).toBe(2)
    })

    it('High Elf grants Elf Weapon Training and cantrip', () => {
      const highElf = elf?.subChoices?.find((sc) => sc.id === 'high-elf')
      const titles = subChoiceTraitTitles(highElf!)
      expect(titles.some((t) => t.includes('Weapon Training'))).toBe(true)
      expect(titles.some((t) => t.includes('Cantrip'))).toBe(true)
    })

    it('Wood Elf grants Fleet of Foot and Mask of the Wild', () => {
      const woodElf = elf?.subChoices?.find((sc) => sc.id === 'wood-elf')
      const titles = subChoiceTraitTitles(woodElf!)
      expect(titles.some((t) => t.includes('Fleet of Foot'))).toBe(true)
      expect(titles.some((t) => t.includes('Mask of the Wild'))).toBe(true)
    })

    it('shared traits include Keen Senses', () => {
      expect(sharedTraitTitles('Elf')).toContain('Keen Senses')
    })
  })

  // ──── Goliath ────

  describe('Goliath', () => {
    const goliath = SPECIES.Goliath
    const ids = goliath?.subChoices?.map((sc) => sc.id) || []

    it('has exactly 6 subChoices', () => {
      expect(goliath?.subChoices).toHaveLength(6)
    })

    it('subChoice ids: cloud, fire, frost, hill, stone, storm', () => {
      expect(ids).toEqual(expect.arrayContaining(['cloud', 'fire', 'frost', 'hill', 'stone', 'storm']))
    })

    it('shared traits are Powerful Build and Large Form only', () => {
      const titles = sharedTraitTitles('Goliath')
      expect(titles).toContain('Powerful Build')
      expect(titles).toContain('Large Form')
      expect(titles).toHaveLength(2)
    })

    it("shared traits do NOT include Little Giant or Stone's Endurance", () => {
      const titles = sharedTraitTitles('Goliath')
      expect(titles).not.toContain('Little Giant')
      expect(titles).not.toContain("Stone's Endurance")
    })

    it('Large Form has minTier: 2', () => {
      const lf = goliath?.traits.find((t) => t.title === 'Large Form')
      expect(lf?.minTier).toBe(2)
    })

    it("Stone subChoice includes Stone's Endurance", () => {
      const stone = goliath?.subChoices?.find((sc) => sc.id === 'stone')
      const titles = subChoiceTraitTitles(stone!)
      expect(titles.some((t) => t.includes("Stone's Endurance"))).toBe(true)
    })

    it('each ancestry provides exactly 1 trait', () => {
      for (const sc of goliath?.subChoices || []) {
        expect(sc.traits).toHaveLength(1)
      }
    })

    it("Cloud ancestry provides Cloud's Jaunt", () => {
      const cloud = goliath?.subChoices?.find((sc) => sc.id === 'cloud')
      expect(subChoiceTraitTitles(cloud!).some((t) => t.includes("Cloud's Jaunt"))).toBe(true)
    })
  })

  // ──── Gnome ────

  describe('Gnome', () => {
    const gnome = SPECIES.Gnome
    const ids = gnome?.subChoices?.map((sc) => sc.id) || []

    it('has exactly 2 subChoices', () => {
      expect(gnome?.subChoices).toHaveLength(2)
    })

    it('subChoice ids: forest-gnome, rock-gnome', () => {
      expect(ids).toEqual(expect.arrayContaining(['forest-gnome', 'rock-gnome']))
    })

    it('Forest Gnome grants Speak with Small Beasts and Forest Magic', () => {
      const forest = gnome?.subChoices?.find((sc) => sc.id === 'forest-gnome')
      const titles = subChoiceTraitTitles(forest!)
      expect(titles.some((t) => t.includes('Speak with Small Beasts'))).toBe(true)
      expect(titles.some((t) => t.includes('Forest Magic'))).toBe(true)
    })

    it("Rock Gnome grants Artificer's Lore and Tinker", () => {
      const rock = gnome?.subChoices?.find((sc) => sc.id === 'rock-gnome')
      const titles = subChoiceTraitTitles(rock!)
      expect(titles.some((t) => t.includes("Artificer's Lore"))).toBe(true)
      expect(titles.some((t) => t.includes('Tinker'))).toBe(true)
    })

    it('shared traits include Gnomish Cunning', () => {
      expect(sharedTraitTitles('Gnome')).toContain('Gnomish Cunning')
    })
  })

  // ──── Tiefling ────

  describe('Tiefling', () => {
    const tiefling = SPECIES.Tiefling
    const ids = tiefling?.subChoices?.map((sc) => sc.id) || []

    it('has exactly 3 subChoices', () => {
      expect(tiefling?.subChoices).toHaveLength(3)
    })

    it('subChoice ids: abyssal, chthonic, infernal', () => {
      expect(ids).toEqual(expect.arrayContaining(['abyssal', 'chthonic', 'infernal']))
    })

    it('shared traits do NOT include Hellish Resistance or Infernal Legacy', () => {
      const titles = sharedTraitTitles('Tiefling')
      expect(titles).not.toContain('Hellish Resistance')
      expect(titles).not.toContain('Infernal Legacy')
    })

    it('shared traits include Otherworldly Presence', () => {
      expect(sharedTraitTitles('Tiefling')).toContain('Otherworldly Presence')
    })

    it('Infernal grants Fire resistance, Fire Bolt, Hellish Rebuke, Darkness', () => {
      const infernal = tiefling?.subChoices?.find((sc) => sc.id === 'infernal')
      const titles = subChoiceTraitTitles(infernal!)
      expect(titles.some((t) => t.includes('Infernal Resistance'))).toBe(true)
      expect(titles.some((t) => t.includes('Fire Bolt'))).toBe(true)
      expect(titles.some((t) => t.includes('Hellish Rebuke'))).toBe(true)
      expect(titles.some((t) => t.includes('Darkness'))).toBe(true)
    })

    it('Infernal Hellish Rebuke has minTier: 1', () => {
      const infernal = tiefling?.subChoices?.find((sc) => sc.id === 'infernal')
      const hr = infernal?.traits.find((t) => t.title.includes('Hellish Rebuke'))
      expect(hr?.minTier).toBe(1)
    })

    it('Infernal Darkness has minTier: 2', () => {
      const infernal = tiefling?.subChoices?.find((sc) => sc.id === 'infernal')
      const d = infernal?.traits.find((t) => t.title.includes('Darkness'))
      expect(d?.minTier).toBe(2)
    })

    it('Abyssal grants Poison resistance, Poison Spray, Ray of Sickness, Hold Person', () => {
      const abyssal = tiefling?.subChoices?.find((sc) => sc.id === 'abyssal')
      const titles = subChoiceTraitTitles(abyssal!)
      expect(titles.some((t) => t.includes('Abyssal Resistance'))).toBe(true)
      expect(titles.some((t) => t.includes('Poison Spray'))).toBe(true)
      expect(titles.some((t) => t.includes('Ray of Sickness'))).toBe(true)
      expect(titles.some((t) => t.includes('Hold Person'))).toBe(true)
    })

    it('Chthonic grants Necrotic resistance, Chill Touch, False Life, Ray of Enfeeblement', () => {
      const chthonic = tiefling?.subChoices?.find((sc) => sc.id === 'chthonic')
      const titles = subChoiceTraitTitles(chthonic!)
      expect(titles.some((t) => t.includes('Chthonic Resistance'))).toBe(true)
      expect(titles.some((t) => t.includes('Chill Touch'))).toBe(true)
      expect(titles.some((t) => t.includes('False Life'))).toBe(true)
      expect(titles.some((t) => t.includes('Ray of Enfeeblement'))).toBe(true)
    })

    it('each legacy has exactly 4 traits', () => {
      for (const sc of tiefling?.subChoices || []) {
        expect(sc.traits).toHaveLength(4)
      }
    })

    it('level-gated spells have correct minTier (1 and 2)', () => {
      for (const sc of tiefling?.subChoices || []) {
        const minTiers = sc.traits.map((t: RulesFeature) => t.minTier).filter((t): t is number => t !== undefined)
        expect(minTiers).toContain(1)
        expect(minTiers).toContain(2)
      }
    })
  })

  // ──── Aasimar ────

  describe('Aasimar', () => {
    const aasimar = SPECIES.Aasimar
    const ids = aasimar?.subChoices?.map((sc) => sc.id) || []

    it('has exactly 2 subChoices', () => {
      expect(aasimar?.subChoices).toHaveLength(2)
    })

    it('subChoice ids: heavenly-wings, inner-radiance', () => {
      expect(ids).toEqual(expect.arrayContaining(['heavenly-wings', 'inner-radiance']))
    })

    it('Celestial Revelation shared trait has minTier: 1', () => {
      const cr = aasimar?.traits.find((t) => t.title === 'Celestial Revelation')
      expect(cr?.minTier).toBe(1)
    })

    it('Heavenly Wings is a single trait with minTier: 1', () => {
      const hw = aasimar?.subChoices?.find((sc) => sc.id === 'heavenly-wings')
      expect(hw?.traits).toHaveLength(1)
      expect(hw?.traits[0].minTier).toBe(1)
      expect(hw?.traits[0].title).toBe('Heavenly Wings')
    })

    it('Inner Radiance is a single trait with minTier: 1', () => {
      const ir = aasimar?.subChoices?.find((sc) => sc.id === 'inner-radiance')
      expect(ir?.traits).toHaveLength(1)
      expect(ir?.traits[0].minTier).toBe(1)
      expect(ir?.traits[0].title).toBe('Inner Radiance')
    })

    it('shared traits include Light Bearer', () => {
      expect(sharedTraitTitles('Aasimar')).toContain('Light Bearer')
    })
  })

  // ──── Dragonborn ────

  describe('Dragonborn', () => {
    const dragonborn = SPECIES.Dragonborn
    const ids = dragonborn?.subChoices?.map((sc) => sc.id) || []

    it('has exactly 3 subChoices', () => {
      expect(dragonborn?.subChoices).toHaveLength(3)
    })

    it('subChoice ids: chromatic, gem, metallic', () => {
      expect(ids).toEqual(expect.arrayContaining(['chromatic', 'gem', 'metallic']))
    })

    it('Draconic Flight has minTier: 2', () => {
      const df = dragonborn?.traits.find((t) => t.title === 'Draconic Flight')
      expect(df?.minTier).toBe(2)
    })

    it('Chromatic Ancestry trait mentions Black, Blue, Green, Red, White', () => {
      const chromatic = dragonborn?.subChoices?.find((sc) => sc.id === 'chromatic')
      const desc = chromatic?.traits[0]?.desc || ''
      expect(desc).toMatch(/Black/)
      expect(desc).toMatch(/Blue/)
      expect(desc).toMatch(/Green/)
      expect(desc).toMatch(/Red/)
      expect(desc).toMatch(/White/)
    })

    it('Gem Ancestry trait mentions Amethyst, Crystal, Emerald, Sapphire, Topaz', () => {
      const gem = dragonborn?.subChoices?.find((sc) => sc.id === 'gem')
      const desc = gem?.traits[0]?.desc || ''
      expect(desc).toMatch(/Amethyst/)
      expect(desc).toMatch(/Crystal/)
      expect(desc).toMatch(/Emerald/)
      expect(desc).toMatch(/Sapphire/)
      expect(desc).toMatch(/Topaz/)
    })

    it('Metallic Ancestry trait mentions Brass, Bronze, Copper, Gold, Silver', () => {
      const metallic = dragonborn?.subChoices?.find((sc) => sc.id === 'metallic')
      const desc = metallic?.traits[0]?.desc || ''
      expect(desc).toMatch(/Brass/)
      expect(desc).toMatch(/Bronze/)
      expect(desc).toMatch(/Copper/)
      expect(desc).toMatch(/Gold/)
      expect(desc).toMatch(/Silver/)
    })

    it('each ancestry provides exactly 1 trait', () => {
      for (const sc of dragonborn?.subChoices || []) {
        expect(sc.traits).toHaveLength(1)
      }
    })
  })

  // ──── Edge cases ────

  describe('Structural integrity', () => {
    it('species without subChoices (Human, Dwarf, Halfling, Orc) have no subChoices', () => {
      for (const name of ['Human', 'Dwarf', 'Halfling', 'Orc']) {
        const sub = SPECIES[name]?.subChoices
        expect(sub && sub.length > 0 ? sub.length : 0).toBe(0)
      }
    })

    it('every subChoice id is unique across all species', () => {
      const all = allSubChoiceIds()
      const ids = all.map((x) => x.id)
      const unique = new Set(ids)
      expect(unique.size).toBe(ids.length)
    })

    it('every trait across all subChoices has non-empty title and desc', () => {
      for (const [speciesName, speciesData] of Object.entries(SPECIES)) {
        for (const sc of speciesData.subChoices || []) {
          for (const trait of sc.traits) {
            expect(trait.title, `${speciesName} / ${sc.id}: title missing`).toBeTruthy()
            expect(trait.desc, `${speciesName} / ${sc.id}: desc missing`).toBeTruthy()
          }
        }
      }
    })

    it('minTier values are only 1 or 2 where present', () => {
      const minTiers: { species: string; scope: string; value: number }[] = []
      for (const [speciesName, speciesData] of Object.entries(SPECIES)) {
        for (const trait of speciesData.traits) {
          if (trait.minTier !== undefined) {
            minTiers.push({ species: speciesName, scope: trait.title, value: trait.minTier })
          }
        }
        for (const sc of speciesData.subChoices || []) {
          for (const trait of sc.traits) {
            if (trait.minTier !== undefined) {
              minTiers.push({ species: speciesName, scope: `${sc.id}/${trait.title}`, value: trait.minTier })
            }
          }
        }
      }
      for (const entry of minTiers) {
        expect(
          [1, 2],
          `${entry.species}/${entry.scope}: minTier=${entry.value}`,
        ).toContain(entry.value)
      }
    })

    it('every subChoice has a description', () => {
      for (const [speciesName, speciesData] of Object.entries(SPECIES)) {
        for (const sc of speciesData.subChoices || []) {
          expect(sc.description, `${speciesName}/${sc.id}: description missing`).toBeTruthy()
        }
      }
    })
  })
})
