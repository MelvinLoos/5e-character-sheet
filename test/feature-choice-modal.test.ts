/**
 * Regression tests for src/components/modals/FeatureChoiceModal.vue
 *
 * Modal uses <Teleport to="body"> so queries go via document.body.
 * Use attachTo: document.body and clean up between tests.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach } from 'vitest'
import FeatureChoiceModal from '../src/components/modals/FeatureChoiceModal.vue'
import { CLASSES } from '../src/data/rules'
import type { FeatureChoice } from '../src/types/rules'

const warlockInvocations: FeatureChoice = CLASSES.Warlock!.featureChoices![0]

function qs(sel: string) { return document.body.querySelector(sel) }
function qsa(sel: string) { return document.body.querySelectorAll(sel) }

function mountOpen(props: Record<string, unknown> = {}) {
  return mount(FeatureChoiceModal, {
    attachTo: document.body,
    props: {
      effectiveMaxCount: 2,
      ...props,
    },
  })
}

describe('FeatureChoiceModal.vue', () => {
  afterEach(() => { document.body.innerHTML = '' })

  it('does not render when isOpen is false', () => {
    mountOpen({ isOpen: false, choice: warlockInvocations, currentSelections: [] })
    expect(qs('[data-test="feature-choice-option"]')).toBeNull()
  })

  it('does not render when choice is null', () => {
    mountOpen({ isOpen: true, choice: null, currentSelections: [] })
    expect(qs('[data-test="feature-choice-option"]')).toBeNull()
  })

  it('renders the choice label', () => {
    mountOpen({ isOpen: true, choice: warlockInvocations, currentSelections: [] })
    expect(document.body.textContent!).toContain('Eldritch Invocations')
  })

  it('renders all options', () => {
    mountOpen({ isOpen: true, choice: warlockInvocations, currentSelections: [] })
    expect(qsa('[data-test="feature-choice-option"]').length).toBe(warlockInvocations.options!.length)
  })

  it('shows remaining count', () => {
    mountOpen({ isOpen: true, choice: warlockInvocations, currentSelections: [] })
    const c = qs('[data-test="remaining-count"]')
    expect(c!.textContent).toContain('0 / 2 selected')
  })

  it('show prerequisite indicators', () => {
    mountOpen({ isOpen: true, choice: warlockInvocations, currentSelections: [] })
    const o = qs('[data-id="agonizing-blast"]')
    expect(o!.textContent).toContain('Prerequisite:')
    expect(o!.textContent).toContain('Warlock:level:1')
  })

  it('toggle on click via document.body', async () => {
    mountOpen({ isOpen: true, choice: warlockInvocations, currentSelections: [] })
    const el = qs('[data-id="agonizing-blast"]') as HTMLElement
    el.click()
    await Promise.resolve()
    expect(el.classList.contains('selected')).toBe(true)
    el.click()
    await Promise.resolve()
    expect(el.classList.contains('selected')).toBe(false)
  })

  it('prevents exceeding max selections', async () => {
    mountOpen({ isOpen: true, choice: warlockInvocations, currentSelections: [] })
    ;(qs('[data-id="agonizing-blast"]') as HTMLElement).click()
    ;(qs('[data-id="armor-of-shadows"]') as HTMLElement).click()
    ;(qs('[data-id="devils-sight"]') as HTMLElement).click()
    expect((qs('[data-id="devils-sight"]') as HTMLElement).classList.contains('selected')).toBe(false)
  })

  it('preselects from currentSelections', () => {
    mountOpen({ isOpen: true, choice: warlockInvocations, currentSelections: ['devils-sight'] })
    expect((qs('[data-id="devils-sight"]') as HTMLElement).classList.contains('selected')).toBe(true)
  })

  it('emits close on cancel click', () => {
    const w = mountOpen({ isOpen: true, choice: warlockInvocations, currentSelections: [] })
    ;(qs('[data-test="modal-cancel-btn"]') as HTMLElement).click()
    expect(w.emitted().close).toBeTruthy()
  })

  it('emits close on X button', () => {
    const w = mountOpen({ isOpen: true, choice: warlockInvocations, currentSelections: [] })
    ;(qs('[data-test="modal-close-btn"]') as HTMLElement).click()
    expect(w.emitted().close).toBeTruthy()
  })

  it('emits close on backdrop click', () => {
    const w = mountOpen({ isOpen: true, choice: warlockInvocations, currentSelections: [] })
    ;(qs('.modal-backdrop') as HTMLElement).click()
    expect(w.emitted().close).toBeTruthy()
  })

  it('emits select and close on confirm', () => {
    const w = mountOpen({ isOpen: true, choice: warlockInvocations, currentSelections: [] })
    ;(qs('[data-id="agonizing-blast"]') as HTMLElement).click()
    ;(qs('[data-id="armor-of-shadows"]') as HTMLElement).click()
    ;(qs('[data-test="modal-confirm-btn"]') as HTMLElement).click()
    expect(w.emitted().select![0]).toEqual([['agonizing-blast', 'armor-of-shadows']])
    expect(w.emitted().close).toBeTruthy()
  })
})