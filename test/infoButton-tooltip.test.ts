/**
 * Behaviour tests for InfoButton's optional inline tooltip popover.
 *
 * The default (modal) behaviour must be preserved: clicking the trigger opens
 * the topic dialog. With `popover`, hovering or focusing shows a lightweight
 * tooltip (after a 150ms hover-intent delay) that dismisses on mouse-leave,
 * blur, Escape, outside click, or a second tap.
 */
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import InfoButton from '../src/components/ui/InfoButton.vue'

const mounted: Array<ReturnType<typeof mount>> = []
function mountAttached(...args: Parameters<typeof mount>) {
  const wrapper = mount(args[0], { attachTo: document.body, ...(args[1] as object) })
  mounted.push(wrapper)
  return wrapper
}

afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount())
  document.body.innerHTML = ''
  vi.useRealTimers()
})

const trigger = () => document.body.querySelector<HTMLButtonElement>('button')
const tooltip = () => document.body.querySelector('[role="tooltip"]')

describe('InfoButton — default (modal) behaviour', () => {
  it('renders an accessible help trigger', () => {
    mountAttached(InfoButton, { props: { topic: 'point-buy' } })
    const btn = trigger()!
    expect(btn.getAttribute('aria-label')).toBe('More information: Point-Buy & ASI')
    expect(btn.getAttribute('aria-haspopup')).toBe('dialog')
    expect(btn.querySelector('svg')).not.toBeNull()
  })

  it('does not show a tooltip on hover', async () => {
    mountAttached(InfoButton, { props: { topic: 'point-buy' } })
    trigger()!.dispatchEvent(new MouseEvent('mouseenter'))
    await nextTick()
    expect(tooltip()).toBeNull()
  })

  it('opens the topic dialog on click', async () => {
    const wrapper = mountAttached(InfoButton, { props: { topic: 'point-buy' } })
    trigger()!.click()
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
  })
})

describe('InfoButton — popover mode', () => {
  it('shows the tooltip only after the 150ms hover-intent delay', async () => {
    vi.useFakeTimers()
    mountAttached(InfoButton, { props: { topic: 'point-buy', popover: true } })

    trigger()!.dispatchEvent(new MouseEvent('mouseenter'))
    expect(tooltip()).toBeNull()

    vi.advanceTimersByTime(149)
    await nextTick()
    expect(tooltip()).toBeNull()

    vi.advanceTimersByTime(1)
    await nextTick()
    expect(tooltip()).not.toBeNull()
    expect(tooltip()!.textContent).toContain('27-point buy')
    expect(trigger()!.getAttribute('aria-expanded')).toBe('true')
    expect(trigger()!.getAttribute('aria-describedby')).toBe(tooltip()!.id)
  })

  it('cancels the pending show when the pointer leaves before the delay', async () => {
    vi.useFakeTimers()
    mountAttached(InfoButton, { props: { topic: 'point-buy', popover: true } })

    trigger()!.dispatchEvent(new MouseEvent('mouseenter'))
    trigger()!.dispatchEvent(new MouseEvent('mouseleave'))
    vi.advanceTimersByTime(300)
    await nextTick()
    expect(tooltip()).toBeNull()
  })

  it('hides the tooltip on mouse-leave once visible', async () => {
    vi.useFakeTimers()
    mountAttached(InfoButton, { props: { topic: 'point-buy', popover: true } })

    trigger()!.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(150)
    await nextTick()
    expect(tooltip()).not.toBeNull()

    trigger()!.dispatchEvent(new MouseEvent('mouseleave'))
    await nextTick()
    expect(tooltip()).toBeNull()
  })

  it('shows on keyboard focus and hides on blur', async () => {
    mountAttached(InfoButton, { props: { topic: 'point-buy', popover: true } })

    trigger()!.dispatchEvent(new FocusEvent('focus'))
    await nextTick()
    expect(tooltip()).not.toBeNull()

    trigger()!.dispatchEvent(new FocusEvent('blur'))
    await nextTick()
    expect(tooltip()).toBeNull()
  })

  it('hides on Escape', async () => {
    mountAttached(InfoButton, { props: { topic: 'point-buy', popover: true } })

    trigger()!.dispatchEvent(new FocusEvent('focus'))
    await nextTick()
    expect(tooltip()).not.toBeNull()

    trigger()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(tooltip()).toBeNull()
  })

  it('toggles the tooltip on click (touch affordance)', async () => {
    const wrapper = mountAttached(InfoButton, { props: { topic: 'point-buy', popover: true } })

    trigger()!.click()
    await wrapper.vm.$nextTick()
    expect(tooltip()).not.toBeNull()

    trigger()!.click()
    await wrapper.vm.$nextTick()
    expect(tooltip()).toBeNull()
  })

  it('dismisses on an outside click', async () => {
    const wrapper = mountAttached(InfoButton, { props: { topic: 'point-buy', popover: true } })

    trigger()!.click()
    await wrapper.vm.$nextTick()
    expect(tooltip()).not.toBeNull()

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(tooltip()).toBeNull()
  })

  it('does not open the modal when clicked in popover mode', async () => {
    const wrapper = mountAttached(InfoButton, { props: { topic: 'point-buy', popover: true } })

    trigger()!.click()
    await wrapper.vm.$nextTick()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
  })

  it('supports custom title/content without a glossary topic', async () => {
    mountAttached(InfoButton, {
      props: { title: 'Custom', content: 'A bespoke explanation.', popover: true },
    })

    trigger()!.dispatchEvent(new FocusEvent('focus'))
    await nextTick()
    expect(tooltip()!.textContent).toContain('A bespoke explanation.')
  })
})
