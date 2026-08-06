/**
 * Tests for PrivacyPolicy.vue
 *
 * Verifies:
 * - Page renders with semantic HTML structure
 * - GDPR data deletion notice is present
 * - Contact instructions are visible
 * - "Back to App" link navigates correctly
 * - Print-friendly class presence
 */

import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import PrivacyPolicy from '../src/views/PrivacyPolicy.vue'

function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', redirect: '/identity' },
      { path: '/identity', name: 'identity', component: { template: '<div>Identity</div>' } },
      { path: '/privacy', name: 'privacy', component: PrivacyPolicy },
      { path: '/terms', name: 'terms', component: { template: '<div>Terms</div>' } },
    ],
  })
}

describe('PrivacyPolicy.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('rendering', () => {
    it('renders the page heading', () => {
      const router = createTestRouter()
      const wrapper = mount(PrivacyPolicy, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('Privacy Policy')
    })

    it('renders version and last updated info', () => {
      const router = createTestRouter()
      const wrapper = mount(PrivacyPolicy, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('Version')
      expect(wrapper.text()).toContain('Last Updated')
    })

    it('renders the domain', () => {
      const router = createTestRouter()
      const wrapper = mount(PrivacyPolicy, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('5e.adventurersguild.nl')
    })

    it('renders The Digital Session Zero section', () => {
      const router = createTestRouter()
      const wrapper = mount(PrivacyPolicy, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('The Digital Session Zero')
    })

    it('renders What data do we collect section', () => {
      const router = createTestRouter()
      const wrapper = mount(PrivacyPolicy, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('What data do we collect')
    })

    it('renders Where is your data stored section', () => {
      const router = createTestRouter()
      const wrapper = mount(PrivacyPolicy, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('Where is your data stored')
    })

    it('renders Your Rights and Data Deletion (GDPR) section', () => {
      const router = createTestRouter()
      const wrapper = mount(PrivacyPolicy, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('Your Rights and Data Deletion')
      expect(wrapper.text()).toContain('GDPR')
    })

    it('includes GDPR data deletion instructions', () => {
      const router = createTestRouter()
      const wrapper = mount(PrivacyPolicy, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('How do I delete my data')
      expect(wrapper.text()).toContain('data deletion request')
    })

    it('mentions Discord contact method', () => {
      const router = createTestRouter()
      const wrapper = mount(PrivacyPolicy, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('Discord')
    })

    it('mentions Supabase as database provider', () => {
      const router = createTestRouter()
      const wrapper = mount(PrivacyPolicy, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('Supabase')
    })

    it('uses semantic HTML structure', () => {
      const router = createTestRouter()
      const wrapper = mount(PrivacyPolicy, { global: { plugins: [router] } })
      const h1 = wrapper.find('h1')
      expect(h1.exists()).toBe(true)
      expect(h1.text()).toContain('Privacy Policy')

      const h2s = wrapper.findAll('h2')
      expect(h2s.length).toBeGreaterThanOrEqual(3)

      const uls = wrapper.findAll('ul')
      expect(uls.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('back navigation', () => {
    it('renders a "Back to App" link', () => {
      const router = createTestRouter()
      const wrapper = mount(PrivacyPolicy, { global: { plugins: [router] } })
      expect(wrapper.text()).toContain('Back to App')
    })

    it('"Back to App" link navigates to /identity', async () => {
      const router = createTestRouter()
      router.push('/privacy')
      await router.isReady()

      const wrapper = mount(PrivacyPolicy, { global: { plugins: [router] } })

      const links = wrapper.findAll('a')
      const backLink = links.find((l) => l.text().includes('Back to App'))
      expect(backLink).toBeDefined()
      expect(backLink!.attributes('href')).toContain('/identity')
    })
  })

  describe('accessibility', () => {
    it('has main landmark', () => {
      const router = createTestRouter()
      const wrapper = mount(PrivacyPolicy, { global: { plugins: [router] } })
      const main = wrapper.find('main')
      expect(main.exists()).toBe(true)
    })

    it('renders strong tags for emphasis', () => {
      const router = createTestRouter()
      const wrapper = mount(PrivacyPolicy, { global: { plugins: [router] } })
      const strong = wrapper.find('strong')
      expect(strong.exists()).toBe(true)
    })
  })

  describe('print-friendliness', () => {
    it('applies print-friendly container class', () => {
      const router = createTestRouter()
      const wrapper = mount(PrivacyPolicy, { global: { plugins: [router] } })
      const container = wrapper.find('.print\\:bg-white')
      expect(container.exists()).toBe(true)
    })
  })
})