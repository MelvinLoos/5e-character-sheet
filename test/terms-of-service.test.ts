/**
 * Tests for TermsOfService.vue
 *
 * Verifies:
 * - Page renders with semantic HTML structure
 * - Content sections are present
 * - "Back to App" link navigates correctly
 * - Print-friendly class presence
 */

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import TermsOfService from '../src/views/TermsOfService.vue'

function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', redirect: '/identity' },
      { path: '/identity', name: 'identity', component: { template: '<div>Identity</div>' } },
      { path: '/terms', name: 'terms', component: TermsOfService },
      { path: '/privacy', name: 'privacy', component: { template: '<div>Privacy</div>' } },
    ],
  })
}

describe('TermsOfService.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('rendering', () => {
    it('renders the page heading', () => {
      const router = createTestRouter()
      const wrapper = mount(TermsOfService, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('Terms of Service')
    })

    it('renders version and last updated info', () => {
      const router = createTestRouter()
      const wrapper = mount(TermsOfService, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('Version')
      expect(wrapper.text()).toContain('Last Updated')
    })

    it('renders the domain', () => {
      const router = createTestRouter()
      const wrapper = mount(TermsOfService, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('5e.adventurersguild.nl')
    })

    it('renders Expectations and Framework section', () => {
      const router = createTestRouter()
      const wrapper = mount(TermsOfService, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('Expectations and Framework')
    })

    it('renders Access and Age Limits section', () => {
      const router = createTestRouter()
      const wrapper = mount(TermsOfService, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('Access and Age Limits')
    })

    it('renders Using the Tool section', () => {
      const router = createTestRouter()
      const wrapper = mount(TermsOfService, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('Using the Tool')
    })

    it('renders Educational Moderation section', () => {
      const router = createTestRouter()
      const wrapper = mount(TermsOfService, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('Educational Moderation')
    })

    it('renders Changes to these Terms section', () => {
      const router = createTestRouter()
      const wrapper = mount(TermsOfService, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('Changes to these Terms')
    })

    it('renders list items for inappropriate content rules', () => {
      const router = createTestRouter()
      const wrapper = mount(TermsOfService, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('No inappropriate content')
      expect(wrapper.text()).toContain('Bugs & Exploits')
    })

    it('uses semantic HTML structure', () => {
      const router = createTestRouter()
      const wrapper = mount(TermsOfService, { global: { plugins: [router] } })
      const h1 = wrapper.find('h1')
      expect(h1.exists()).toBe(true)
      expect(h1.text()).toContain('Terms of Service')

      const h2s = wrapper.findAll('h2')
      expect(h2s.length).toBeGreaterThanOrEqual(4)

      const uls = wrapper.findAll('ul')
      expect(uls.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('back navigation', () => {
    it('renders a "Back to App" link', () => {
      const router = createTestRouter()
      const wrapper = mount(TermsOfService, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('Back to App')
    })

    it('"Back to App" link navigates to /identity', async () => {
      const router = createTestRouter()
      router.push('/terms')
      await router.isReady()

      const wrapper = mount(TermsOfService, { global: { plugins: [router] } })

      const links = wrapper.findAll('a')
      const backLink = links.find((l) => l.text().includes('Back to App'))
      expect(backLink).toBeDefined()
      expect(backLink!.attributes('href')).toContain('/identity')
    })
  })

  describe('accessibility', () => {
    it('has main landmark', () => {
      const router = createTestRouter()
      const wrapper = mount(TermsOfService, { global: { plugins: [router] } })
      // Should have a main or role-based container
      const main = wrapper.find('main')
      expect(main.exists()).toBe(true)
    })

    it('renders strong tags for emphasis', () => {
      const router = createTestRouter()
      const wrapper = mount(TermsOfService, { global: { plugins: [router] } })
      const strong = wrapper.find('strong')
      expect(strong.exists()).toBe(true)
    })
  })

  describe('print-friendliness', () => {
    it('applies print-friendly container class', () => {
      const router = createTestRouter()
      const wrapper = mount(TermsOfService, { global: { plugins: [router] } })
      // The main container should have print:bg-white or equivalent
      const container = wrapper.find('.print\\:bg-white')
      expect(container.exists()).toBe(true)
    })
  })
})