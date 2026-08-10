import { describe, it, expect } from 'vitest'
import { SPECIES } from '../src/data/rules'
import type { SpeciesData } from '@/types/rules'

// ---------------------------------------------------------------------------
// Helper: extract the darkvision distance from a species' Darkvision trait desc
// ---------------------------------------------------------------------------
function getDarkvisionDistance(species: SpeciesData): number | null {
  const dv = species.traits.find((t) => t.title === 'Darkvision')
  if (!dv) return null
  const match = dv.desc.match(/within (\d+) feet/)
  return match ? parseInt(match[1], 10) : null
}

function hasTrait(species: SpeciesData, title: string): boolean {
  return species.traits.some((t) => t.title === title)
}

// ---------------------------------------------------------------------------
// #133 — Movement Speeds (2024 PHB)
// ---------------------------------------------------------------------------
describe('#133 — Species movement speeds (2024 PHB)', () => {
  const speedMap: Record<string, string> = {
    Human: '30ft',
    Elf: '30ft',
    Dwarf: '30ft',
    Gnome: '30ft',
    Halfling: '30ft',
    Dragonborn: '30ft',
    Goliath: '35ft',
    Orc: '30ft',
    Tiefling: '30ft',
    Aasimar: '30ft',
  }

  for (const [name, expected] of Object.entries(speedMap)) {
    it(`${name} speed is ${expected}`, () => {
      const sp = SPECIES[name]
      expect(sp).toBeDefined()
      expect(sp.speed).toBe(expected)
    })
  }
})

// ---------------------------------------------------------------------------
// #134 — Darkvision distances (2024 PHB)
// ---------------------------------------------------------------------------
describe('#134 — Darkvision distances and presence (2024 PHB)', () => {
  const darkvisionMap: Record<string, number | null> = {
    Human: null,
    Elf: 60,
    Dwarf: 120,
    Gnome: 60,
    Halfling: null,
    Dragonborn: 60,
    Goliath: null,
    Orc: 120,
    Tiefling: 60,
    Aasimar: 60,
  }

  for (const [name, expected] of Object.entries(darkvisionMap)) {
    if (expected === null) {
      it(`${name} does not have Darkvision`, () => {
        const sp = SPECIES[name]
        expect(sp).toBeDefined()
        expect(hasTrait(sp, 'Darkvision')).toBe(false)
      })
    } else {
      it(`${name} has Darkvision ${expected}ft`, () => {
        const sp = SPECIES[name]
        expect(sp).toBeDefined()
        expect(hasTrait(sp, 'Darkvision')).toBe(true)
        expect(getDarkvisionDistance(sp)).toBe(expected)
      })
    }
  }
})
// ---------------------------------------------------------------------------
// #135 — Missing standalone traits (2024 PHB)
// ---------------------------------------------------------------------------
describe('#135 — Missing standalone species traits (2024 PHB)', () => {
  it('Dwarf has Dwarven Toughness', () => {
    expect(hasTrait(SPECIES.Dwarf, 'Dwarven Toughness')).toBe(true)
  })

  it('Halfling has Naturally Stealthy', () => {
    expect(hasTrait(SPECIES.Halfling, 'Naturally Stealthy')).toBe(true)
  })

  it('Elf has Keen Senses', () => {
    expect(hasTrait(SPECIES.Elf, 'Keen Senses')).toBe(true)
  })

  it('Aasimar has Light Bearer', () => {
    expect(hasTrait(SPECIES.Aasimar, 'Light Bearer')).toBe(true)
  })

  it('Aasimar has Celestial Revelation', () => {
    expect(hasTrait(SPECIES.Aasimar, 'Celestial Revelation')).toBe(true)
  })

  it('Tiefling has Otherworldly Presence', () => {
    expect(hasTrait(SPECIES.Tiefling, 'Otherworldly Presence')).toBe(true)
  })

  it('Dragonborn has Draconic Flight', () => {
    expect(hasTrait(SPECIES.Dragonborn, 'Draconic Flight')).toBe(true)
  })

  it('Goliath has Powerful Build', () => {
    expect(hasTrait(SPECIES.Goliath, 'Powerful Build')).toBe(true)
  })

  it('Goliath has Large Form', () => {
    expect(hasTrait(SPECIES.Goliath, 'Large Form')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// #136 — Trait name discrepancies (2024 PHB)
// ---------------------------------------------------------------------------
describe('#136 — Species trait name discrepancies (2024 PHB)', () => {
  it('Gnome trait is "Gnomish Cunning" (not "Gnome Cunning")', () => {
    expect(hasTrait(SPECIES.Gnome, 'Gnomish Cunning')).toBe(true)
    expect(hasTrait(SPECIES.Gnome, 'Gnome Cunning')).toBe(false)
  })

  it('Halfling trait is "Luck" (not "Lucky")', () => {
    expect(hasTrait(SPECIES.Halfling, 'Luck')).toBe(true)
    expect(hasTrait(SPECIES.Halfling, 'Lucky')).toBe(false)
  })

  it('Dwarf trait names match 2024 PHB', () => {
    expect(hasTrait(SPECIES.Dwarf, 'Darkvision')).toBe(true)
    expect(hasTrait(SPECIES.Dwarf, 'Dwarven Resilience')).toBe(true)
    expect(hasTrait(SPECIES.Dwarf, 'Stonecunning')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Trait counts — complete picture per species
// ---------------------------------------------------------------------------
describe('Trait counts per species', () => {
  const traitCounts: Record<string, number> = {
    Human: 3,
    Elf: 4,
    Dwarf: 4,
    Gnome: 2,
    Halfling: 4,
    Dragonborn: 5,
    Goliath: 4,
    Orc: 3,
    Tiefling: 4,
    Aasimar: 5,
  }

  for (const [name, count] of Object.entries(traitCounts)) {
    it(`${name} has ${count} traits`, () => {
      const sp = SPECIES[name]
      expect(sp).toBeDefined()
      expect(sp.traits).toHaveLength(count)
    })
  }
})

// ---------------------------------------------------------------------------
// All 10 species exist
// ---------------------------------------------------------------------------
describe('Species registry completeness', () => {
  const expectedSpecies = [
    'Human', 'Elf', 'Dwarf', 'Gnome', 'Halfling',
    'Dragonborn', 'Goliath', 'Orc', 'Tiefling', 'Aasimar',
  ]

  it('contains all 10 expected species', () => {
    expect(Object.keys(SPECIES).sort()).toEqual(expectedSpecies.sort())
  })
})
