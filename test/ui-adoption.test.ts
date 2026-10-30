/**
 * Tests that screens use the shared UI primitives (Phase 4 of the UI/UX audit).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { setActivePinia, createPinia } from 'pinia'
import { createBlankCharacter } from '../src/domain'
import { useCharacterStore } from '../src/stores/character'
import InfoButton from '../src/components/ui/InfoButton.vue'
import ActionBadge from '../src/components/ui/ActionBadge.vue'
import CompletionBadge from '../src/components/ui/CompletionBadge.vue'
import Narrative from '../src/views/Narrative.vue'
import Spells from '../src/views/Spells.vue'
import Inventory from '../src/views/Inventory.vue'

beforeEach(() => {
  setActivePinia(createPinia())
  useCharacterStore().currentCharacterData = createBlankCharacter()
})

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

describe('views use PageHeader', () => {
  it.each([
    ['Narrative', Narrative, 'Chronicles & Lore'],
    ['Spells', Spells, 'Spells'],
    ['Inventory', Inventory, 'Inventory'],
  ])('%s renders a single page h1', (_name, component, title) => {
    const wrapper = mount(component as never)
    const headings = wrapper.findAll('h1')
    expect(headings).toHaveLength(1)
    expect(headings[0]!.text()).toBe(title)
  })
})

describe('InfoButton', () => {
  it('opens an accessible dialog and returns focus to the trigger', async () => {
    const wrapper = mount(InfoButton, {
      props: { title: 'Advantage', content: 'Roll two dice, keep the best.' },
      attachTo: document.body,
    })
    const trigger = wrapper.get('button')
    expect(trigger.attributes('aria-label')).toBe('More information: Advantage')
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()

    trigger.element.focus()
    await trigger.trigger('click')
    await flushPromises()
    const dialog = document.body.querySelector('[role="dialog"]')!
    expect(dialog.textContent).toContain('Roll two dice, keep the best.')

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    expect(document.activeElement).toBe(trigger.element)
    wrapper.unmount()
  })
})

describe('theme tokens in badges', () => {
  it('CompletionBadge uses the error tokens, not raw red', () => {
    const wrapper = mount(CompletionBadge, { props: { badge: { type: 'alert', label: 'x' } as never } })
    expect(wrapper.classes()).toContain('bg-error')
    expect(wrapper.classes().join(' ')).not.toMatch(/red-\d/)
  })

  it('ActionBadge uses theme tokens for every action type', () => {
    for (const type of ['Action', 'Bonus Action', 'Reaction', 'Free Action', 'Passive'] as const) {
      const html = mount(ActionBadge, { props: { type } as never }).html()
      expect(html).not.toMatch(/(red|orange|blue|gray)-\d/)
    }
  })
})

describe('ImportModal / ImportCharacterModal', () => {
  it.each([
    ['ImportModal', () => import('../src/components/modals/ImportModal.vue'), 'Import 5e.tools Data'],
    ['ImportCharacterModal', () => import('../src/components/modals/ImportCharacterModal.vue'), 'Import Character'],
  ])('%s is a labelled dialog with a keyboard-reachable file input and no raw palette colours', async (_n, load, title) => {
    const Modal = (await load()).default
    const wrapper = mount(Modal, { props: { show: true }, attachTo: document.body })
    const dialog = document.body.querySelector('[role="dialog"]')!
    expect(dialog.textContent).toContain(title)

    const input = document.body.querySelector<HTMLInputElement>('input[type="file"]')!
    expect(input.classList.contains('hidden')).toBe(false)
    expect(input.classList.contains('sr-only')).toBe(true)
    expect(document.body.querySelector(`label[for="${input.id}"]`)).not.toBeNull()

    expect(dialog.innerHTML).not.toMatch(/(?:bg|text|border)-(?:gray|blue|green|red|amber)-\d/)
    expect(dialog.textContent).not.toMatch(/[📁📄⚠]/u)

    ;[...document.body.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Cancel')!.click()
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })
})

describe('LibraryModal', () => {
  it('provides a labelled search, a live count and an actions footer', async () => {
    const { default: LibraryModal } = await import('../src/components/ui/LibraryModal.vue')
    const wrapper = mount(LibraryModal, {
      props: { open: true, title: 'Spell Library', searchLabel: 'Search spells', countLabel: '3 spells found', search: '' },
      slots: { default: '<p id="results">results</p>', actions: '<button id="extra">Custom</button>' },
      attachTo: document.body,
    })
    const search = document.body.querySelector<HTMLInputElement>('input[type="search"]')!
    expect(document.body.querySelector(`label[for="${search.id}"]`)!.textContent).toContain('Search spells')
    expect(document.body.querySelector('[role="status"]')!.textContent).toBe('3 spells found')
    expect(document.body.querySelector('#results')).not.toBeNull()
    expect(document.body.querySelector('#extra')).not.toBeNull()

    search.value = 'fire'
    search.dispatchEvent(new Event('input'))
    expect(wrapper.emitted('update:search')?.[0]).toEqual(['fire'])
    wrapper.unmount()
  })
})

describe('FeatureEditorModal delete', () => {
  it('asks for confirmation in-app before emitting delete', async () => {
    const { default: FeatureEditorModal } = await import('../src/components/modals/FeatureEditorModal.vue')
    const { useConfirm } = await import('../src/composables/useConfirm')
    const wrapper = mount(FeatureEditorModal, {
      props: { isOpen: true, isNew: false, feature: { title: 'Alert', desc: 'x' } },
      global: { stubs: { teleport: true } },
    })
    const del = wrapper.findAll('button').find((b) => b.text().includes('Delete'))!
    await del.trigger('click')
    const { state, settle } = useConfirm()
    expect(state.open).toBe(true)
    expect(state.danger).toBe(true)
    expect(wrapper.emitted('delete')).toBeUndefined()

    settle(true)
    await flushPromises()
    expect(wrapper.emitted('delete')).toHaveLength(1)
  })
})

describe('StartingEquipmentWizard option cards', () => {
  it('exposes class options as keyboard-operable radios', async () => {
    const { default: Wizard } = await import('../src/components/creation/StartingEquipmentWizard.vue')
    const store = useCharacterStore()
    store.currentCharacterData.class = 'Fighter'
    store.currentCharacterData.background = 'Soldier'
    const wrapper = mount(Wizard)
    const radios = wrapper.findAll('[role="radio"]')
    expect(radios.length).toBeGreaterThan(0)
    expect(wrapper.find('[role="radiogroup"]').exists()).toBe(true)
    radios.forEach((r) => {
      expect(r.attributes('tabindex')).toBe('0')
      expect(r.attributes('aria-checked')).toMatch(/true|false/)
    })

    const first = radios[0]!
    await first.trigger('keydown', { key: 'Enter' })
    expect(wrapper.find('[role="radio"][aria-checked="true"]').exists()).toBe(true)
  })
})
