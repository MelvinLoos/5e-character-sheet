/**
 * Regression tests for src/views/Feats.vue
 *
 * Verifies the modal-based feat selection pattern matching the spells UX:
 * - Only selected feats shown by default
 * - "Add Feats" button visible only in edit mode
 * - Modal overlay opens with feat library, search, and category filters
 * - Feats can be added from library to character
 * - Feats can be removed from character
 * - "Custom Entry" button opens FeatureEditorModal
 * - Non-edit mode hides all add/remove buttons
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import 'fake-indexeddb/auto'
import Feats from '../src/views/Feats.vue'
import { useCharacterStore } from '../src/stores/character'
import { useRulesStore } from '../src/stores/rulesStore'

function makeMinimalCharacter(features: any[] = []) {
  return {
    name: 'Test',
    title: '',
    class: null,
    level: 1,
    species: null,
    background: null,
    renownTier: 1,
    pointBuyBaseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
    backgroundBonusSelections: { plusTwo: null, plusOne: null },
    abilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
    jobInParty: '',
    profBonus: 2,
    proficiencies: { savingThrows: [], skills: [] },
    combat: { ac: 10, hp_max: 1, hp_current: 1, speed: '30ft' },
    attacks: [],
    features,
    equipment: '',
    personality: { traits: '', ideal: '', bond: '', flaw: '', notes: '' },
    spellcasting: null,
    spells: [],
  } as any
}

/** Get the "Add Feats" button by text content. */
function findAddFeatsButton(wrapper: ReturnType<typeof mount>) {
  const buttons = wrapper.findAll('button')
  for (let i = 0; i < buttons.length; i++) {
    if (buttons[i].text().includes('Add Feats')) {
      return buttons[i]
    }
  }
  return null
}

/** Get the "Transcribe" buttons in the modal. */
function findTranscribeButtons(wrapper: ReturnType<typeof mount>) {
  const buttons = wrapper.findAll('button')
  return buttons.filter((b) => b.text().includes('Transcribe'))
}

