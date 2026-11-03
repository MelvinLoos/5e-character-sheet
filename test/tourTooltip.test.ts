/**
 * Behaviour tests for the onboarding tour overlay.
 *
 * The overlay is driven entirely by the `useOnboardingTour` singleton, so these
 * tests start the tour programmatically and assert the rendered coaching card.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { STORAGE_KEYS } from '../src/constants/storage-keys'

const { push, currentRoute } = vi.hoisted(() => ({
  push: vi.fn(async () => {}),
  currentRoute: { value: { path: '/identity' } },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ currentRoute, push }),
}))

import TourTooltip from '../src/components/ui/TourTooltip.vue'
import { TOUR_STEPS, useOnboardingTour } from '../src/composables/useOnboardingTour'

function addTarget(name: string) {
  const el = document.createElement('div')
  el.setAttribute('data-tour', name)
  el.getBoundingClientRect = () =>
    ({ top: 100, left: 100, width: 200, height: 80, bottom: 180, right: 300, x: 100, y: 100, toJSON: () => ({}) }) as DOMRect
  document.body.appendChild(el)
}

function addAllTargets() {
  for (const step of TOUR_STEPS) addTarget(step.target.replace(/^\[data-tour="|"\]$/g, ''))
}

const dialog = () => document.body.querySelector<HTMLElement>('[role="dialog"]')
const buttonByText = (text: string) =>
  [...document.body.querySelectorAll('button')].find((b) => b.textContent?.trim() === text)

let wrapper: ReturnType<typeof mount>

beforeEach(() => {
  localStorage.clear()
  document.body.innerHTML = ''
  currentRoute.value = { path: '/identity' }
  push.mockReset()
  push.mockImplementation(async (route: string) => {
    currentRoute.value = { path: route }
  })
})

afterEach(() => {
  useOnboardingTour().skip()
  wrapper?.unmount()
  document.body.innerHTML = ''
  localStorage.clear()
})

describe('TourTooltip', () => {
  it('renders nothing while the tour is inactive', () => {
    wrapper = mount(TourTooltip, { attachTo: document.body })
    expect(dialog()).toBeNull()
  })

  it('shows the current step title, body and progress', async () => {
    addAllTargets()
    wrapper = mount(TourTooltip, { attachTo: document.body })
    await useOnboardingTour().startTour()
    await flushPromises()

    expect(dialog()).not.toBeNull()
    expect(dialog()!.textContent).toContain('Your Character')
    expect(dialog()!.textContent).toContain(`1 / ${TOUR_STEPS.length}`)
    expect(buttonByText('Skip')).toBeDefined()
  })

  it('disables Back on the first step and enables it afterwards', async () => {
    addAllTargets()
    wrapper = mount(TourTooltip, { attachTo: document.body })
    const tour = useOnboardingTour()
    await tour.startTour()
    await flushPromises()

    expect(buttonByText('Back')!.hasAttribute('disabled')).toBe(true)

    await tour.next()
    await flushPromises()
    expect(buttonByText('Back')!.hasAttribute('disabled')).toBe(false)
  })

  it('shows Finish on the last step and completes on click', async () => {
    addAllTargets()
    wrapper = mount(TourTooltip, { attachTo: document.body })
    const tour = useOnboardingTour()
    await tour.startTour()
    for (let i = 1; i < TOUR_STEPS.length; i++) await tour.next()
    await flushPromises()

    const finish = buttonByText('Finish')!
    expect(finish).toBeDefined()
    finish.click()
    await flushPromises()

    expect(tour.active.value).toBe(false)
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_TOUR_COMPLETED)).toBe('true')
  })

  it('skips the tour and persists completion', async () => {
    addAllTargets()
    wrapper = mount(TourTooltip, { attachTo: document.body })
    const tour = useOnboardingTour()
    await tour.startTour()
    await flushPromises()

    buttonByText('Skip')!.click()
    await flushPromises()

    expect(tour.active.value).toBe(false)
    expect(dialog()).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_TOUR_COMPLETED)).toBe('true')
  })

  it('skips on Escape', async () => {
    addAllTargets()
    wrapper = mount(TourTooltip, { attachTo: document.body })
    const tour = useOnboardingTour()
    await tour.startTour()
    await flushPromises()

    dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    expect(tour.active.value).toBe(false)
  })
})
