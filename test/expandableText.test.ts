import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import ExpandableText from '@/components/ui/ExpandableText.vue'

const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight')
const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight')

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

const LONG_TEXT =
  'You touch a willing creature who is not wearing armor, and a protective ' +
  'magical force surrounds it until the spell ends. The target base AC ' +
  'becomes 13 + its Dexterity modifier. The spell ends if the target dons ' +
  'armor or if you dismiss it as an action.'

async function mountComponent(props: Record<string, unknown> = {}) {
  const wrapper = mount(ExpandableText, { props: { text: 'Short text.', ...props } })
  // The overflow measurement runs in onMounted; flush the resulting render.
  await nextTick()
  return wrapper
}

describe('ExpandableText', () => {
  it('renders the full text content', async () => {
    const wrapper = await mountComponent({ text: LONG_TEXT })
    expect(wrapper.get('p').text()).toBe(LONG_TEXT)
  })

  it('does not show a toggle when the text fits within the clamp', async () => {
    const wrapper = await mountComponent({ text: 'Short text.' })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('shows a "Show more" toggle when the text overflows', async () => {
    const wrapper = await mountComponent({ text: LONG_TEXT })
    const button = wrapper.get('button')
    expect(button.text()).toBe('Show more')
    expect(button.attributes('aria-expanded')).toBe('false')
  })

  it('clamps overflowing text to 4 lines by default', async () => {
    const wrapper = await mountComponent({ text: LONG_TEXT })
    expect(wrapper.get('p').attributes('style')).toContain('-webkit-line-clamp: 4')
  })

  it('clamps overflowing text to the requested number of lines', async () => {
    const wrapper = await mountComponent({ text: LONG_TEXT, lines: 2 })
    expect(wrapper.get('p').attributes('style')).toContain('-webkit-line-clamp: 2')
  })

  it('removes the clamp and reveals the full text when "Show more" is clicked', async () => {
    const wrapper = await mountComponent({ text: LONG_TEXT })
    await wrapper.get('button').trigger('click')

    expect(wrapper.get('p').attributes('style') ?? '').not.toContain('-webkit-line-clamp')
    expect(wrapper.get('button').text()).toBe('Show less')
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('true')
  })

  it('re-applies the clamp when "Show less" is clicked', async () => {
    const wrapper = await mountComponent({ text: LONG_TEXT })
    const button = wrapper.get('button')

    await button.trigger('click')
    await button.trigger('click')

    expect(wrapper.get('p').attributes('style')).toContain('-webkit-line-clamp: 4')
    expect(wrapper.get('button').text()).toBe('Show more')
  })

  it('collapses and re-measures when text changes', async () => {
    const wrapper = await mountComponent({ text: LONG_TEXT })

    await wrapper.get('button').trigger('click')
    await wrapper.setProps({ text: 'Short text.' })
    await nextTick()
    await nextTick()

    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.get('p').attributes('style')).toContain('-webkit-line-clamp: 4')
  })

  it('collapses and re-measures when lines changes', async () => {
    const wrapper = await mountComponent({ text: LONG_TEXT, lines: 2 })

    await wrapper.get('button').trigger('click')
    await wrapper.setProps({ lines: 1 })
    await nextTick()
    await nextTick()

    expect(wrapper.get('button').text()).toBe('Show more')
    expect(wrapper.get('button').attributes('aria-expanded')).toBe('false')
    expect(wrapper.get('p').attributes('style')).toContain('-webkit-line-clamp: 1')
  })

  it('re-measures when textClass changes', async () => {
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get(this: HTMLElement) {
        return this.classList.contains('tight-height') ? 10 : 500
      },
    })

    const wrapper = await mountComponent({ text: LONG_TEXT, textClass: 'normal-height' })
    expect(wrapper.find('button').exists()).toBe(false)

    await wrapper.setProps({ textClass: 'tight-height' })
    await nextTick()
    await nextTick()

    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('applies the provided text classes to the description paragraph', async () => {
    const wrapper = await mountComponent({
      text: LONG_TEXT,
      textClass: ['custom-a', 'custom-b'],
    })
    const p = wrapper.get('p')
    expect(p.classes()).toContain('custom-a')
    expect(p.classes()).toContain('custom-b')
  })

  it('does not propagate toggle clicks to parent click handlers', async () => {
    let parentClicks = 0
    const Parent = defineComponent({
      components: { ExpandableText },
      template: '<div @click="count"><ExpandableText :text="text" /></div>',
      setup() {
        return { text: LONG_TEXT, count: () => parentClicks++ }
      },
    })

    const wrapper = mount(Parent)
    await nextTick()
    await nextTick()

    await wrapper.get('button').trigger('click')

    expect(wrapper.get('button').text()).toBe('Show less')
    expect(parentClicks).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Markdown mode (#215)
// ---------------------------------------------------------------------------

describe('ExpandableText markdown mode', () => {
  const LONG_MARKDOWN =
    '**Mage Armor.** You touch a willing creature who is not wearing armor.\n\n' +
    '- The target base AC becomes 13 + its Dexterity modifier.\n' +
    '- The spell ends if the target dons armor.'

  it('renders Markdown formatting instead of raw markers', async () => {
    const wrapper = await mountComponent({ text: '**Bold** and *italic*', markdown: true })

    const content = wrapper.get('[id]')
    expect(content.html()).toContain('<strong>Bold</strong>')
    expect(content.html()).toContain('<em>italic</em>')
    expect(wrapper.text()).not.toContain('**')
  })

  it('renders lists from Markdown', async () => {
    const wrapper = await mountComponent({ text: '- One\n- Two', markdown: true })

    const content = wrapper.get('[id]')
    expect(content.html()).toContain('<li>One</li>')
    expect(content.html()).toContain('<li>Two</li>')
  })

  it('escapes raw HTML instead of executing it', async () => {
    const wrapper = await mountComponent({ text: '<script>alert(1)</script>', markdown: true })

    expect(wrapper.html()).not.toContain('<script>')
    expect(wrapper.text()).toContain('<script>alert(1)</script>')
  })

  it('normalizes legacy HTML lists before rendering', async () => {
    const wrapper = await mountComponent({ text: '<ul><li>A</li><li>B</li></ul>', markdown: true })

    const content = wrapper.get('[id]')
    expect(content.html()).toContain('<li>A</li>')
    expect(content.html()).toContain('<li>B</li>')
  })

  it('clamps overflowing markdown with a max-height and shows the toggle', async () => {
    const wrapper = await mountComponent({ text: LONG_MARKDOWN, markdown: true })

    expect(wrapper.find('button').text()).toBe('Show more')
    expect(wrapper.get('[id]').attributes('style')).toContain('max-height: 4lh')

    await wrapper.get('button').trigger('click')
    expect(wrapper.get('[id]').attributes('style') ?? '').not.toContain('max-height')
    expect(wrapper.find('button').text()).toBe('Show less')
  })

  it('honours the lines prop in the markdown clamp', async () => {
    const wrapper = await mountComponent({ text: LONG_MARKDOWN, markdown: true, lines: 2 })

    expect(wrapper.get('[id]').attributes('style')).toContain('max-height: 2lh')
  })

  it('applies the provided text classes in markdown mode', async () => {
    const wrapper = await mountComponent({
      text: LONG_MARKDOWN,
      markdown: true,
      textClass: ['custom-a', 'custom-b'],
    })

    const content = wrapper.get('[id]')
    expect(content.classes()).toContain('custom-a')
    expect(content.classes()).toContain('custom-b')
  })
})
