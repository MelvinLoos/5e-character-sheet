import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { useCharacterStore } from '@/stores/character'
import { createBlankCharacter } from '@/domain'
import RestActions from '@/components/sheet/RestActions.vue'

function setup() {
  setActivePinia(createPinia())
  const store = useCharacterStore()
  const c = createBlankCharacter()
  c.class = 'Fighter'
  c.combat.hp_current = 1
  store.currentCharacterData = c
  return store
}

describe('character store rests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('longRest then undoRest round-trips', () => {
    const store = setup()
    const before = JSON.stringify(store.currentCharacterData)
    store.longRest()
    expect(store.restUndoSnapshot).not.toBeNull()
    expect(store.currentCharacterData.combat.hp_current).toBeGreaterThan(1)
    store.undoRest()
    expect(JSON.stringify(store.currentCharacterData)).toBe(before)
    expect(store.restUndoSnapshot).toBeNull()
  })

  it('shortRest then undoRest round-trips', () => {
    const store = setup()
    const before = JSON.stringify(store.currentCharacterData)
    store.shortRest({ hitDiceSpent: 1, useAverage: true })
    expect(store.currentCharacterData.combat.hit_dice_used).toBe(1)
    store.undoRest()
    expect(JSON.stringify(store.currentCharacterData)).toBe(before)
  })

  it('clearRestUndo drops the snapshot', () => {
    const store = setup()
    store.longRest()
    store.clearRestUndo()
    expect(store.restUndoSnapshot).toBeNull()
  })
})

describe('RestActions', () => {
  it('enables both buttons when hurt and opens the modal on click', async () => {
    setup()
    const wrapper = mount(RestActions, { attachTo: document.body })
    const short = wrapper.get('[data-testid="short-rest-btn"]')
    const long = wrapper.get('[data-testid="long-rest-btn"]')
    expect(short.attributes('disabled')).toBeUndefined()
    await long.trigger('click')
    expect(document.body.textContent).toContain('Take a Long Rest')
    wrapper.unmount()
  })

  it('disables both buttons when fully rested', () => {
    const store = setup()
    const progression = store.buildRestContext()
    store.currentCharacterData.combat.hp_current = progression.maxHp
    const wrapper = mount(RestActions)
    expect(wrapper.get('[data-testid="short-rest-btn"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-testid="long-rest-btn"]').attributes('disabled')).toBeDefined()
  })
})
