import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import PrintableSheet from '../src/components/sheet/PrintableSheet.vue'
import { useCharacterStore } from '../src/stores/character'

describe('PrintableSheet (component integration)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders exactly two .a4-page elements for printing', () => {
    const store = useCharacterStore()
    store.currentCharacterData = {
      name: 'Elara Vance',
      title: 'Aspirant',
      class: 'Wizard',
      species: 'Human',
      background: 'Sage',
      renownTier: 1,
      pointBuyBaseScores: { str: 8, dex: 14, con: 12, int: 16, wis: 14, cha: 10 },
      backgroundBonusSelections: { plusTwo: null, plusOne: null },
      abilityScores: { str: 8, dex: 14, con: 12, int: 16, wis: 14, cha: 10 },
      profBonus: 2,
      proficiencies: { savingThrows: [], skills: ['arcana', 'history'] },
      combat: { ac: 13, hp_current: 9, hp_max: 9, speed: '30ft' },
      attacks: [
        {
          name: 'Fire Bolt',
          atkStat: 'int',
          dmgDie: '1d10',
          type: 'fire',
          notes: 'Ignites flammable objects.',
        },
      ],
      features: [],
      equipment: '',
      personality: { traits: '', ideal: '', bond: '', flaw: '', notes: 'Some combat notes.' },
      spellcasting: null,
      spells: [],
    } as any

    const wrapper = mount(PrintableSheet)

    // Verify that exactly two .a4-page elements are rendered
    const pages = wrapper.findAll('.a4-page')
    expect(pages.length).toBe(2)
  })
})