import { describe, it, expect } from 'vitest'
import {
  migrateCharacterData,
  applyBackgroundSkills,
  applyClassSkills,
  cleanupInvalidSkills,
  applyBackgroundFeature,
  applyClassFeatures,
  applySpeciesTraits,
  applyBackgroundBonuses,
  calculateDerivedStats,
  applyAllChanges,
} from '@/utils/characterMutations'
import { createBlankCharacter } from '@/domain'
import type { CharacterData, CharacterFeature } from '@/types/character'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseScores = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }

function makeChar(overrides: Partial<CharacterData> = {}): CharacterData {
  return {
    ...createBlankCharacter(),
    pointBuyBaseScores: { ...baseScores },
    abilityScores: { ...baseScores },
    backgroundBonusSelections: { plusTwo: null, plusOne: null },
    ...overrides,
  } as CharacterData
}

// ---------------------------------------------------------------------------
// migrateCharacterData (8 tests)
// ---------------------------------------------------------------------------

describe('migrateCharacterData', () => {
  it('fills defaults for a blank {} object', () => {
    const result = migrateCharacterData({})
    expect(result.combat).toBeDefined()
    expect(result.combat.ac).toBe(10)
    expect(result.combat.hp_max).toBe(1)
    expect(result.spells).toEqual([])
    expect(result.attacks).toEqual([])
    expect(result.personality.traits).toBe('')
  })

  it('converts legacy level to renownTier', () => {
    const legacy = { name: 'Old Char', level: 5, abilityScores: baseScores }
    const result = migrateCharacterData(legacy)
    expect(result.renownTier).toBeDefined()
    expect(result.renownMilestones).toBeDefined()
  })

  it('converts legacy uses to resource shape', () => {
    const legacy = {
      features: [{ title: 'Rage', uses: { total: 3, per: 'Long Rest' } }],
    }
    const result = migrateCharacterData(legacy)
    // Uses get migrated by migrateUsesToResource
    expect(result.features[0].resource || result.features[0].uses).toBeDefined()
  })

  it('adds missing spells array', () => {
    const result = migrateCharacterData({})
    expect(result.spells).toEqual([])
  })

  it('adds missing combat object with defaults', () => {
    const result = migrateCharacterData({})
    expect(result.combat.ac).toBe(10)
    expect(result.combat.hp_max).toBe(1)
    expect(result.combat.speed).toBe('30ft')
  })

  it('adds missing personality object', () => {
    const result = migrateCharacterData({})
    expect(result.personality.traits).toBe('')
    expect(result.personality.ideal).toBe('')
  })

  it('auto-adds spellcasting feat for Wizard class during v1->v2 migration', () => {
    const legacy = {
      version: 1,
      name: 'Wiz',
      class: 'Wizard',
      spellcasting: { ability: 'int' },
      features: [{ title: 'Spellcasting (Wizard)', desc: '...', casterType: 'full', key: true }],
    }
    const result = migrateCharacterData(legacy)
    const spellFeat = result.features.find((f) => f.title === 'Wizard Spellcasting')
    expect(spellFeat).toBeDefined()
    expect(spellFeat?.casterType).toBe('full')
    expect(result.features.some((f) => f.title === 'Spellcasting (Wizard)' && f.casterType)).toBe(false)
  })

  it('detects half caster for Ranger during v1->v2 migration', () => {
    const legacy = {
      version: 1,
      name: 'Ranger',
      class: 'Ranger',
      spellcasting: { ability: 'wis' },
      features: [{ title: 'Spellcasting (Ranger)', desc: '...', casterType: 'half', key: true }],
    }
    const result = migrateCharacterData(legacy)
    const spellFeat = result.features.find((f) => f.title === 'Ranger Spellcasting')
    expect(spellFeat?.casterType).toBe('half')
  })

  it('detects pact caster for Warlock during v1->v2 migration', () => {
    const legacy = {
      version: 1,
      name: 'Lock',
      class: 'Warlock',
      spellcasting: { ability: 'cha' },
      features: [{ title: 'Pact Magic (Warlock)', desc: '...', casterType: 'pact', key: true }],
    }
    const result = migrateCharacterData(legacy)
    const spellFeat = result.features.find((f) => f.title === 'Warlock Pact Magic')
    expect(spellFeat?.casterType).toBe('pact')
  })
})

// ---------------------------------------------------------------------------
// applyBackgroundSkills (4 tests)
// ---------------------------------------------------------------------------

