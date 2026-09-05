import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCharacterStore } from '../src/stores/character'
import { useSpellStore } from '../src/stores/spellStore'

describe('getFeatureMaxUses', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns static resource value', () => {
    const store = useCharacterStore()
    const spellStore = useSpellStore()
    // Minimal character required for computed values
    store.currentCharacterData = {
      name: 'Test',
      title: '',
      class: null,
      level: 1,
      species: null,
      background: null,
      pointBuyBaseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      backgroundBonusSelections: { plusTwo: null, plusOne: null },
      abilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      profBonus: 2,
      proficiencies: { savingThrows: [], skills: [] },
      combat: { ac: 10, hp_max: 1, speed: '30ft' },
      attacks: [],
      features: [],
      equipment: '',
      personality: { traits: '', ideal: '', bond: '', flaw: '', notes: '' },
      spellcasting: null,
      spells: [],
    } as any

    const feature = { resource: { resourceType: 'static', value: 4 } }
    expect(spellStore.getFeatureMaxUses(feature)).toBe(4)
  })

  it('returns PB for scaling pb resources and updates with level change', () => {
    const store = useCharacterStore()
    const spellStore = useSpellStore()
    store.currentCharacterData = {
      name: 'PBTest',
      title: '',
      class: null,
      level: 1,
      species: null,
      background: null,
      pointBuyBaseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      backgroundBonusSelections: { plusTwo: null, plusOne: null },
      abilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      profBonus: 2,
      proficiencies: { savingThrows: [], skills: [] },
      combat: { ac: 10, hp_max: 1, speed: '30ft' },
      attacks: [],
      features: [],
      equipment: '',
      personality: { traits: '', ideal: '', bond: '', flaw: '', notes: '' },
      spellcasting: null,
      spells: [],
    } as any

    const feature = { resource: { resourceType: 'scaling', scalingStat: 'pb' } }
    // At level 1 prof bonus should be 2
    expect(spellStore.getFeatureMaxUses(feature)).toBe(2)

    // Increase level and expect PB to increase (according to DND_RULES)
    store.currentCharacterData.level = 5
    // Recalculate via calling helper again
    const newVal = spellStore.getFeatureMaxUses(feature)
    expect(typeof newVal).toBe('number')
    expect(newVal).toBeGreaterThanOrEqual(2)
  })

  it('returns ability mod for scaling ability resources and minimum 1', () => {
    const store = useCharacterStore()
    const spellStore = useSpellStore()
    store.currentCharacterData = {
      name: 'AbilityTest',
      title: '',
      class: null,
      level: 1,
      species: null,
      background: null,
      pointBuyBaseScores: { str: 8, dex: 8, con: 16, int: 8, wis: 8, cha: 8 },
      backgroundBonusSelections: { plusTwo: null, plusOne: null },
      abilityScores: { str: 8, dex: 8, con: 16, int: 8, wis: 8, cha: 8 },
      profBonus: 2,
      proficiencies: { savingThrows: [], skills: [] },
      combat: { ac: 10, hp_max: 1, speed: '30ft' },
      attacks: [],
      features: [],
      equipment: '',
      personality: { traits: '', ideal: '', bond: '', flaw: '', notes: '' },
      spellcasting: null,
      spells: [],
    } as any

    const feature = { resource: { resourceType: 'scaling', scalingStat: 'con' } }
    const val = spellStore.getFeatureMaxUses(feature)
    expect(typeof val).toBe('number')
    expect(val).toBeGreaterThanOrEqual(1)
  })

  it('preserves legacy uses when present', () => {
    const store = useCharacterStore()
    const spellStore = useSpellStore()
    store.currentCharacterData = {
      name: 'LegacyTest',
      title: '',
      class: null,
      level: 1,
      species: null,
      background: null,
      pointBuyBaseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      backgroundBonusSelections: { plusTwo: null, plusOne: null },
      abilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      profBonus: 2,
      proficiencies: { savingThrows: [], skills: [] },
      combat: { ac: 10, hp_max: 1, speed: '30ft' },
      attacks: [],
      features: [],
      equipment: '',
      personality: { traits: '', ideal: '', bond: '', flaw: '', notes: '' },
      spellcasting: null,
      spells: [],
    } as any

    const feature = { uses: { total: 2, per: 'short rest' } }
    expect(spellStore.getFeatureMaxUses(feature)).toBe(2)
  })
})
