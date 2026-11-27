import { describe, it, expect } from 'vitest'
import { toSlug, getLocalPortraitUrl, getFallbackEmblemSvg } from '@/utils/optionVisuals'
import * as DND_RULES from '@/data/rules'

describe('optionVisuals', () => {
  it('slugs names', () => {
    expect(toSlug('Half-Elf')).toBe('half-elf')
    expect(toSlug('  Sage ')).toBe('sage')
    expect(toSlug('Folk Hero!')).toBe('folk-hero')
  })

  it('has no local portrait when no asset exists', () => {
    expect(getLocalPortraitUrl('Wizard', 'class')).toBeNull()
  })

  it('has an aria-hidden svg emblem for every class', () => {
    const classes = Object.keys(DND_RULES.CLASSES)
    expect(classes).toHaveLength(12)
    for (const c of classes) {
      const svg = getFallbackEmblemSvg(c, 'class')
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
      expect(svg).toContain('aria-hidden="true"')
    }
  })

  it('keeps the emblem proportional while the background spans any width', () => {
    const svg = getFallbackEmblemSvg('Wizard', 'class')!
    expect(svg).toContain('preserveAspectRatio="xMidYMid meet"')
    expect(svg).toContain('gradientUnits="userSpaceOnUse"')
    expect(svg).toMatch(/<rect x="-\d+" y="-\d+" width="\d{4,}"/)
  })

  it('returns null for unknown classes', () => {
    expect(getFallbackEmblemSvg('Artificer', 'class')).toBeNull()
  })

  it('scopes gradient ids per instance', () => {
    const a = getFallbackEmblemSvg('Wizard', 'class', 'a')!
    const b = getFallbackEmblemSvg('Wizard', 'class', 'b')!
    const ids = (s: string) => [...s.matchAll(/id="([^"]+)"/g)].map((m) => m[1])
    expect(ids(a).length).toBeGreaterThan(0)
    expect(ids(a)).not.toEqual(ids(b))
    expect(ids(a).every((i) => i!.includes('a'))).toBe(true)
  })

  it('has valid species emblems for every bundled species', () => {
    const species = Object.keys(DND_RULES.SPECIES)
    expect(species.map(toSlug).sort()).toEqual(
      ['aasimar', 'dragonborn', 'dwarf', 'elf', 'gnome', 'goliath', 'halfling', 'human', 'orc', 'tiefling'],
    )
    for (const name of species) {
      expect(getFallbackEmblemSvg(name, 'species')).not.toBeNull()
    }
    for (const name of ['Dragonborn', 'Elf', 'Orc']) {
      const svg = getFallbackEmblemSvg(name, 'species')!
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"')
      expect(svg).toContain('aria-hidden="true"')
      const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1]!)
      expect(ids.length).toBeGreaterThan(0)
      expect(ids.every((i) => i.includes('species-'))).toBe(true)
    }
  })

  it('returns null for unknown species and for backgrounds', () => {
    expect(getFallbackEmblemSvg('Half-Elf', 'species')).toBeNull()
    expect(getFallbackEmblemSvg('Sage', 'background')).toBeNull()
  })
})
