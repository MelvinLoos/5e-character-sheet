import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CompletionBadge from '@/components/ui/CompletionBadge.vue'

describe('CompletionBadge', () => {
  it('renders a numeric count for count badges', () => {
    const wrapper = mount(CompletionBadge, {
      props: { badge: { type: 'count', count: 3, label: '3 remaining' } },
    })
    expect(wrapper.text()).toBe('3')
    expect(wrapper.attributes('title')).toBe('3 remaining')
    expect(wrapper.attributes('aria-hidden')).toBe('true')
  })

  it('renders an exclamation mark for alert badges', () => {
    const wrapper = mount(CompletionBadge, {
      props: { badge: { type: 'alert', label: 'Choose starting equipment' } },
    })
    expect(wrapper.text()).toBe('!')
    expect(wrapper.attributes('title')).toBe('Choose starting equipment')
    expect(wrapper.attributes('aria-hidden')).toBe('true')
  })
})
