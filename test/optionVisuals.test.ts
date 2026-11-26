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

  it('returns null for species and unknown classes', () => {
    expect(getFallbackEmblemSvg('Elf', 'species')).toBeNull()
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
})
