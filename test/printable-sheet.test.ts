import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import PrintableSheet from '../src/components/sheet/PrintableSheet.vue'
import { useCharacterStore } from '../src/stores/character'

describe('PrintableSheet (component integration)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function createBaseCharacter() {
    return {
      name: 'Elara Vance',
      title: 'Aspirant',
      jobInParty: 'Arcane Scholar',
      class: 'Wizard',
      species: 'Human',
      background: 'Sage',
      renownTier: 1,
      renownMilestones: 0,
      pointBuyBaseScores: { str: 8, dex: 14, con: 12, int: 16, wis: 14, cha: 10 },
      backgroundBonusSelections: { plusTwo: null, plusOne: null },
      abilityScores: { str: 8, dex: 14, con: 12, int: 16, wis: 14, cha: 10 },
      profBonus: 2,
      proficiencies: { savingThrows: [], skills: ['arcana', 'history'] },
      combat: { ac: 13, hp_current: 9, hp_max: 9, speed: '30ft', isAcOverride: false },
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
      gold: 10,
      supply: 2,
      influence: 1,
      inventorySlots: 10,
      equippedGear: [],
      consumables: [],
    } as any
  }

  it('renders exactly two .a4-page elements when no feature or spell descriptions exist', () => {
    const store = useCharacterStore()
    store.currentCharacterData = createBaseCharacter()

    const wrapper = mount(PrintableSheet)
    const pages = wrapper.findAll('.a4-page')

    expect(pages.length).toBe(2)
  })

  it('renders a third appendix page when a feature has a description', () => {
    const store = useCharacterStore()
    const character = createBaseCharacter()
    character.features = [
      { title: 'Alert', desc: 'You gain a +5 bonus to initiative.' },
    ]
    store.currentCharacterData = character

    const wrapper = mount(PrintableSheet)
    const pages = wrapper.findAll('.a4-page')

    expect(pages.length).toBe(3)
    expect(wrapper.text()).toContain('Alert')
    expect(wrapper.text()).toContain('You gain a +5 bonus to initiative.')
  })

  it('renders a third appendix page when a spell has a description', () => {
    const store = useCharacterStore()
    const character = createBaseCharacter()
    character.spells = [
      {
        name: 'Burning Hands',
        level: 1,
        desc: 'A thin sheet of flames shoots from your outstretched fingers.',
        school: 'Evocation',
      },
    ]
    store.currentCharacterData = character

    const wrapper = mount(PrintableSheet)
    const pages = wrapper.findAll('.a4-page')

    expect(pages.length).toBe(3)
    expect(wrapper.text()).toContain('Burning Hands')
    expect(wrapper.text()).toContain('A thin sheet of flames shoots from your outstretched fingers.')
  })

  it('does not render an appendix when feature and spell descriptions are empty', () => {
    const store = useCharacterStore()
    const character = createBaseCharacter()
    character.features = [{ title: 'Alert', desc: '' }]
    character.spells = [{ name: 'Burning Hands', level: 1, desc: '', school: 'Evocation' }]
    store.currentCharacterData = character

    const wrapper = mount(PrintableSheet)
    const pages = wrapper.findAll('.a4-page')

    expect(pages.length).toBe(2)
  })
})