/**
 * Behaviour tests for the shared UI primitives in src/components/ui/:
 * BaseModal (+ useDialogBehavior), ConfirmDialog (+ useConfirm), IconButton,
 * TextField, NumberField, StatusBanner, PageHeader, ProficiencyToggle,
 * UsageTracker and PressableButton.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { h } from 'vue'
import BaseModal from '../src/components/ui/BaseModal.vue'
import ConfirmDialog from '../src/components/ui/ConfirmDialog.vue'
import IconButton from '../src/components/ui/IconButton.vue'
import TextField from '../src/components/ui/TextField.vue'
import NumberField from '../src/components/ui/NumberField.vue'
import StatusBanner from '../src/components/ui/StatusBanner.vue'
import PageHeader from '../src/components/ui/PageHeader.vue'
import ProficiencyToggle from '../src/components/ui/ProficiencyToggle.vue'
import UsageTracker from '../src/components/ui/UsageTracker.vue'
import PressableButton from '../src/components/ui/PressableButton.vue'
import { useConfirm } from '../src/composables/useConfirm'

const mounted: Array<ReturnType<typeof mount>> = []
function mountAttached(...args: Parameters<typeof mount>) {
  const wrapper = mount(args[0], { attachTo: document.body, ...(args[1] as object) })
  mounted.push(wrapper)
  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount())
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

const q = <T extends Element = HTMLElement>(sel: string) => document.body.querySelector<T>(sel)
const press = (key: string, opts: KeyboardEventInit = {}) =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }))

describe('BaseModal', () => {
  const body = () => h('div', [h('button', { id: 'first' }, 'One'), h('button', { id: 'last' }, 'Two')])

  it('renders nothing while closed', () => {
    mountAttached(BaseModal, { props: { open: false, title: 'T' }, slots: { default: body } })
    expect(q('[role="dialog"]')).toBeNull()
  })

  it('is an accessible modal dialog labelled by its title', () => {
    mountAttached(BaseModal, { props: { open: true, title: 'Import' }, slots: { default: body } })
    const dialog = q('[role="dialog"]')!
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    const labelId = dialog.getAttribute('aria-labelledby')!
    expect(document.getElementById(labelId)!.textContent).toContain('Import')
    expect(q('button[aria-label="Close dialog"]')).not.toBeNull()
  })

  it('falls back to ariaLabel when there is no visible title', () => {
    mountAttached(BaseModal, { props: { open: true, ariaLabel: 'Spell list' }, slots: { default: body } })
    expect(q('[role="dialog"]')!.getAttribute('aria-label')).toBe('Spell list')
  })

  it('closes on Escape unless disabled', async () => {
    const wrapper = mountAttached(BaseModal, { props: { open: true, title: 'T' }, slots: { default: body } })
    press('Escape')
    expect(wrapper.emitted('close')).toHaveLength(1)

    await wrapper.setProps({ closeOnEscape: false })
    press('Escape')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('closes on backdrop press but not on panel press', () => {
    const wrapper = mountAttached(BaseModal, { props: { open: true, title: 'T' }, slots: { default: body } })
    q('[role="dialog"]')!.click()
    expect(wrapper.emitted('close')).toBeUndefined()
    q('[data-testid="modal-backdrop"]')!.click()
    expect(wrapper.emitted('close')).toHaveLength(1)

    // a press that starts in the panel and ends on the backdrop (text selection drag) must not close
    q('[role="dialog"]')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    q('[data-testid="modal-backdrop"]')!.click()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('respects closeOnBackdrop=false', () => {
    const wrapper = mountAttached(BaseModal, {
      props: { open: true, title: 'T', closeOnBackdrop: false },
      slots: { default: body },
    })
    q('[data-testid="modal-backdrop"]')!.click()
    expect(wrapper.emitted('close')).toBeUndefined()
  })

  it('moves focus in (data-autofocus first), traps Tab and restores focus on close', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()

    const wrapper = mountAttached(BaseModal, {
      props: { open: false, title: 'T' },
      slots: { default: () => h('div', [h('button', { id: 'first' }, 'One'), h('input', { id: 'name', 'data-autofocus': '' }), h('button', { id: 'last' }, 'Two')]) },
    })
    await wrapper.setProps({ open: true })
    await flushPromises()
    expect(document.activeElement?.id).toBe('name')

    q('#last')!.focus()
    press('Tab')
    // wraps from the last control to the first focusable (the header close button)
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Close dialog')

    press('Tab', { shiftKey: true })
    expect(document.activeElement?.id).toBe('last')

    await wrapper.setProps({ open: false })
    expect(document.activeElement).toBe(opener)
  })

  it('locks body scroll until the last stacked dialog closes, and only the top one handles Escape', async () => {
    document.body.style.overflow = 'auto'
    const a = mountAttached(BaseModal, { props: { open: true, title: 'A' }, slots: { default: body } })
    const b = mountAttached(BaseModal, { props: { open: true, title: 'B' }, slots: { default: body } })
    expect(document.body.style.overflow).toBe('hidden')

    press('Escape')
    expect(b.emitted('close')).toHaveLength(1)
    expect(a.emitted('close')).toBeUndefined()

    await b.setProps({ open: false })
    expect(document.body.style.overflow).toBe('hidden')
    await a.setProps({ open: false })
    expect(document.body.style.overflow).toBe('auto')
  })
})

describe('ConfirmDialog + useConfirm', () => {
  it('resolves true on confirm and false on cancel / Escape', async () => {
    mountAttached(ConfirmDialog)
    const { confirm } = useConfirm()

    let result = confirm({ title: 'Remove?', message: 'Gone forever', confirmLabel: 'Remove', danger: true })
    await flushPromises()
    expect(q('[role="dialog"]')!.textContent).toContain('Gone forever')
    // destructive confirms focus Cancel first
    expect(document.activeElement?.textContent?.trim()).toBe('Cancel')
    ;[...document.body.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Remove')!.click()
    expect(await result).toBe(true)
    await flushPromises()
    expect(q('[role="dialog"]')).toBeNull()

    result = confirm({ title: 'Again?' })
    await flushPromises()
    ;[...document.body.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Cancel')!.click()
    expect(await result).toBe(false)

    result = confirm({ title: 'Escape?' })
    await flushPromises()
    press('Escape')
    expect(await result).toBe(false)
  })
})

describe('IconButton', () => {
  it('has an accessible name, hides the glyph and exposes pressed state', () => {
    const wrapper = mount(IconButton, { props: { icon: 'delete', label: 'Remove spell', pressed: true } })
    const button = wrapper.get('button')
    expect(button.attributes('aria-label')).toBe('Remove spell')
    expect(button.attributes('aria-pressed')).toBe('true')
    expect(button.get('span').attributes('aria-hidden')).toBe('true')
    expect(button.classes()).toContain('min-h-11')
  })

  it('omits aria-pressed when not a toggle and forwards click', async () => {
    let clicks = 0
    const wrapper = mount(IconButton, { props: { icon: 'add', label: 'Add' }, attrs: { onClick: () => clicks++ } })
    expect(wrapper.get('button').attributes('aria-pressed')).toBeUndefined()
    await wrapper.get('button').trigger('click')
    expect(clicks).toBe(1)
  })
})

describe('TextField', () => {
  it('links label, hint and error, and supports v-model', async () => {
    const wrapper = mount(TextField, {
      props: { label: 'Name', hint: 'As on your sheet', error: 'Required', modelValue: '' },
      attrs: { placeholder: 'Elara' },
    })
    const input = wrapper.get('input')
    const label = wrapper.get('label')
    expect(label.attributes('for')).toBe(input.attributes('id'))
    const describedby = input.attributes('aria-describedby')!.split(' ')
    expect(describedby).toHaveLength(2)
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('[role="alert"]').text()).toContain('Required')
    expect(input.attributes('placeholder')).toBe('Elara')

    await input.setValue('Elara')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Elara'])
  })

  it('can hide the label visually while keeping it for screen readers', () => {
    const wrapper = mount(TextField, { props: { label: 'Search', hideLabel: true, modelValue: '' } })
    expect(wrapper.get('label').classes()).toContain('sr-only')
  })
})

describe('NumberField', () => {
  it('emits numbers (null when empty), never strings', async () => {
    const wrapper = mount(NumberField, { props: { label: 'Gold', modelValue: 5 } })
    const input = wrapper.get('input')
    await input.setValue('12')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([12])
    await input.setValue('')
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([null])
  })

  it('uses a digit keypad unless negatives are allowed', () => {
    expect(mount(NumberField, { props: { label: 'A', modelValue: 1 } }).get('input').attributes('inputmode')).toBe('numeric')
    expect(
      mount(NumberField, { props: { label: 'A', modelValue: 1, allowNegative: true } }).get('input').attributes('inputmode'),
    ).toBeUndefined()
  })

  it('clamps to min/max on commit and corrects the visible value', async () => {
    const wrapper = mount(NumberField, { props: { label: 'HP', modelValue: 5, min: 0, max: 10 } })
    const input = wrapper.get('input')
    await input.setValue('99')
    await input.trigger('change')
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([10])
    expect((input.element as HTMLInputElement).value).toBe('10')
  })
})

describe('StatusBanner / PageHeader', () => {
  it('uses alert for errors and status otherwise, always with an icon', () => {
    const error = mount(StatusBanner, { props: { tone: 'error' }, slots: { default: 'Bad' } })
    expect(error.attributes('role')).toBe('alert')
    expect(error.get('.material-symbols-outlined').attributes('aria-hidden')).toBe('true')
    const warning = mount(StatusBanner, { slots: { default: 'Careful' } })
    expect(warning.attributes('role')).toBe('status')
    expect(warning.text()).toContain('Careful')
  })

  it('renders the page title as the h1 with optional subtitle and actions', () => {
    const wrapper = mount(PageHeader, {
      props: { title: 'Skills', subtitle: 'Expertise' },
      slots: { actions: '<span id="act">A</span>' },
    })
    expect(wrapper.get('h1').text()).toBe('Skills')
    expect(wrapper.text()).toContain('Expertise')
    expect(wrapper.find('#act').exists()).toBe(true)
  })
})

describe('ProficiencyToggle', () => {
  it('is a named checkbox that shows a check mark (not colour alone) when on', async () => {
    const wrapper = mount(ProficiencyToggle, { props: { label: 'Acrobatics proficiency', modelValue: false } })
    expect(wrapper.get('input').attributes('aria-label')).toBe('Acrobatics proficiency')
    expect(wrapper.find('svg').exists()).toBe(false)
    await wrapper.get('input').setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    await wrapper.setProps({ modelValue: true })
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('does not change when disabled', () => {
    const wrapper = mount(ProficiencyToggle, { props: { label: 'x', modelValue: true, disabled: true } })
    expect(wrapper.get('input').attributes('disabled')).toBeDefined()
  })
})

describe('UsageTracker', () => {
  it('renders one named box per use and spends / refunds like the sheet does', async () => {
    const wrapper = mount(UsageTracker, { props: { total: 3, label: 'Rage', modelValue: 0 } })
    const boxes = wrapper.findAll('input')
    expect(boxes).toHaveLength(3)
    expect(boxes[1]!.attributes('aria-label')).toBe('Rage: use 2 of 3')

    await boxes[1]!.setValue(true)
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2])

    await wrapper.setProps({ modelValue: 2 })
    expect((wrapper.findAll('input')[0]!.element as HTMLInputElement).checked).toBe(true)
    await wrapper.findAll('input')[1]!.setValue(false)
    expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([1])
  })
})

describe('PressableButton', () => {
  it('applies variant styling and a 44px minimum height', () => {
    const wrapper = mount(PressableButton, { props: { variant: 'primary' }, slots: { default: 'Save' } })
    expect(wrapper.classes()).toContain('bg-tertiary')
    expect(wrapper.classes()).toContain('min-h-11')
  })

  it('stays unstyled for the plain variant', () => {
    const wrapper = mount(PressableButton, { slots: { default: 'x' } })
    expect(wrapper.classes()).not.toContain('min-h-11')
  })

  it('blocks clicks and announces busy while loading', async () => {
    const wrapper = mount(PressableButton, { props: { variant: 'primary', loading: true }, slots: { default: 'Save' } })
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.attributes('disabled')).toBeDefined()
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('emits click when enabled', async () => {
    const wrapper = mount(PressableButton, { slots: { default: 'x' } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
