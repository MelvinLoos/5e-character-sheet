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

  it('fills skill proficiency checkbox when character is proficient', () => {
    const store = useCharacterStore()
    const character = createBaseCharacter()
    character.proficiencies.skills = ['arcana', 'sleightofhand']
    store.currentCharacterData = character

    const wrapper = mount(PrintableSheet)
    const skillRows = wrapper.findAll('tbody tr')

    const arcanaRow = skillRows.find((row) => row.text().includes('Arcana'))
    expect(arcanaRow).toBeTruthy()
    expect(arcanaRow!.find('.skill-prof-filled').exists()).toBe(true)

    const acrobaticsRow = skillRows.find((row) => row.text().includes('Acrobatics'))
    expect(acrobaticsRow).toBeTruthy()
    expect(acrobaticsRow!.find('.skill-prof-filled').exists()).toBe(false)
  })

  it('renders the Current HP box without placeholder text', () => {
    const store = useCharacterStore()
    store.currentCharacterData = createBaseCharacter()

    const wrapper = mount(PrintableSheet)
    const hpBox = wrapper.find('.hp-current-box')

    expect(hpBox.exists()).toBe(true)
    expect(hpBox.text()).toBe('')
    expect(hpBox.text()).not.toContain('Current HP')
  })

  it('caps the Page 2 Spells and Features indices at 8 items each', () => {
    const store = useCharacterStore()
    const character = createBaseCharacter()
    character.features = Array.from({ length: 20 }, (_, i) => ({
      title: `Feature ${i + 1}`,
      desc: `Description for feature ${i + 1}.`,
    }))
    character.spells = Array.from({ length: 20 }, (_, i) => ({
      name: `Spell ${i + 1}`,
      level: (i % 9) + 1,
      desc: `Description for spell ${i + 1}.`,
      school: 'Evocation',
    }))
    store.currentCharacterData = character

    const wrapper = mount(PrintableSheet)
    const indexItems = wrapper.findAll('[data-testid="page-two-index-item"]')

    const featureItems = indexItems.filter((item) => item.text().startsWith('Feature'))
    const spellItems = indexItems.filter((item) => item.text().startsWith('Spell'))

    expect(featureItems.length).toBe(8)
    expect(spellItems.length).toBe(8)
    expect(wrapper.text()).toContain('+12 more')
  })

  it('applies the fixed A4 page class to every rendered page', () => {
    const store = useCharacterStore()
    const character = createBaseCharacter()
    character.features = [{ title: 'Alert', desc: 'You gain a +5 bonus to initiative.' }]
    store.currentCharacterData = character

    const wrapper = mount(PrintableSheet)
    const pages = wrapper.findAll('.a4-page')

    expect(pages.length).toBeGreaterThan(0)
    pages.forEach((page) => {
      expect(page.classes()).toContain('a4-page--fixed')
    })
  })

  it('clamps every page to a strict A4 height with overflow hidden', () => {
    const store = useCharacterStore()
    const character = createBaseCharacter()
    character.features = [{ title: 'Alert', desc: 'You gain a +5 bonus to initiative.' }]
    store.currentCharacterData = character

    const wrapper = mount(PrintableSheet)
    const pages = wrapper.findAll('.a4-page--fixed')

    expect(pages.length).toBeGreaterThan(0)
    pages.forEach((page) => {
      const style = page.attributes('style') || ''
      expect(style).toMatch(/max-height:\s*\d+(\.\d+)?mm/)
      expect(page.classes()).toContain('overflow-hidden')
    })
  })

  it('anchors the appendix footer to the bottom of page 2 so it cannot orphan', () => {
    const store = useCharacterStore()
    const character = createBaseCharacter()
    character.features = [{ title: 'Alert', desc: 'You gain a +5 bonus to initiative.' }]
    store.currentCharacterData = character

    const wrapper = mount(PrintableSheet)
    const footer = wrapper.find('[data-testid="appendix-footer"]')

    expect(footer.exists()).toBe(true)
    expect(footer.classes()).toContain('mt-auto')
  })

  it('renders exactly three pages for a dense character without overflowing into a fourth page', () => {
    const store = useCharacterStore()
    const character = createBaseCharacter()

    character.attacks = Array.from({ length: 10 }, (_, i) => ({
      name: `Attack ${i + 1}`,
      atkStat: 'int',
      dmgDie: '1d8',
      type: 'force',
      notes: `Note text for attack ${i + 1}.`,
    }))

    character.equippedGear = Array.from({ length: 10 }, (_, i) => ({
      id: `gear-${i + 1}`,
      name: `Gear Item ${i + 1}`,
      slotCost: 1,
    }))

    character.consumables = Array.from({ length: 10 }, (_, i) => ({
      id: `consumable-${i + 1}`,
      name: `Consumable ${i + 1}`,
      usageDie: 'd6',
    }))

    character.features = Array.from({ length: 12 }, (_, i) => ({
      title: `Feature ${i + 1}`,
      desc: `Description for feature ${i + 1}.`,
    }))

    character.spells = Array.from({ length: 12 }, (_, i) => ({
      name: `Spell ${i + 1}`,
      level: (i % 9) + 1,
      desc: `Description for spell ${i + 1}.`,
      school: 'Evocation',
    }))

    store.currentCharacterData = character

    const wrapper = mount(PrintableSheet)
    const pages = wrapper.findAll('.a4-page')

    expect(pages.length).toBe(3)
  })
})
