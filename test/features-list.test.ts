import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import FeaturesList from '../src/components/sheet/FeaturesList.vue'
import { useCharacterStore } from '../src/stores/character'

describe('FeaturesList (component integration)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders checkboxes for static resource uses', () => {
    const store = useCharacterStore()
    // Minimal character with a single feature using static resource
    const feature = {
      title: 'Rage',
      desc: 'Gain temp HP',
      resource: { resourceType: 'static', value: 3, reset: 'Short Rest' },
    }
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
      features: [feature],
      equipment: '',
      personality: { traits: '', ideal: '', bond: '', flaw: '', notes: '' },
      spellcasting: null,
      spells: [],
    } as any

    const wrapper = mount(FeaturesList, {
      props: { features: store.currentCharacterData.features, editable: false },
    })

    const boxes = wrapper.findAll('input.usage-box')
    expect(boxes.length).toBe(3)
  })

  it('renders checkboxes for legacy uses when resource is absent', () => {
    const store = useCharacterStore()
    const feature = {
      title: 'Second Wind',
      desc: 'Heal',
      uses: { total: 2, per: 'short rest' },
    }
    store.currentCharacterData = {
      name: 'Test2',
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
      features: [feature],
      equipment: '',
      personality: { traits: '', ideal: '', bond: '', flaw: '', notes: '' },
      spellcasting: null,
      spells: [],
    } as any

    const wrapper = mount(FeaturesList, {
      props: { features: store.currentCharacterData.features, editable: false },
    })

    const boxes = wrapper.findAll('input.usage-box')
    expect(boxes.length).toBe(2)
  })
})