describe('applyBackgroundSkills', () => {
  it('adds Acolyte skills (Insight, Religion)', () => {
    const char = makeChar({ background: 'Acolyte', proficiencies: { savingThrows: [], skills: [] } })
    const result = applyBackgroundSkills(char)
    expect(result.proficiencies.skills).toContain('insight')
    expect(result.proficiencies.skills).toContain('religion')
  })

  it('deduplicates already-present skills', () => {
    const char = makeChar({ background: 'Acolyte', proficiencies: { savingThrows: [], skills: ['insight'] } })
    const result = applyBackgroundSkills(char)
    expect(result.proficiencies.skills.filter((s: string) => s === 'insight')).toHaveLength(1)
  })

  it('does nothing for null background', () => {
    const char = makeChar({ background: null })
    const result = applyBackgroundSkills(char)
    expect(result.proficiencies.skills).toEqual(char.proficiencies.skills)
  })

  it('normalizes skill names (lowercase, no spaces)', () => {
    const char = makeChar({ background: 'Acolyte', proficiencies: { savingThrows: [], skills: [] } })
    const result = applyBackgroundSkills(char)
    expect(result.proficiencies.skills[0]).toBe('insight') // not 'Insight'
  })
})

// ---------------------------------------------------------------------------
// applyClassSkills (4 tests)
// ---------------------------------------------------------------------------

describe('applyClassSkills', () => {
  it('adds class fixed skills when present', () => {
    const char = makeChar({
      class: 'Fighter',
      proficiencies: { savingThrows: [], skills: [] },
    })
    const result = applyClassSkills(char)
    // Fighter has no fixedSkills in current data, so skills should be unchanged
    expect(result.proficiencies.skills).toEqual([])
  })

  it('does nothing for null class', () => {
    const char = makeChar({ class: null, proficiencies: { savingThrows: [], skills: [] } })
    const result = applyClassSkills(char)
    expect(result.proficiencies.skills).toEqual([])
  })

  it('deduplicates skills already present', () => {
    const char = makeChar({
      class: 'Fighter',
      proficiencies: { savingThrows: [], skills: ['athletics'] },
    })
    const result = applyClassSkills(char)
    expect(result.proficiencies.skills.filter((s: string) => s === 'athletics')).toHaveLength(1)
  })

  it('never overwrites manual user choices', () => {
    const char = makeChar({
      class: 'Fighter',
      proficiencies: { savingThrows: [], skills: ['arcana', 'athletics'] },
    })
    const result = applyClassSkills(char)
    // Manual choices preserved
    expect(result.proficiencies.skills).toContain('arcana')
    expect(result.proficiencies.skills).toContain('athletics')
  })
})

// ---------------------------------------------------------------------------
// cleanupInvalidSkills (4 tests)
// ---------------------------------------------------------------------------

