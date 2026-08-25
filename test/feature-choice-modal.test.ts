/**
 * Regression tests for src/components/modals/FeatureChoiceModal.vue
 *
 * Modal uses <Teleport to="body"> so queries go via document.body.
 * Use attachTo: document.body and clean up between tests.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach } from 'vitest'
import FeatureChoiceModal from '../src/components/modals/FeatureChoiceModal.vue'

function qs(sel: string) { return document.body.querySelector(sel) }
function qsa(sel: string) { return document.body.querySelectorAll(sel) }

function mountOpen(props: Record<string, unknown> = {}) {
  return mount(FeatureChoiceModal, {
    attachTo: document.body,
    props: { ...props },
  })
}

describe('FeatureChoiceModal.vue', () => {
  afterEach(() => { document.body.innerHTML = '' })

  it('does not render when isOpen is false', () => {
    mountOpen({ isOpen: false, choiceId: 'eldritch-invocations', currentSelections: [] })
    expect(qs('[data-test="feature-choice-option"]')).toBeNull()
  })

  it('does not render when choiceId is empty', () => {
    mountOpen({ isOpen: true, choiceId: '', currentSelections: [] })
    expect(qs('[data-test="feature-choice-option"]')).toBeNull()
  })

  it('renders the choice label', () => {
    mountOpen({ isOpen: true, choiceId: 'eldritch-invocations', currentSelections: [] })
    expect(document.body.textContent!).toContain('Eldritch Invocations')
  })

  it('renders all options', () => {
    mountOpen({ isOpen: true, choiceId: 'eldritch-invocations', currentSelections: [] })
    expect(qsa('[data-test="feature-choice-option"]').length).toBe(22)
  })

  it('shows remaining count', () => {
    mountOpen({ isOpen: true, choiceId: 'eldritch-invocations', currentSelections: [] })
    const c = qs('[data-test="remaining-count"]')
    expect(c!.textContent).toContain('0 / 2 selected')
  })

  it('show prerequisite indicators', () => {
    mountOpen({ isOpen: true, choiceId: 'eldritch-invocations', currentSelections: [] })
    const o = qs('[data-id="agonizing-blast"]')
    expect(o!.textContent).toContain('Prerequisite:')
    expect(o!.textContent).toContain('Eldritch Blast cantrip')
  })

  it('toggle on click via document.body', async () => {
    mountOpen({ isOpen: true, choiceId: 'eldritch-invocations', currentSelections: [] })
    const el = qs('[data-id="agonizing-blast"]') as HTMLElement
    el.click()
    await Promise.resolve()
    expect(el.classList.contains('selected')).toBe(true)
    el.click()
    await Promise.resolve()
    expect(el.classList.contains('selected')).toBe(false)
  })

  it('prevents exceeding max selections', async () => {
    mountOpen({ isOpen: true, choiceId: 'eldritch-invocations', currentSelections: [] })
    ;(qs('[data-id="agonizing-blast"]') as HTMLElement).click()
    ;(qs('[data-id="armor-of-shadows"]') as HTMLElement).click()
    ;(qs('[data-id="beast-speech"]') as HTMLElement).click()
    expect((qs('[data-id="beast-speech"]') as HTMLElement).classList.contains('selected')).toBe(false)
  })

  it('preselects from currentSelections', () => {
    mountOpen({ isOpen: true, choiceId: 'eldritch-invocations', currentSelections: ['devils-sight'] })
    expect((qs('[data-id="devils-sight"]') as HTMLElement).classList.contains('selected')).toBe(true)
  })

  it('emits close on cancel click', () => {
    const w = mountOpen({ isOpen: true, choiceId: 'eldritch-invocations', currentSelections: [] })
    ;(qs('[data-test="modal-cancel-btn"]') as HTMLElement).click()
    expect(w.emitted().close).toBeTruthy()
  })

  it('emits close on X button', () => {
    const w = mountOpen({ isOpen: true, choiceId: 'eldritch-invocations', currentSelections: [] })
    ;(qs('[data-test="modal-close-btn"]') as HTMLElement).click()
    expect(w.emitted().close).toBeTruthy()
  })

  it('emits close on backdrop click', () => {
    const w = mountOpen({ isOpen: true, choiceId: 'eldritch-invocations', currentSelections: [] })
    ;(qs('.modal-backdrop') as HTMLElement).click()
    expect(w.emitted().close).toBeTruthy()
  })

  it('emits select and close on confirm', () => {
    const w = mountOpen({ isOpen: true, choiceId: 'eldritch-invocations', currentSelections: [] })
    ;(qs('[data-id="agonizing-blast"]') as HTMLElement).click()
    ;(qs('[data-id="armor-of-shadows"]') as HTMLElement).click()
    ;(qs('[data-test="modal-confirm-btn"]') as HTMLElement).click()
    expect(w.emitted().select![0]).toEqual([['agonizing-blast', 'armor-of-shadows']])
    expect(w.emitted().close).toBeTruthy()
  })
})