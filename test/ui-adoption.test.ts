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