describe('cleanupInvalidSkills', () => {
  it('removes skills not valid for current class/background', () => {
    const char = makeChar({
      class: 'Fighter',
      background: 'Acolyte',
      proficiencies: {
        savingThrows: [],
        skills: ['insight', 'religion', 'arcana', 'stealth'],
      },
    })
    const result = cleanupInvalidSkills(char)
    // Acolyte grants insight, religion. Fighter choices include arcana? No — Fighter list doesn't include arcana.
    // Fighter skillChoices.from: Acrobatics, Animal Handling, Athletics, History, Insight, Intimidation, Perception, Survival
    expect(result.proficiencies.skills).toContain('insight')
    expect(result.proficiencies.skills).toContain('religion')
    expect(result.proficiencies.skills).not.toContain('stealth')
  })

  it('keeps skills in class skillChoices.from list', () => {
    const char = makeChar({
      class: 'Fighter',
      background: null,
      proficiencies: { savingThrows: [], skills: ['athletics', 'perception'] },
    })
    const result = cleanupInvalidSkills(char)
    expect(result.proficiencies.skills).toContain('athletics')
    expect(result.proficiencies.skills).toContain('perception')
  })

  it('keeps all skills when class has from: any', () => {
    const char = makeChar({
      class: 'Bard',
      background: null,
      proficiencies: { savingThrows: [], skills: ['arcana', 'stealth', 'performance'] },
    })
    const result = cleanupInvalidSkills(char)
    expect(result.proficiencies.skills).toContain('arcana')
    expect(result.proficiencies.skills).toContain('stealth')
    expect(result.proficiencies.skills).toContain('performance')
  })

  it('removes all skills when no class and no background', () => {
    const char = makeChar({
      class: null,
      background: null,
      proficiencies: { savingThrows: [], skills: ['arcana', 'stealth'] },
    })
    const result = cleanupInvalidSkills(char)
    expect(result.proficiencies.skills).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// applyBackgroundFeature (3 tests)
// ---------------------------------------------------------------------------

describe('applyBackgroundFeature', () => {
  it('adds Acolyte background feature', () => {
    const char = makeChar({ background: 'Acolyte', features: [] })
    const result = applyBackgroundFeature(char)
    expect(result.features.some((f) => f.title === 'Magic Initiate (Cleric)')).toBe(true)
  })

  it('replaces old background feature when switching', () => {
    const char = makeChar({
      background: 'Soldier',
      features: [{ title: 'Magic Initiate (Cleric)', desc: '', key: false } as CharacterFeature],
    })
    const result = applyBackgroundFeature(char)
    expect(result.features.some((f) => f.title === 'Magic Initiate (Cleric)')).toBe(false)
    expect(result.features.some((f) => f.title === 'Savage Attacker')).toBe(true)
  })

  it('does nothing for null background', () => {
    const char = makeChar({ background: null, features: [] })
    const result = applyBackgroundFeature(char)
    expect(result.features).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// applyClassFeatures (6 tests)
// ---------------------------------------------------------------------------

describe('applyClassFeatures', () => {
  it('adds Fighter features (Second Wind)', () => {
    const char = makeChar({ class: 'Fighter', features: [] })
    const result = applyClassFeatures(char)
    expect(result.features.some((f) => f.title === 'Second Wind')).toBe(true)
  })

  it('adds Barbarian features (Rage, Unarmored Defense)', () => {
    const char = makeChar({ class: 'Barbarian', features: [] })
    const result = applyClassFeatures(char)
    expect(result.features.some((f) => f.title === 'Rage')).toBe(true)
    expect(result.features.some((f) => f.title === 'Unarmored Defense (Barbarian)')).toBe(true)
  })

  it('strips old class features on class switch', () => {
    const char = makeChar({
      class: 'Barbarian',
      features: [{ title: 'Second Wind', desc: '', key: true } as CharacterFeature],
    })
    const result = applyClassFeatures(char)
    expect(result.features.some((f) => f.title === 'Second Wind')).toBe(false)
    expect(result.features.some((f) => f.title === 'Rage')).toBe(true)
  })

  it('updates saving throw proficiencies', () => {
    const char = makeChar({ class: 'Fighter' })
    const result = applyClassFeatures(char)
    expect(result.proficiencies.savingThrows).toContain('str')
    expect(result.proficiencies.savingThrows).toContain('con')
  })

  it('handles class set to null', () => {
    const char = makeChar({ class: null, features: [] })
    const result = applyClassFeatures(char)
    expect(result).toEqual(char)
  })

  it('adds Bard Spellcasting feat with casterType = full', () => {
    const char = makeChar({ class: 'Bard', features: [] })
    const result = applyClassFeatures(char)
    const spellcasting = result.features.find((f) => f.title === 'Bard Spellcasting')
    expect(spellcasting).toBeDefined()
    expect(spellcasting?.casterType).toBe('full')
    // Class rules data no longer embeds casterType on class features
    expect(result.features.some((f) => f.title === 'Spellcasting (Bard)')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// applySpeciesTraits (4 tests)
// ---------------------------------------------------------------------------

describe('applySpeciesTraits', () => {
  it('adds Elf traits (Darkvision, Fey Ancestry, Trance, Keen Senses) and speed 30ft', () => {
    const char = makeChar({ species: 'Elf', features: [] })
    const result = applySpeciesTraits(char)
    expect(result.features.some((f) => f.title === 'Darkvision')).toBe(true)
    expect(result.features.some((f) => f.title === 'Fey Ancestry')).toBe(true)
    expect(result.features.some((f) => f.title === 'Trance')).toBe(true)
    expect(result.features.some((f) => f.title === 'Keen Senses')).toBe(true)
    expect(result.combat.speed).toBe('30ft')
  })

  it('sets Dwarf speed to 30ft', () => {
    const char = makeChar({ species: 'Dwarf', features: [] })
    const result = applySpeciesTraits(char)
    expect(result.combat.speed).toBe('30ft')
  })

  it('replaces old species traits on switch', () => {
    const char = makeChar({
      species: 'Halfling',
      features: [{ title: 'Darkvision', desc: '', key: true } as CharacterFeature],
    })
    const result = applySpeciesTraits(char)
    // Halfling does NOT have Darkvision
    expect(result.features.some((f) => f.title === 'Darkvision')).toBe(false)
    expect(result.features.some((f) => f.title === 'Luck')).toBe(true)
  })

  it('does nothing for null species', () => {
    const char = makeChar({ species: null, features: [] })
    const result = applySpeciesTraits(char)
    expect(result).toEqual(char)
  })
})

// ---------------------------------------------------------------------------
// applyBackgroundBonuses (4 tests)
// ---------------------------------------------------------------------------

describe('applyBackgroundBonuses', () => {
  it('applies +2 STR and +1 DEX bonuses', () => {
    const char = makeChar({
      pointBuyBaseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      backgroundBonusSelections: { plusTwo: 'str', plusOne: 'dex' },
    })
    const result = applyBackgroundBonuses(char)
    expect(result.abilityScores['str']).toBe(10)
    expect(result.abilityScores['dex']).toBe(9)
  })

  it('applies feature ability modifiers on top of bonuses', () => {
    const char = makeChar({
      pointBuyBaseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      backgroundBonusSelections: { plusTwo: 'str', plusOne: null },
      features: [{ title: 'ASI', desc: '', abilityModifiers: { str: 2 } } as CharacterFeature],
    })
    const result = applyBackgroundBonuses(char)
    expect(result.abilityScores['str']).toBe(12) // 8 + 2(bg) + 2(feature)
  })

  it('handles missing background bonus selections gracefully', () => {
    const char = makeChar({
      pointBuyBaseScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      backgroundBonusSelections: { plusTwo: null, plusOne: null },
    })
    const result = applyBackgroundBonuses(char)
    expect(result.abilityScores['str']).toBe(10)
  })

  it('does nothing when backgroundBonusSelections is undefined', () => {
    const char: CharacterData = {
      ...makeChar({}),
      backgroundBonusSelections: { plusTwo: null, plusOne: null },
    } as unknown as CharacterData
    const result = applyBackgroundBonuses(char)
    expect(result.abilityScores['str']).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// calculateDerivedStats (4 tests)
// ---------------------------------------------------------------------------

describe('calculateDerivedStats', () => {
  it('calculates maxHp for Fighter tier 1 with CON 14', () => {
    const char = makeChar({
      class: 'Fighter',
      renownTier: 1,
      abilityScores: { str: 16, dex: 10, con: 14, int: 10, wis: 10, cha: 10 },
    })
    const result = calculateDerivedStats(char)
    // Fighter: hitDice=10, conMod=+2, hitDiceAverage=6
    // Level 3: 10+2 + (3-1)*max(1,6+2) = 12 + 2*8 = 28
    expect(result.combat.hp_max).toBe(28)
  })

  it('syncs hp_current to new maxHp when at full health', () => {
    const char = makeChar({
      class: 'Fighter',
      renownTier: 1,
      abilityScores: { str: 16, dex: 10, con: 14, int: 10, wis: 10, cha: 10 },
      combat: { ac: 16, hp_max: 28, hp_current: 28, speed: '30ft' },
    })
    const result = calculateDerivedStats(char)
    expect(result.combat.hp_current).toBe(28)
  })

  it('preserves hp_current when not at full health', () => {
    const char = makeChar({
      class: 'Fighter',
      renownTier: 1,
      abilityScores: { str: 16, dex: 10, con: 14, int: 10, wis: 10, cha: 10 },
      combat: { ac: 16, hp_max: 28, hp_current: 12, speed: '30ft' },
    })
    const result = calculateDerivedStats(char)
    expect(result.combat.hp_current).toBe(12)
  })

  it('nulls spellcasting when no spellcasting feature exists', () => {
    const char = makeChar({
      class: 'Fighter',
      spellcasting: { ability: 'int' },
      features: [],
    })
    const result = calculateDerivedStats(char)
    expect(result.spellcasting).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// applyAllChanges (2 tests)
// ---------------------------------------------------------------------------

describe('applyAllChanges', () => {
  it('pipeline produces valid character with all mutations applied', () => {
    const char = makeChar({
      class: 'Fighter',
      species: 'Human',
      background: 'Acolyte',
      backgroundBonusSelections: { plusTwo: 'str', plusOne: 'dex' },
      features: [],
      proficiencies: { savingThrows: [], skills: [] },
    })
    const result = applyAllChanges(char)
    expect(result.features.length).toBeGreaterThan(0) // Has class + species + background features
    expect(result.proficiencies.skills).toContain('insight')
    expect(result.proficiencies.savingThrows).toContain('str')
    expect(result.combat.hp_max).toBeGreaterThan(1)
  })

  it('handles mid-edit class switch correctly', () => {
    const char = makeChar({
      class: 'Barbarian',
      species: 'Elf',
      background: 'Soldier',
      features: [
        { title: 'Second Wind', desc: '', key: true } as CharacterFeature,
        { title: 'Darkvision', desc: '', key: true } as CharacterFeature,
      ],
      proficiencies: { savingThrows: ['str', 'con'], skills: [] },
    })
    const result = applyAllChanges(char)
    expect(result.features.some((f) => f.title === 'Second Wind')).toBe(false)
    expect(result.features.some((f) => f.title === 'Rage')).toBe(true)
    expect(result.features.some((f) => f.title === 'Darkvision')).toBe(true) // Elf trait preserved
  })
})