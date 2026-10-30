import { describe, it, expect } from 'vitest'
import * as rules from '@/data/rules'
import * as constants from '@/data/constants'
import * as progressions from '@/data/progressions'
import * as classes from '@/data/classes'
import * as classSpellcasting from '@/data/classSpellcasting'
import * as feats from '@/data/feats'
import * as invocations from '@/data/invocations'
import * as species from '@/data/species'
import * as backgrounds from '@/data/backgrounds'

const CATALOGS: Record<string, Record<string, unknown>> = {
  constants,
  progressions,
  classes,
  classSpellcasting,
  feats,
  invocations,
  species,
  backgrounds,
}

describe('@/data/rules barrel', () => {
  it.each([
    'ABILITIES',
    'SKILLS',
    'TIER_TO_LEVEL',
    'PROFICIENCY_BONUS_PROGRESSION',
    'SPELL_SLOT_PROGRESSION',
    'CLASSES',
    'CLASS_SPELLCASTING_FEATS',
    'CLASS_SPELLCASTING_ABILITY',
    'FEATS',
    'INVOCATIONS',
    'SPECIES',
    'BACKGROUNDS',
  ])('still exports %s', (name) => {
    expect(rules).toHaveProperty(name)
    expect((rules as Record<string, unknown>)[name]).toBeDefined()
  })

  it('re-exports the exact objects from the focused catalog modules', () => {
    for (const [file, mod] of Object.entries(CATALOGS)) {
      for (const [name, value] of Object.entries(mod)) {
        expect((rules as Record<string, unknown>)[name], `${file}.${name}`).toBe(value)
      }
    }
  })

  it('no longer carries rules functions (they live in @/domain)', () => {
    expect(rules).not.toHaveProperty('getEffectiveLevel')
    expect(rules).not.toHaveProperty('getSpellcastingAbility')
  })
})
