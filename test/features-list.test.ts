import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import 'fake-indexeddb/auto'
import { setActivePinia, createPinia } from 'pinia'
import FeaturesList from '../src/components/sheet/FeaturesList.vue'
import { useCharacterStore } from '../src/stores/character'
import { useRulesStore } from '../src/stores/rulesStore'

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

// ---------------------------------------------------------------------------
// Expandable feature archive descriptions (#214)
// ---------------------------------------------------------------------------

describe('FeaturesList feature archives expandable descriptions (#214)', () => {
  const LONG_DESC =
    'You gain a +5 bonus to initiative. You can never be surprised while ' +
    'conscious. Other creatures do not gain advantage on attack rolls ' +
    'against you as a result of being unseen by you.'

  const originalScrollHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'scrollHeight',
  )
  const originalClientHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'clientHeight',
  )

  beforeEach(() => {
    setActivePinia(createPinia())
    // jsdom does not perform layout, so scrollHeight/clientHeight are always 0.
    // Mock them so that "long" texts overflow the fixed 40px clientHeight.
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get(this: HTMLElement) {
        return this.textContent?.length ?? 0
      },
    })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get() {
        return 40
      },
    })
  })

  afterEach(() => {
    if (originalScrollHeight) {
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', originalScrollHeight)
    } else {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollHeight
    }

    if (originalClientHeight) {
      Object.defineProperty(HTMLElement.prototype, 'clientHeight', originalClientHeight)
    } else {
      delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight
    }
  })

  function makeCharacter(features: unknown[]) {
    return {
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
      features,
      equipment: '',
      personality: { traits: '', ideal: '', bond: '', flaw: '', notes: '' },
      spellcasting: null,
      spells: [],
    } as any
  }

  /** Opens the "Feature Archives" modal and flushes ExpandableText measurements. */
  async function openArchives(wrapper: ReturnType<typeof mount>) {
    const addBtn = wrapper.findAll('button').find((b) => b.attributes('title') === 'Add Feature')
    expect(addBtn).toBeDefined()
    await addBtn!.trigger('click')
    await nextTick()
    await nextTick()
  }

  function mountComponent(store: ReturnType<typeof useCharacterStore>) {
    return mount(FeaturesList, {
      props: {
        features: store.currentCharacterData.features,
        title: 'Key Features',
        editable: true,
      },
    })
  }

  it('shows a "Show more" toggle on long archive feature descriptions', async () => {
    const store = useCharacterStore()
    const rulesStore = useRulesStore()
    store.isEditing = true
    store.currentCharacterData = makeCharacter([])
    rulesStore.importData('feats', [
      { title: 'Alert', desc: LONG_DESC },
      { title: 'Lucky', desc: 'Short.' },
    ])

    const wrapper = mountComponent(store)
    await openArchives(wrapper)

    expect(wrapper.text()).toContain('Feature Archives')
    const toggleButtons = wrapper.findAll('button').filter((b) => b.text() === 'Show more')
    expect(toggleButtons).toHaveLength(1)

    const longDesc = wrapper.findAll('p').find((p) => p.text() === LONG_DESC)
    expect(longDesc?.attributes('style')).toContain('-webkit-line-clamp: 2')
    const shortDesc = wrapper.findAll('p').find((p) => p.text() === 'Short.')
    expect(shortDesc?.attributes('style')).toBeUndefined()
  })

  it('does not add the feature when the "Show more" toggle is clicked', async () => {
    const store = useCharacterStore()
    const rulesStore = useRulesStore()
    store.isEditing = true
    store.currentCharacterData = makeCharacter([])
    rulesStore.importData('feats', [{ title: 'Alert', desc: LONG_DESC }])

    const wrapper = mountComponent(store)
    await openArchives(wrapper)

    const toggle = wrapper.findAll('button').find((b) => b.text() === 'Show more')
    expect(toggle).toBeDefined()
    await toggle!.trigger('click')

    expect(toggle!.text()).toBe('Show less')
    // The archive card's own click handler adds the feature — the toggle must not bubble.
    expect(store.currentCharacterData.features.length).toBe(0)
    expect(wrapper.text()).toContain('Feature Archives')
  })
})
