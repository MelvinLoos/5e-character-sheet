import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ExpandableText from '@/components/ui/ExpandableText.vue'

// ---------------------------------------------------------------------------
// jsdom does not perform layout, so scrollHeight/clientHeight are always 0.
// Mock them to simulate real overflow behaviour: the mocked scrollHeight is
// proportional to the text length, so "long" texts overflow the fixed
// 40px clientHeight.
// ---------------------------------------------------------------------------

beforeEach(() => {
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
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).scrollHeight
  delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight
})

const LONG_TEXT =
  'You touch a willing creature who is not wearing armor, and a protective ' +
  'magical force surrounds it until the spell ends. The target base AC ' +
  'becomes 13 + its Dexterity modifier. The spell ends if the target dons ' +
  'armor or if you dismiss it as an action.'

function mountComponent(props: Record<string, unknown> = {}) {
  return mount(ExpandableText, { props: { text: 'Short text.', ...props } })
}

describe('ExpandableText', () => {
  it('renders the full text content', () => {
    const wrapper = mountComponent({ text: LONG_TEXT })
    expect(wrapper.get('p').text()).toBe(LONG_TEXT)
  })

  it('does not show a toggle when the text fits within the clamp', () => {
    const wrapper = mountComponent({ text: 'Short text.' })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('shows a "Show more" toggle when the text overflows', () => {
    const wrapper = mountComponent({ text: LONG_TEXT })
    const button = wrapper.get('button')
    expect(button.text()).toBe('Show more')
    expect(button.attributes('aria-expanded')).toBe('false')
  })

  it('clamps overflowing text to 4 lines by default', () => {
    const wrapper = mountComponent({ text: LONG_TEXT })
    expect(wrapper.get('p').attributes('style')).toContain('-webkit-line-clamp: 4')
  })

  it('clamps overflowing text to the requested number of lines', () => {
    const wrapper = mountComponent({ text: LONG_TEXT, lines: 2 })
    expect(wrapper.get('p').attributes('style')).toContain('-webkit-line-clamp: 2')
  })

  it('removes the clamp and reveals the full text when "Show more" is clicked', async () => {
    const wrapper = mountComponent({ text: LONG_TEXT })
    await wrapper.get('button').trigger('click')

    expect(wrapper.get('p').attributes('style')).not.toContain('-webkit-line-clamp')
    expect(wrapper.get('button').text()).toBe('Show less')
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true')
  })

  it('re-applies the clamp when "Show less" is clicked', async () => {
    const wrapper = mountComponent({ text: LONG_TEXT })
    const button = wrapper.get('button')

    await button.trigger('click')
    await button.trigger('click')

    expect(wrapper.get('p').attributes('style')).toContain('-webkit-line-clamp: 4')
    expect(wrapper.get('button').text()).toBe('Show more')
  })

  it('applies the provided text classes to the description paragraph', () => {
    const wrapper = mountComponent({
      text: LONG_TEXT,
      textClass: ['custom-a', 'custom-b'],
    })
    const p = wrapper.get('p')
    expect(p.classes()).toContain('custom-a')
    expect(p.classes()).toContain('custom-b')
  })
})
