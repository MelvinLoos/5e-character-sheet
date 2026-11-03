/**
 * Behaviour tests for the route-aware onboarding tour composable.
 *
 * The character sheet is split across several routes, so the tour must
 * navigate before measuring a target, skip steps whose target is not rendered,
 * clamp its tooltip above the mobile tab bar, and persist completion.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { STORAGE_KEYS } from '../src/constants/storage-keys'

const { push, currentRoute } = vi.hoisted(() => ({
  push: vi.fn(async () => {}),
  currentRoute: { value: { path: '/identity' } },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({ currentRoute, push }),
}))

import {
  TOUR_STEPS,
  computeTooltipStyle,
  useOnboardingTour,
} from '../src/composables/useOnboardingTour'

function addTarget(name: string, rect: Partial<DOMRect> = {}) {
  const el = document.createElement('div')
  el.setAttribute('data-tour', name)
  const box = { top: 100, left: 100, width: 200, height: 80, bottom: 180, right: 300, ...rect }
  el.getBoundingClientRect = () => ({ ...box, x: box.left, y: box.top, toJSON: () => box }) as DOMRect
  document.body.appendChild(el)
  return el
}

const escape = () =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

describe('useOnboardingTour', () => {
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
    // Leave the shared singleton idle for the next test.
    useOnboardingTour().skip()
    document.body.innerHTML = ''
    localStorage.clear()
  })

  it('activates on the first step whose target is mounted', async () => {
    addTarget('ability-scores')
    const tour = useOnboardingTour()

    await tour.startTour()

    expect(tour.active.value).toBe(true)
    expect(tour.currentStep.value?.target).toBe('[data-tour="ability-scores"]')
  })

  it('navigates across routes when advancing', async () => {
    for (const step of TOUR_STEPS) addTarget(step.target.replace(/^\[data-tour="|"\]$/g, ''))
    const tour = useOnboardingTour()

    await tour.startTour()
    await tour.next() // ability-scores
    await tour.next() // combat-stats
    await tour.next() // skills-list (route: /skills)

    expect(push).toHaveBeenCalledWith('/skills')
    expect(tour.currentStep.value?.route).toBe('/skills')
  })

  it('skips steps whose target is not rendered', async () => {
    addTarget('sheet-header')
    addTarget('skills-list')
    const tour = useOnboardingTour()

    await tour.startTour()
    await tour.next() // skips ability-scores + combat-stats, lands on skills-list

    expect(tour.currentStep.value?.target).toBe('[data-tour="skills-list"]')
    expect(push).toHaveBeenCalledWith('/skills')
  })

  it('reports progress and boundaries', async () => {
    for (const step of TOUR_STEPS) addTarget(step.target.replace(/^\[data-tour="|"\]$/g, ''))
    const tour = useOnboardingTour()

    await tour.startTour()
    expect(tour.isFirst.value).toBe(true)
    expect(tour.totalSteps.value).toBe(TOUR_STEPS.length)
    expect(tour.stepLabel.value).toBe(`1 / ${TOUR_STEPS.length}`)

    for (let i = 1; i < TOUR_STEPS.length; i++) await tour.next()
    expect(tour.isLast.value).toBe(true)
  })

  it('persists completion on finish and exposes the flag', async () => {
    addTarget('sheet-header')
    const tour = useOnboardingTour()

    await tour.startTour()
    tour.finish()

    expect(tour.active.value).toBe(false)
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_TOUR_COMPLETED)).toBe('true')
    expect(tour.hasCompletedTour.value).toBe(true)
  })

  it('skips (and persists) on Escape', async () => {
    addTarget('sheet-header')
    const tour = useOnboardingTour()

    await tour.startTour()
    escape()
    await nextTick()

    expect(tour.active.value).toBe(false)
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_TOUR_COMPLETED)).toBe('true')
  })

  it('can be restarted after finishing', async () => {
    addTarget('sheet-header')
    const tour = useOnboardingTour()

    await tour.startTour()
    tour.finish()
    await tour.startTour()

    expect(tour.active.value).toBe(true)
    expect(tour.isFirst.value).toBe(true)
  })

  it('does not persist when no target can be found', async () => {
    const tour = useOnboardingTour()

    await tour.startTour()

    expect(tour.active.value).toBe(false)
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_TOUR_COMPLETED)).toBeNull()
  })
})

describe('computeTooltipStyle', () => {
  const style = (rect: Parameters<typeof computeTooltipStyle>[0], vp: { width: number; height: number }) =>
    computeTooltipStyle(rect, vp)
  const px = (v: unknown) => parseFloat(String(v))

  it('places the tooltip below a target with room beneath it', () => {
    const s = style(
      { top: 100, left: 100, width: 200, height: 60, bottom: 160, right: 300 },
      { width: 1024, height: 800 },
    )
    expect(px(s.top)).toBeGreaterThan(160)
  })

  it('flips above a target near the bottom of the viewport', () => {
    const s = style(
      { top: 700, left: 40, width: 200, height: 60, bottom: 760, right: 240 },
      { width: 375, height: 800 },
    )
    expect(px(s.top)).toBeLessThan(700)
  })

  it('never lets the tooltip run under the mobile tab bar or off-screen', () => {
    const vp = { width: 375, height: 800 }
    const s = style({ top: 600, left: 350, width: 40, height: 40, bottom: 640, right: 390 }, vp)
    expect(px(s.top)).toBeGreaterThanOrEqual(16)
    expect(px(s.left)).toBeGreaterThanOrEqual(16)
    expect(px(s.left) + px(s.width)).toBeLessThanOrEqual(vp.width - 16 + 1)
  })
})
