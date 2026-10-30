import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import DiceTray from '../src/components/DiceTray.vue'
import CelebrationOverlay from '../src/components/ui/CelebrationOverlay.vue'
import { DICE_TYPES, HAPTIC_CRIT, HAPTIC_TAP, MAX_DICE } from '../src/domain/diceService'

// jsdom has no WebGL, so the tray must take the instant numeric path.
HTMLCanvasElement.prototype.getContext = vi.fn(
  () => null,
) as unknown as typeof HTMLCanvasElement.prototype.getContext

// Defensive: the 3D engine must never be constructed during a jsdom run.
vi.mock('@3d-dice/dice-box-threejs', () => ({
  default: class {
    initialize(): Promise<void> {
      return Promise.resolve()
    }
    roll(): Promise<never> {
      return Promise.reject(new Error('no WebGL in jsdom'))
    }
    updateConfig(): void {}
  },
}))

interface DiceTestHooks {
  setNextRoll: (values: number[]) => void
  clearNextRoll: () => void
}

function hooks(): DiceTestHooks {
  const api = (window as unknown as { __hgDiceTest?: DiceTestHooks }).__hgDiceTest
  if (!api) throw new Error('dice test hooks were not installed')
  return api
}

function el<T extends HTMLElement = HTMLElement>(testId: string): T | null {
  return document.querySelector<T>(`[data-testid="${testId}"]`)
}

function text(testId: string): string {
  return el(testId)?.textContent?.trim() ?? ''
}

function vibrateSpy(): (number | number[])[] {
  const calls: (number | number[])[] = []
  Object.defineProperty(navigator, 'vibrate', {
    configurable: true,
    value: (pattern: number | number[]) => {
      calls.push(pattern)
      return true
    },
  })
  return calls
}

function setInputValue(input: HTMLInputElement, value: string): void {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function touch(type: string, clientY: number): Event {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'changedTouches', { value: [{ clientY }] })
  return event
}

let wrappers: VueWrapper[] = []

function mountTray(): VueWrapper {
  const wrapper = mount(DiceTray, { props: { open: true }, attachTo: document.body })
  wrappers.push(wrapper)
  return wrapper
}

async function roll(): Promise<void> {
  el<HTMLButtonElement>('dice-roll')!.click()
  await flushPromises()
}

describe('DiceTray', () => {
  beforeEach(() => {
    hooks().clearNextRoll()
  })

  afterEach(() => {
    wrappers.forEach((wrapper) => wrapper.unmount())
    wrappers = []
    document.body.innerHTML = ''
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: undefined })
  })

  it('renders a button for each of the seven polyhedral dice', () => {
    mountTray()
    for (const die of DICE_TYPES) {
      expect(el(`dice-d${die}`)).not.toBeNull()
    }
    expect(document.querySelectorAll('[data-testid^="dice-d"]')).toHaveLength(DICE_TYPES.length)
  })

  it('falls back to instant results when WebGL is unavailable', () => {
    mountTray()
    expect(el('dice-tray')!.getAttribute('data-engine')).toBe('numeric')
    expect(el('dice-canvas-host')).toBeNull()
    expect(el('dice-fallback-hint')).not.toBeNull()
  })

  it('celebrates a forced Natural 20 with the crit overlay and crit haptics', async () => {
    const calls = vibrateSpy()
    mountTray()
    wrappers.push(mount(CelebrationOverlay, { attachTo: document.body }))

    hooks().setNextRoll([20])
    await roll()
    await nextTick()

    expect(text('dice-total')).toBe('20')
    expect(text('dice-notation')).toBe('1d20')
    expect(el('dice-crit')).not.toBeNull()
    expect(el('dice-fumble')).toBeNull()
    expect(el('celebration-overlay')).not.toBeNull()
    expect(calls).toContainEqual(HAPTIC_CRIT)
  })

  it('rolls several dice with a modifier, lists every value and taps once', async () => {
    const calls = vibrateSpy()
    mountTray()

    el<HTMLButtonElement>('dice-d6')!.click()
    el<HTMLButtonElement>('dice-count-up')!.click()
    el<HTMLButtonElement>('dice-count-up')!.click()
    setInputValue(el<HTMLInputElement>('dice-modifier')!, '2')
    await nextTick()

    hooks().setNextRoll([1, 2, 3])
    await roll()

    expect(text('dice-total')).toBe('8')
    expect(text('dice-notation')).toBe('3d6+2')
    const values = [...document.querySelectorAll('[data-testid="dice-value"]')].map((node) =>
      node.textContent?.trim(),
    )
    expect(values).toEqual(['1', '2', '3'])
    expect(el('dice-crit')).toBeNull()
    expect(el('celebration-overlay')).toBeNull()
    expect(calls).toContainEqual(HAPTIC_TAP)
  })

  it('shows a long-buzz fumble marker for a forced Natural 1', async () => {
    mountTray()
    hooks().setNextRoll([1])
    await roll()

    expect(text('dice-total')).toBe('1')
    expect(el('dice-fumble')).not.toBeNull()
    expect(el('dice-crit')).toBeNull()
  })

  it('clamps the dice count between 1 and MAX_DICE', async () => {
    mountTray()
    expect(text('dice-count')).toBe('1')

    el<HTMLButtonElement>('dice-count-down')!.click()
    await nextTick()
    expect(text('dice-count')).toBe('1')

    for (let i = 0; i < MAX_DICE + 3; i++) {
      el<HTMLButtonElement>('dice-count-up')!.click()
      await nextTick()
    }
    expect(text('dice-count')).toBe(String(MAX_DICE))
  })

  it('clamps the modifier field into range on blur', async () => {
    mountTray()
    const input = el<HTMLInputElement>('dice-modifier')!

    setInputValue(input, '500')
    input.dispatchEvent(new Event('blur'))
    await nextTick()
    expect(input.value).toBe('99')

    setInputValue(input, '')
    input.dispatchEvent(new Event('blur'))
    await nextTick()
    expect(input.value).toBe('0')
  })

  it('closes on backdrop tap', async () => {
    const wrapper = mountTray()
    el<HTMLDivElement>('dice-backdrop')!.click()
    await nextTick()
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('closes on a swipe-down gesture', async () => {
    const wrapper = mountTray()
    const target = el<HTMLButtonElement>('dice-roll')!

    target.dispatchEvent(touch('touchstart', 100))
    target.dispatchEvent(touch('touchend', 220))
    await nextTick()

    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('ignores a small drag that is not a swipe', async () => {
    const wrapper = mountTray()
    const target = el<HTMLButtonElement>('dice-roll')!

    target.dispatchEvent(touch('touchstart', 100))
    target.dispatchEvent(touch('touchend', 120))
    await nextTick()

    expect(wrapper.emitted('update:open')).toBeUndefined()
  })

  it('closes on Escape', async () => {
    const wrapper = mountTray()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.emitted('update:open')?.at(-1)).toEqual([false])
  })

  it('hides the tray while keeping it mounted when closed', async () => {
    const wrapper = mount(DiceTray, { props: { open: false }, attachTo: document.body })
    wrappers.push(wrapper)

    const tray = el('dice-tray')!
    expect(tray).not.toBeNull()
    expect(tray.style.display).toBe('none')
  })
})