describe('Feats.vue (modal-based selection pattern)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('rendering selected feats', () => {
    it('shows selected feats in the card grid', () => {
      const store = useCharacterStore()
      store.currentCharacterData = makeMinimalCharacter([
        { title: 'Alert', desc: 'You gain a +5 bonus to initiative.', key: false },
        { title: 'Lucky', desc: 'You have 3 luck points.', key: false },
      ])

      const wrapper = mount(Feats)

      expect(wrapper.text()).toContain('Alert')
      expect(wrapper.text()).toContain('Lucky')
    })

    it('shows empty state when no feats are selected', () => {
      const store = useCharacterStore()
      store.currentCharacterData = makeMinimalCharacter([])

      const wrapper = mount(Feats)

      // Default (non-editing) shows "No feats available for this character."
      expect(wrapper.text()).toContain('No feats available for this character.')
    })

    it('shows different empty state in edit mode', () => {
      const store = useCharacterStore()
      store.isEditing = true
      store.currentCharacterData = makeMinimalCharacter([])

      const wrapper = mount(Feats)

      // Editing mode shows a message mentioning "Add Feats"
      expect(wrapper.text()).toContain('No feats transcribed yet')
    })

    it('shows active count badge when feats exist', () => {
      const store = useCharacterStore()
      store.currentCharacterData = makeMinimalCharacter([
        { title: 'Alert', desc: '...', key: false },
      ])

      const wrapper = mount(Feats)

      expect(wrapper.text()).toContain('1 Active')
    })

    it('does not show active count badge when no feats exist', () => {
      const store = useCharacterStore()
      store.currentCharacterData = makeMinimalCharacter([])

      const wrapper = mount(Feats)

      expect(wrapper.text()).not.toContain('Active')
    })
  })

  describe('edit mode visibility', () => {
    it('shows "Add Feats" button only in edit mode', () => {
      const store = useCharacterStore()
      store.currentCharacterData = makeMinimalCharacter([])
      store.isEditing = true

      let wrapper = mount(Feats)
      expect(wrapper.text()).toContain('Add Feats')

      wrapper.unmount()
      store.isEditing = false
      wrapper = mount(Feats)
      expect(wrapper.text()).not.toContain('Add Feats')
    })

    it('hides remove (X) buttons outside edit mode', () => {
      const store = useCharacterStore()
      store.isEditing = false
      store.currentCharacterData = makeMinimalCharacter([
        { title: 'Alert', desc: '...', key: false },
      ])

      const wrapper = mount(Feats)

      const removeButtons = wrapper.findAll('[title="Remove Feat"]')
      expect(removeButtons.length).toBe(0)
    })

    it('shows remove (X) buttons in edit mode', () => {
      const store = useCharacterStore()
      store.isEditing = true
      store.currentCharacterData = makeMinimalCharacter([
        { title: 'Alert', desc: '...', key: false },
      ])

      const wrapper = mount(Feats)

      const removeButtons = wrapper.findAll('[title="Remove Feat"]')
      expect(removeButtons.length).toBe(1)
    })
  })

  describe('feat library modal', () => {
    it('opens modal when "Add Feats" button is clicked', async () => {
      const store = useCharacterStore()
      const rulesStore = useRulesStore()
      store.isEditing = true
      store.currentCharacterData = makeMinimalCharacter([])
      rulesStore.importData('feats', [
        { title: 'Alert', desc: 'You gain a +5 bonus to initiative.' },
      ])

      const wrapper = mount(Feats)

      // Modal should not be visible initially
      expect(wrapper.text()).not.toContain('Feat Archives')

      // Click "Add Feats" button
      const addBtn = findAddFeatsButton(wrapper)
      expect(addBtn).not.toBeNull()
      await addBtn!.trigger('click')

      // Modal should now be visible
      expect(wrapper.text()).toContain('Feat Archives')
    })

    it('shows library feats in the modal', async () => {
      const store = useCharacterStore()
      const rulesStore = useRulesStore()
      store.isEditing = true
      store.currentCharacterData = makeMinimalCharacter([])
      rulesStore.importData('feats', [
        { title: 'Alert', desc: 'You gain a +5 bonus to initiative.' },
        { title: 'Lucky', desc: 'You have 3 luck points.' },
      ])

      const wrapper = mount(Feats)

      // Open modal
      const addBtn = findAddFeatsButton(wrapper)
      expect(addBtn).not.toBeNull()
      await addBtn!.trigger('click')

      // Modal is rendered with v-if, should show library feats
      expect(wrapper.text()).toContain('Alert')
      expect(wrapper.text()).toContain('Lucky')
    })

    it('closes modal when clicking backdrop', async () => {
      const store = useCharacterStore()
      const rulesStore = useRulesStore()
      store.isEditing = true
      store.currentCharacterData = makeMinimalCharacter([])
      rulesStore.importData('feats', [{ title: 'Alert', desc: '...' }])

      const wrapper = mount(Feats)
      const addBtn = findAddFeatsButton(wrapper)
      expect(addBtn).not.toBeNull()
      await addBtn!.trigger('click')

      expect(wrapper.text()).toContain('Feat Archives')

      // Click backdrop (the outer fixed div with @click.self)
      const backdrop = wrapper.find('.fixed.inset-0')
      expect(backdrop.exists()).toBe(true)
      await backdrop.trigger('click')

      // Modal should close
      expect(wrapper.text()).not.toContain('Feat Archives')
    })

    it('closes modal when clicking X button', async () => {
      const store = useCharacterStore()
      const rulesStore = useRulesStore()
      store.isEditing = true
      store.currentCharacterData = makeMinimalCharacter([])
      rulesStore.importData('feats', [{ title: 'Alert', desc: '...' }])

      const wrapper = mount(Feats)
      const addBtn = findAddFeatsButton(wrapper)
      expect(addBtn).not.toBeNull()
      await addBtn!.trigger('click')

      expect(wrapper.text()).toContain('Feat Archives')

      // Click the close button (X) in modal header
      // The close button is inside the rounded-t-lg div with text "close"
      const closeBtns = wrapper.findAll('button')
      const closeBtn = closeBtns.find((b) => b.text().includes('close') && b.classes().includes('p-2'))
      expect(closeBtn).toBeDefined()
      await closeBtn!.trigger('click')

      expect(wrapper.text()).not.toContain('Feat Archives')
    })

    it('shows "Custom Entry" footer button', async () => {
      const store = useCharacterStore()
      const rulesStore = useRulesStore()
      store.isEditing = true
      store.currentCharacterData = makeMinimalCharacter([])
      rulesStore.importData('feats', [{ title: 'Alert', desc: '...' }])

      const wrapper = mount(Feats)
      const addBtn = findAddFeatsButton(wrapper)
      expect(addBtn).not.toBeNull()
      await addBtn!.trigger('click')

      expect(wrapper.text()).toContain('Custom Entry')
    })

    it('shows "Found N feats" count in footer', async () => {
      const store = useCharacterStore()
      const rulesStore = useRulesStore()
      store.isEditing = true
      store.currentCharacterData = makeMinimalCharacter([])
      rulesStore.importData('feats', [
        { title: 'Alert', desc: '...' },
        { title: 'Lucky', desc: '...' },
      ])

      const wrapper = mount(Feats)
      const addBtn = findAddFeatsButton(wrapper)
      expect(addBtn).not.toBeNull()
      await addBtn!.trigger('click')

      expect(wrapper.text()).toContain('Found 2 feats')
    })
  })

  describe('adding feats from library', () => {
    it('adds a feat from library to character features', async () => {
      const store = useCharacterStore()
      const rulesStore = useRulesStore()
      store.isEditing = true
      store.currentCharacterData = makeMinimalCharacter([])
      rulesStore.importData('feats', [
        { title: 'Alert', desc: 'You gain a +5 bonus to initiative.' },
      ])

      const wrapper = mount(Feats)

      // Open modal
      const addBtn = findAddFeatsButton(wrapper)
      expect(addBtn).not.toBeNull()
      await addBtn!.trigger('click')

      // Click "Transcribe" on the first feat
      const transcribeBtns = findTranscribeButtons(wrapper)
      expect(transcribeBtns.length).toBeGreaterThanOrEqual(1)
      await transcribeBtns[0].trigger('click')

      expect(store.currentCharacterData.features.length).toBe(1)
      expect(store.currentCharacterData.features[0].title).toBe('Alert')
    })

    it('can add the same feat multiple times', async () => {
      const store = useCharacterStore()
      const rulesStore = useRulesStore()
      store.isEditing = true
      store.currentCharacterData = makeMinimalCharacter([])
      rulesStore.importData('feats', [
        { title: 'Alert', desc: '...' },
      ])

      const wrapper = mount(Feats)
      const addBtn = findAddFeatsButton(wrapper)
      expect(addBtn).not.toBeNull()
      await addBtn!.trigger('click')

      // Click twice
      const transcribeBtns = findTranscribeButtons(wrapper)
      expect(transcribeBtns.length).toBe(1)
      await transcribeBtns[0].trigger('click')
      // Re-open and click again
      await addBtn!.trigger('click')
      const transcribeBtns2 = findTranscribeButtons(wrapper)
      expect(transcribeBtns2.length).toBe(1)
      await transcribeBtns2[0].trigger('click')

      // Should add each time (no dedup)
      expect(store.currentCharacterData.features.length).toBe(2)
      expect(store.currentCharacterData.features[0].title).toBe('Alert')
      expect(store.currentCharacterData.features[1].title).toBe('Alert')
    })
  })

  describe('removing feats', () => {
    it('removes a feat when X button is clicked', async () => {
      const store = useCharacterStore()
      store.isEditing = true
      store.currentCharacterData = makeMinimalCharacter([
        { title: 'Alert', desc: '...', key: false },
        { title: 'Lucky', desc: '...', key: false },
      ])

      const wrapper = mount(Feats)

      expect(store.currentCharacterData.features.length).toBe(2)

      // Click first remove button
      const removeBtns = wrapper.findAll('[title="Remove Feat"]')
      expect(removeBtns.length).toBe(2)
      await removeBtns[0].trigger('click')

      expect(store.currentCharacterData.features.length).toBe(1)
      expect(store.currentCharacterData.features[0].title).toBe('Lucky')
    })
  })

  describe('category filters', () => {
    it('shows category filter pills in the modal', async () => {
      const store = useCharacterStore()
      const rulesStore = useRulesStore()
      store.isEditing = true
      store.currentCharacterData = makeMinimalCharacter([])
      rulesStore.importData('feats', [{ title: 'Alert', desc: '...' }])

      const wrapper = mount(Feats)
      const addBtn = findAddFeatsButton(wrapper)
      expect(addBtn).not.toBeNull()
      await addBtn!.trigger('click')

      expect(wrapper.text()).toContain('All Forms')
      expect(wrapper.text()).toContain('Combat')
      expect(wrapper.text()).toContain('Magic')
      expect(wrapper.text()).toContain('Utility')
    })
  })

  describe('search filtering', () => {
    it('has a search input in the main view', () => {
      const store = useCharacterStore()
      store.currentCharacterData = makeMinimalCharacter([
        { title: 'Alert', desc: '...', key: false },
      ])

      const wrapper = mount(Feats)

      const searchInput = wrapper.find('input[placeholder="Search my feats..."]')
      expect(searchInput.exists()).toBe(true)
    })

    it('has a search input in the library modal', async () => {
      const store = useCharacterStore()
      const rulesStore = useRulesStore()
      store.isEditing = true
      store.currentCharacterData = makeMinimalCharacter([])
      rulesStore.importData('feats', [{ title: 'Alert', desc: '...' }])

      const wrapper = mount(Feats)
      const addBtn = findAddFeatsButton(wrapper)
      expect(addBtn).not.toBeNull()
      await addBtn!.trigger('click')

      const searchInput = wrapper.find('input[placeholder="Filter by name or description..."]')
      expect(searchInput.exists()).toBe(true)
    })
  })

  describe('expand/collapse descriptions', () => {
    it('shows expand chevron on feat cards', () => {
      const store = useCharacterStore()
      store.currentCharacterData = makeMinimalCharacter([
        { title: 'Alert', desc: 'You gain a +5 bonus to initiative.', key: false },
      ])

      const wrapper = mount(Feats)

      // Find chevron_right icon
      expect(wrapper.text()).toContain('chevron_right')
    })

    it('card header is clickable for toggling', async () => {
      const store = useCharacterStore()
      store.currentCharacterData = makeMinimalCharacter([
        { title: 'Alert', desc: 'You gain a +5 bonus to initiative.', key: false },
      ])

      const wrapper = mount(Feats)

      // The card header has class cursor-pointer and click handler
      const clickableHeader = wrapper.find('.cursor-pointer')
      expect(clickableHeader.exists()).toBe(true)
      await clickableHeader.trigger('click')
      // Should not throw — test that the toggle function works
    })
  })

  describe('modal not shown outside edit mode', () => {
    it('does not show library modal when not editing even after click', async () => {
      const store = useCharacterStore()
      const rulesStore = useRulesStore()
      store.isEditing = false
      store.currentCharacterData = makeMinimalCharacter([])
      rulesStore.importData('feats', [{ title: 'Alert', desc: '...' }])

      const wrapper = mount(Feats)

      // No Add Feats button
      expect(wrapper.text()).not.toContain('Add Feats')
      // Modal should not be in DOM
      expect(wrapper.text()).not.toContain('Feat Archives')
    })
  })

