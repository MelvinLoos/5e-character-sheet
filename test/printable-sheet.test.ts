import { readFileSync } from 'node:fs'
import { mount, flushPromises } from '@vue/test-utils'
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

  it('prints the rolled initiative only when set', () => {
    const store = useCharacterStore()
    store.currentCharacterData = createBaseCharacter()
    expect(mount(PrintableSheet).find('[data-testid="print-initiative-rolled"]').exists()).toBe(false)

    store.currentCharacterData.combat.initiative = 17
    const rolled = mount(PrintableSheet).find('[data-testid="print-initiative-rolled"]')
    expect(rolled.text()).toBe('Rolled: 17')
  })

  it('renders exactly two .a4-page elements when no feature or spell descriptions exist', () => {
    const store = useCharacterStore()
    const character = createBaseCharacter()
    // No personality text either, so nothing needs an appendix
    character.personality = { traits: '', ideal: '', bond: '', flaw: '', notes: '' }
    store.currentCharacterData = character

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
    // No personality text either, so nothing needs an appendix
    character.personality = { traits: '', ideal: '', bond: '', flaw: '', notes: '' }
    character.features = [{ title: 'Alert', desc: '' }]
    character.spells = [{ name: 'Burning Hands', level: 1, desc: '', school: 'Evocation' }]
    store.currentCharacterData = character

    const wrapper = mount(PrintableSheet)
    const pages = wrapper.findAll('.a4-page')

    expect(pages.length).toBe(2)
  })

  it('renders Markdown formatting in the spell appendix (#215)', () => {
    const store = useCharacterStore()
    const character = createBaseCharacter()
    character.spells = [
      {
        name: 'Fireball',
        level: 3,
        desc: '**Boom.** A *big* boom.\n\n- 8d6 fire damage',
        school: 'Evocation',
      },
    ]
    store.currentCharacterData = character

    const wrapper = mount(PrintableSheet)

    expect(wrapper.html()).toContain('<strong>Boom.</strong>')
    expect(wrapper.html()).toContain('<em>big</em>')
    expect(wrapper.html()).toContain('<li>8d6 fire damage</li>')
    expect(wrapper.html()).not.toContain('**Boom.**')
  })

  it('renders Markdown formatting in the feat appendix (#215)', () => {
    const store = useCharacterStore()
    const character = createBaseCharacter()
    character.features = [
      { title: 'Alert', desc: '**Alert.** You gain a +5 bonus to initiative.' },
    ]
    store.currentCharacterData = character

    const wrapper = mount(PrintableSheet)

    expect(wrapper.html()).toContain('<strong>Alert.</strong>')
  })

  it('escapes raw HTML in appendix descriptions (#215)', () => {
    const store = useCharacterStore()
    const character = createBaseCharacter()
    character.spells = [
      { name: 'Evil', level: 1, desc: '<script>alert(1)</script>', school: 'Necromancy' },
    ]
    store.currentCharacterData = character

    const wrapper = mount(PrintableSheet)

    expect(wrapper.html()).not.toContain('<script>')
  })

  it('normalizes legacy HTML lists in appendix descriptions (#215)', () => {
    const store = useCharacterStore()
    const character = createBaseCharacter()
    character.features = [
      { title: 'Alert', desc: '<ul><li>Never surprised</li><li>+5 initiative</li></ul>' },
    ]
    store.currentCharacterData = character

    const wrapper = mount(PrintableSheet)

    expect(wrapper.html()).toContain('<li>Never surprised</li>')
    expect(wrapper.html()).toContain('<li>+5 initiative</li>')
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

  it('applies the fixed A4 page class to the character pages', () => {
    const store = useCharacterStore()
    const character = createBaseCharacter()
    character.features = [{ title: 'Alert', desc: 'You gain a +5 bonus to initiative.' }]
    store.currentCharacterData = character

    const wrapper = mount(PrintableSheet)
    const pages = wrapper.findAll('.a4-page')

    expect(pages.length).toBeGreaterThan(0)
    pages
      .filter((page) => !page.classes().includes('a4-page--flow'))
      .forEach((page) => {
        expect(page.classes()).toContain('a4-page--fixed')
      })
  })

  it('lets the appendix grow with its content instead of clipping it', () => {
    const store = useCharacterStore()
    const character = createBaseCharacter()
    character.features = Array.from({ length: 12 }, (_, i) => ({
      title: `Feature ${i + 1}`,
      desc: 'A long description. '.repeat(40),
    }))
    store.currentCharacterData = character

    const wrapper = mount(PrintableSheet)
    const appendix = wrapper.find('.a4-page--flow')

    expect(appendix.exists()).toBe(true)
    expect(appendix.classes()).not.toContain('overflow-hidden')
    const style = appendix.attributes('style') || ''
    expect(style).toMatch(/min-height:\s*\d+(\.\d+)?mm/)
    expect(style).not.toMatch(/(?<!min-)height:\s*\d/)
  })

  it('clamps every fixed page to a strict A4 height with overflow hidden', () => {
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

  it('renders a share QR code on page 1 only when the character has a share link', async () => {
    const store = useCharacterStore()
    store.currentCharacterData = createBaseCharacter()

    const withoutShare = mount(PrintableSheet)
    await flushPromises()
    expect(withoutShare.find('[data-testid="sheet-share-qr"]').exists()).toBe(false)

    store.sourceCharacterId = 'share-123'

    const withShare = mount(PrintableSheet)
    await flushPromises()

    const qrBlock = withShare.find('[data-testid="sheet-share-qr"]')
    expect(qrBlock.exists()).toBe(true)
    expect(qrBlock.text()).toContain('Scan for the digital sheet')
    expect(qrBlock.text()).toContain('?id=share-123')
    expect(withShare.find('[data-testid="sheet-share-qr-code"]').html()).toContain('<svg')
  })
})

describe('PrintableSheet completeness (UI/UX audit phase 6)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  function baseCharacter() {
    const store = useCharacterStore()
    const character = {
      ...store.currentCharacterData,
      name: 'Throg',
      class: 'Fighter',
      proficiencies: { savingThrows: ['str', 'con'], skills: [] },
      combat: { ac: 16, hp_current: 12, hp_max: 12, hp_temp: 5, speed: '30ft', isAcOverride: false },
      personality: { traits: '', ideal: '', bond: '', flaw: '', notes: '' },
      features: [],
      spells: [],
      attacks: [],
      equippedGear: [],
      consumables: [],
    } as any
    return { store, character }
  }

  it('prints saving throws, hit dice, temp HP and death save boxes on page 1', () => {
    const { store, character } = baseCharacter()
    store.currentCharacterData = character
    const wrapper = mount(PrintableSheet)

    const saves = wrapper.get('[data-testid="print-saving-throws"]')
    expect(saves.findAll('li')).toHaveLength(6)
    expect(saves.findAll('.skill-prof-filled')).toHaveLength(2)
    expect(wrapper.get('[data-testid="print-temp-hp"]').text()).toContain('5')
    expect(wrapper.get('[data-testid="print-hit-dice"]').text()).toMatch(/\d+d10/)
    expect(wrapper.get('[data-testid="print-death-saves"]').findAll('.print-box')).toHaveLength(6)
  })

  it('prints personality and backstory in the appendix', () => {
    const { store, character } = baseCharacter()
    character.personality = { traits: 'Loud', ideal: '', bond: 'My axe', flaw: '', notes: 'Born in a cave.' }
    store.currentCharacterData = character
    const wrapper = mount(PrintableSheet)

    const section = wrapper.get('[data-testid="appendix-personality"]')
    expect(section.text()).toContain('Personality Traits')
    expect(section.text()).toContain('Born in a cave.')
    expect(section.text()).not.toContain('Ideals')
    expect(wrapper.findAll('.a4-page')).toHaveLength(3)
  })

  it('lists everything page 2 cannot fit in the appendix instead of dropping it', () => {
    const { store, character } = baseCharacter()
    character.attacks = Array.from({ length: 8 }, (_, i) => ({ name: `Attack ${i + 1}`, atkStat: 'str', dmgDie: '1d6', type: 'slashing' }))
    character.features = Array.from({ length: 10 }, (_, i) => ({ title: `Feature ${i + 1}`, desc: '' }))
    character.consumables = Array.from({ length: 6 }, (_, i) => ({ id: `c${i}`, name: `Potion ${i + 1}`, usageDie: 'd6' }))
    store.currentCharacterData = character
    const wrapper = mount(PrintableSheet)

    const overflow = wrapper.get('[data-testid="appendix-overflow"]')
    expect(overflow.text()).toContain('Attack 7')
    expect(overflow.text()).toContain('Attack 8')
    expect(overflow.text()).toContain('Feature 9')
    expect(overflow.text()).toContain('Potion 6')
    expect(overflow.text()).not.toContain('Attack 1 ')
    expect(wrapper.text()).toContain('more attacks — see Appendix')
  })

  it('prints tick boxes for limited-use features on page 2', () => {
    const { store, character } = baseCharacter()
    character.features = [{ title: 'Second Wind', desc: '', uses: { total: 2, per: 'short rest' } }]
    store.currentCharacterData = character
    const wrapper = mount(PrintableSheet)

    const item = wrapper.findAll('[data-testid="page-two-index-item"]')[0]!
    expect(item.findAll('.print-box')).toHaveLength(2)
  })

  it('keeps print text at 11px or larger and lets section headers print', () => {
    const src = readFileSync('src/components/sheet/PrintableSheet.vue', 'utf8')
    expect(src).not.toMatch(/text-\[(8|9|10)px\]/)
    expect(src).not.toMatch(/@import url\(/)
    expect(src).not.toMatch(/background-color: transparent !important/)
    expect(src).toContain('print-color-adjust: exact')
  })
})
