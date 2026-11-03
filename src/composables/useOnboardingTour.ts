/**
 * useOnboardingTour — the first-time player guided tour.
 *
 * Module-level singletons (mirroring `useDiceTray` / `useModals`) so any surface
 * — the empty state, the sidebar "More" menu, or the mobile actions sheet — can
 * start, advance, or replay the same tour.
 *
 * The character sheet is spread across several `vue-router` views, so the tour is
 * route-aware: advancing to a step navigates first, waits a tick, then measures
 * the target. Steps whose target is not rendered (e.g. the Spells tab for a
 * non-caster) are skipped rather than breaking the flow.
 */
import { computed, nextTick, ref, type CSSProperties } from 'vue'
import { useRouter, type Router } from 'vue-router'
import { STORAGE_KEYS } from '@/constants/storage-keys'

export interface TourStep {
  /** CSS selector for the element to spotlight. */
  target: string
  title: string
  body: string
  /** Route to navigate to before measuring the target. */
  route?: string
}

export interface TourRect {
  top: number
  left: number
  width: number
  height: number
  bottom: number
  right: number
}

export interface TourViewport {
  width: number
  height: number
}

/**
 * Ordered walkthrough of the sheet. Each step names the `data-tour` anchor it
 * highlights and the route that anchor lives on.
 */
export const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="sheet-header"]',
    title: 'Your Character',
    body: 'Set your name, class, species, and background — these drive most of your derived stats.',
    route: '/identity',
  },
  {
    target: '[data-tour="ability-scores"]',
    title: 'Ability Scores',
    body: 'Allocate your core stats using point-buy and track your saving throw modifiers.',
    route: '/identity',
  },
  {
    target: '[data-tour="combat-stats"]',
    title: 'Combat & Vitals',
    body: 'Track Hit Points, Armor Class, Initiative, and Rest actions here.',
    route: '/identity',
  },
  {
    target: '[data-tour="skills-list"]',
    title: 'Skills & Proficiencies',
    body: 'View skill bonuses and toggle proficiencies or expertise.',
    route: '/skills',
  },
  {
    target: '[data-tour="spellcasting"]',
    title: 'Spells & Grimoire',
    body: 'Manage your prepared spells, spell slots, and spellcasting DC.',
    route: '/spells',
  },
]

/** Space kept clear at the bottom of mobile viewports so the tooltip clears the tab bar. */
export const MOBILE_TAB_BAR_CLEARANCE = 96
const MOBILE_BREAKPOINT = 768
const TOOLTIP_MAX_WIDTH = 320
const TOOLTIP_ESTIMATED_HEIGHT = 200
const EDGE_GAP = 16
const TARGET_GAP = 12
/**
 * How long to wait for a step's target to mount after a route change. Lazy route
 * chunks can take a moment on slower engines (WebKit in CI), so be generous in
 * production builds; stay short under Vitest so the missing-target tests are fast.
 */
const TARGET_TIMEOUT_MS = import.meta.env.MODE === 'test' ? 50 : 2000

const active = ref(false)
const currentIndex = ref(0)
const targetRect = ref<TourRect | null>(null)
const completed = ref(readCompleted())
const viewport = ref<TourViewport>({
  width: typeof window !== 'undefined' ? window.innerWidth : 0,
  height: typeof window !== 'undefined' ? window.innerHeight : 0,
})

let cachedRouter: Router | null = null
let rafId: number | null = null
let listenersAttached = false
/** Guards against overlapping next/prev clicks racing a route change. */
let busy = false

function getRouter(): Router {
  if (!cachedRouter) cachedRouter = useRouter()
  return cachedRouter
}

function readCompleted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_TOUR_COMPLETED) === 'true'
  } catch {
    return false
  }
}

function findTarget(selector: string): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.querySelector<HTMLElement>(selector)
}

function rectOf(el: HTMLElement): TourRect {
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right }
}

/** Clamp a tooltip rectangle inside the viewport, above the mobile tab bar. */
export function computeTooltipStyle(rect: TourRect | null, vp: TourViewport): CSSProperties {
  const isMobile = vp.width < MOBILE_BREAKPOINT
  const bottomLimit = isMobile ? vp.height - MOBILE_TAB_BAR_CLEARANCE : vp.height - EDGE_GAP
  const width = Math.min(TOOLTIP_MAX_WIDTH, vp.width - EDGE_GAP * 2)
  const height = TOOLTIP_ESTIMATED_HEIGHT

  if (!rect) {
    const top = Math.max(EDGE_GAP, Math.min((vp.height - height) / 2, bottomLimit - height))
    return { top: `${top}px`, left: `${(vp.width - width) / 2}px`, width: `${width}px` }
  }

  // Prefer below the target, flip above when there is no room, then clamp.
  let top = rect.bottom + TARGET_GAP
  if (top + height > bottomLimit) {
    const above = rect.top - height - TARGET_GAP
    top = above >= EDGE_GAP ? above : Math.max(EDGE_GAP, bottomLimit - height)
  }
  top = Math.min(Math.max(EDGE_GAP, top), Math.max(EDGE_GAP, bottomLimit - height))

  let left = rect.left + rect.width / 2 - width / 2
  left = Math.min(Math.max(EDGE_GAP, left), Math.max(EDGE_GAP, vp.width - width - EDGE_GAP))

  return { top: `${top}px`, left: `${left}px`, width: `${width}px` }
}

