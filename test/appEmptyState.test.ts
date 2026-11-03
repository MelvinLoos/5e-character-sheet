/**
 * The no-character placeholder must speak to players (not "Gamemaster"), offer
 * two clear entry points, and be able to launch the onboarding tour.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('../src/infra/supabaseClient', () => ({
  createSupabaseClient: vi.fn(() => null),
  getSupabaseClient: vi.fn(() => null),
}))

vi.mock('vue-router', () => ({
  useRoute: () => ({ meta: {}, query: {}, name: 'identity', fullPath: '/identity' }),
  useRouter: () => ({
    currentRoute: { value: { path: '/identity' } },
    push: vi.fn(async () => {}),
  }),
}))

import App from '../src/App.vue'
import { useCharacterStore } from '../src/stores/character'
import { useOnboardingTour } from '../src/composables/useOnboardingTour'
import { STORAGE_KEYS } from '../src/constants/storage-keys'

const mounted: Array<ReturnType<typeof mount>> = []
function mountApp() {
  const wrapper = mount(App, { shallow: true })
  mounted.push(wrapper)
  return wrapper
}

const buttonByText = (wrapper: ReturnType<typeof mount>, text: string) =>
  wrapper.findAll('button').find((b) => b.text().trim() === text)

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

afterEach(() => {
  useOnboardingTour().skip()
  mounted.splice(0).forEach((w) => w.unmount())
  document.body.innerHTML = ''
  localStorage.clear()
})

describe('App empty state', () => {
  it('welcomes the player with two entry points and a tour trigger', async () => {
    const wrapper = mountApp()
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Welcome, Adventurer')
    expect(text).not.toContain('Gamemaster')
    expect(buttonByText(wrapper, 'Create Character')).toBeDefined()
    expect(buttonByText(wrapper, 'Import JSON')).toBeDefined()
    expect(buttonByText(wrapper, 'Take a quick tour')).toBeDefined()
  })

  it('creates a character when the primary action is used', async () => {
    const wrapper = mountApp()
    await flushPromises()

    await buttonByText(wrapper, 'Create Character')!.trigger('click')
    await flushPromises()

    expect(useCharacterStore().currentCharacterData).not.toBeNull()
    expect(wrapper.text()).not.toContain('Welcome, Adventurer')
  })

  it('creates a character and starts the tour from the empty state', async () => {
    const wrapper = mountApp()
    await flushPromises()

    await buttonByText(wrapper, 'Take a quick tour')!.trigger('click')
    await flushPromises()

    expect(useCharacterStore().currentCharacterData).not.toBeNull()
    // No sheet is rendered in this shallow mount, so the tour finds nothing to
    // point at and deactivates itself rather than persisting completion.
    await vi.waitFor(() => expect(useOnboardingTour().active.value).toBe(false), {
      timeout: 6000,
    })
  })

  it('offers to replay the tour once it has been completed', async () => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_TOUR_COMPLETED, 'true')
    const wrapper = mountApp()
    await flushPromises()

    expect(buttonByText(wrapper, 'Replay the tour')).toBeDefined()
  })
})