// ---------------------------------------------------------------------------
// Expandable feat library descriptions (#214)
// ---------------------------------------------------------------------------

describe('Feats.vue expandable library descriptions (#214)', () => {
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

  /** Opens the "Feat Archives" modal and flushes ExpandableText measurements. */
  async function openFeatLibrary(wrapper: ReturnType<typeof mount>) {
    const addBtn = findAddFeatsButton(wrapper)
    expect(addBtn).not.toBeNull()
    await addBtn!.trigger('click')
    await nextTick()
    await nextTick()
  }

  it('shows a "Show more" toggle on long library feat descriptions', async () => {
    const store = useCharacterStore()
    const rulesStore = useRulesStore()
    store.isEditing = true
    store.currentCharacterData = makeMinimalCharacter([])
    rulesStore.importData('feats', [
      { title: 'Alert', desc: LONG_DESC },
      { title: 'Lucky', desc: 'Short.' },
    ])

    const wrapper = mount(Feats)
    await openFeatLibrary(wrapper)

    const toggleButtons = wrapper.findAll('button').filter((b) => b.text() === 'Show more')
    expect(toggleButtons).toHaveLength(1)

    const longDesc = wrapper.findAll('p').find((p) => p.text() === LONG_DESC)
    expect(longDesc?.attributes('style')).toContain('-webkit-line-clamp: 2')
    const shortDesc = wrapper.findAll('p').find((p) => p.text() === 'Short.')
    expect(shortDesc?.attributes('style')).toBeUndefined()
  })

  it('expands and collapses a long library feat description', async () => {
    const store = useCharacterStore()
    const rulesStore = useRulesStore()
    store.isEditing = true
    store.currentCharacterData = makeMinimalCharacter([])
    rulesStore.importData('feats', [{ title: 'Alert', desc: LONG_DESC }])

    const wrapper = mount(Feats)
    await openFeatLibrary(wrapper)

    const toggle = wrapper.findAll('button').find((b) => b.text() === 'Show more')
    expect(toggle).toBeDefined()
    await toggle!.trigger('click')

    expect(toggle!.text()).toBe('Show less')
    expect(toggle!.attributes('aria-expanded')).toBe('true')
    expect(
      wrapper.findAll('p').find((p) => p.text() === LONG_DESC)?.attributes('style') ?? '',
    ).not.toContain('-webkit-line-clamp')

    await toggle!.trigger('click')

    expect(toggle!.text()).toBe('Show more')
    expect(
      wrapper.findAll('p').find((p) => p.text() === LONG_DESC)?.attributes('style'),
    ).toContain('-webkit-line-clamp: 2')
  })
})
})