const currentStep = computed<TourStep | null>(() => TOUR_STEPS[currentIndex.value] ?? null)
const totalSteps = computed(() => TOUR_STEPS.length)
const isFirst = computed(() => currentIndex.value <= 0)
const isLast = computed(() => currentIndex.value >= TOUR_STEPS.length - 1)
const stepLabel = computed(() =>
  totalSteps.value === 0 ? '' : `${currentIndex.value + 1} / ${totalSteps.value}`,
)
const hasCompletedTour = computed(() => completed.value)

const tooltipStyle = computed(() => computeTooltipStyle(targetRect.value, viewport.value))

const spotlightStyle = computed<CSSProperties | null>(() => {
  const r = targetRect.value
  if (!r) return null
  const pad = 6
  return {
    top: `${r.top - pad}px`,
    left: `${r.left - pad}px`,
    width: `${r.width + pad * 2}px`,
    height: `${r.height + pad * 2}px`,
  }
})

function measure(): void {
  const step = currentStep.value
  const el = step ? findTarget(step.target) : null
  targetRect.value = el ? rectOf(el) : null
}

function highlight(el: HTMLElement): void {
  el.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  targetRect.value = rectOf(el)
}

function refreshViewport(): void {
  if (typeof window === 'undefined') return
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
  measure()
}

function scheduleRefresh(): void {
  if (typeof requestAnimationFrame !== 'function') {
    refreshViewport()
    return
  }
  if (rafId !== null) return
  rafId = requestAnimationFrame(() => {
    rafId = null
    refreshViewport()
  })
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') skip()
}

function attachListeners(): void {
  if (listenersAttached || typeof window === 'undefined') return
  listenersAttached = true
  window.addEventListener('resize', scheduleRefresh)
  window.addEventListener('scroll', scheduleRefresh, true)
  document.addEventListener('keydown', handleKeydown)
}

function detachListeners(): void {
  if (!listenersAttached || typeof window === 'undefined') return
  listenersAttached = false
  window.removeEventListener('resize', scheduleRefresh)
  window.removeEventListener('scroll', scheduleRefresh, true)
  document.removeEventListener('keydown', handleKeydown)
  if (rafId !== null && typeof cancelAnimationFrame === 'function') {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function markCompleted(): void {
  completed.value = true
  try {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_TOUR_COMPLETED, 'true')
  } catch {
    /* storage unavailable — the tour still works for this session */
  }
}

/** Navigate to a step's route (if needed) and wait for the DOM to settle. */
async function navigateTo(step: TourStep): Promise<void> {
  if (!step.route) return
  const router = getRouter()
  if (router.currentRoute.value.path !== step.route) {
    await router.push(step.route)
  }
  await nextTick()
}

/**
 * Wait for a target that may mount after a lazy route change or an async
 * component resolves. Returns null when it never appears within the timeout.
 */
async function waitForTarget(selector: string, timeoutMs = TARGET_TIMEOUT_MS): Promise<HTMLElement | null> {
  let el = findTarget(selector)
  if (el) return el
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 16))
    await nextTick()
    el = findTarget(selector)
    if (el) return el
  }
  return null
}

/**
 * Move in `direction` until a step with a mounted target is found.
 * Returns false when the tour has run out of steps.
 */
async function advance(direction: 1 | -1): Promise<boolean> {
  busy = true
  try {
    let index = currentIndex.value + direction
    while (index >= 0 && index < TOUR_STEPS.length) {
      const step = TOUR_STEPS[index]!
      await navigateTo(step)
      const el = await waitForTarget(step.target)
      if (el) {
        currentIndex.value = index
        highlight(el)
        return true
      }
      index += direction
    }
    return false
  } finally {
    busy = false
  }
}

function endTour(): void {
  active.value = false
  currentIndex.value = 0
  targetRect.value = null
  detachListeners()
  markCompleted()
}

async function startTour(): Promise<void> {
  active.value = true
  currentIndex.value = -1
  targetRect.value = null
  refreshViewport()
  attachListeners()
  const found = await advance(1)
  if (!found) {
    // Nothing to point at (e.g. the sheet is not mounted) — do not persist.
    active.value = false
    currentIndex.value = 0
    detachListeners()
  }
}

async function next(): Promise<void> {
  if (!active.value || busy) return
  const found = await advance(1)
  if (!found) endTour()
}

async function prev(): Promise<void> {
  if (!active.value || busy || isFirst.value) return
  await advance(-1)
}

function skip(): void {
  if (!active.value) return
  endTour()
}

function finish(): void {
  endTour()
}

export function useOnboardingTour() {
  // Resolve the router while we are still in a component setup context —
  // `useRouter()` cannot be injected later from an event handler.
  if (!cachedRouter) cachedRouter = useRouter()

  // Re-read the persisted flag on each consumer setup so a completion from a
  // previous session (or another tab) is reflected without a full reload.
  completed.value = readCompleted() || completed.value

  return {
    // state
    active,
    currentStep,
    currentIndex,
    totalSteps,
    stepLabel,
    isFirst,
    isLast,
    targetRect,
    spotlightStyle,
    tooltipStyle,
    hasCompletedTour,
    // actions
    startTour,
    next,
    prev,
    skip,
    finish,
  }
}
