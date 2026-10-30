import { test, expect } from '@playwright/test'

/**
 * 3D dice roller (issue #69).
 *
 * The engine's predetermined-outcome notation (`1d20@20`) makes a *physics*
 * driven roll deterministic, so specs force the next roll through the
 * `window.__hgDiceTest` hook (enabled by VITE_DICE_TEST_HOOK) instead of
 * retrying until a Natural 20 shows up.
 *
 * Assertions stay engine-agnostic: browsers without WebGL (or with reduced
 * motion) fall back to the instant numeric result, which honours the same
 * forced values.
 */
test.describe('Dice roller', () => {
  test.describe.configure({ timeout: 90_000 })

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dnd_discord_unlock_reminder_dismissed', 'true')
      // Record haptic calls instead of vibrating.
      const calls: (number | number[])[] = []
      ;(window as unknown as { __vibrations: (number | number[])[] }).__vibrations = calls
      Object.defineProperty(navigator, 'vibrate', {
        configurable: true,
        value: (pattern: number | number[]) => {
          calls.push(pattern)
          return true
        },
      })
    })
    await page.goto('/identity')
  })

  test('rolls a forced Natural 20 with breakdown, crit overlay and crit haptics', async ({ page }) => {
    await page.getByTestId('dice-fab').click()
    await expect(page.getByTestId('dice-tray')).toBeVisible()

    // The hook is installed when the tray (and the dice composable) first loads.
    await page.waitForFunction(() => '__hgDiceTest' in window)
    await page.evaluate(() =>
      (window as unknown as { __hgDiceTest: { setNextRoll: (values: number[]) => void } }).__hgDiceTest.setNextRoll([
        20,
      ]),
    )

    await page.getByTestId('dice-d20').click()
    await page.getByTestId('dice-roll').click()

    await expect(page.getByTestId('dice-total')).toHaveText('20')
    await expect(page.getByTestId('dice-notation')).toHaveText('1d20')
    await expect(page.getByTestId('dice-crit')).toBeVisible()
    await expect(page.getByTestId('celebration-overlay')).toBeVisible()

    const vibrations = await page.evaluate(
      () => (window as unknown as { __vibrations: (number | number[])[] }).__vibrations,
    )
    expect(vibrations.at(-1)).toEqual([60, 30, 100])
  })

  test('lists every die and the total for a multi-dice roll', async ({ page }) => {
    await page.getByTestId('dice-fab').click()
    await expect(page.getByTestId('dice-tray')).toBeVisible()
    await page.waitForFunction(() => '__hgDiceTest' in window)

    await page.evaluate(() =>
      (window as unknown as { __hgDiceTest: { setNextRoll: (values: number[]) => void } }).__hgDiceTest.setNextRoll([
        4, 4, 4,
      ]),
    )

    await page.getByTestId('dice-d6').click()
    await page.getByTestId('dice-count-up').click()
    await page.getByTestId('dice-count-up').click()
    await page.getByTestId('dice-modifier').fill('2')
    await page.getByTestId('dice-roll').click()

    await expect(page.getByTestId('dice-total')).toHaveText('14')
    await expect(page.getByTestId('dice-notation')).toHaveText('3d6+2')
    await expect(page.getByTestId('dice-value')).toHaveText(['4', '4', '4'])
  })

  test('closes on backdrop tap', async ({ page }) => {
    await page.getByTestId('dice-fab').click()
    await expect(page.getByTestId('dice-tray')).toBeVisible()

    await page.getByTestId('dice-backdrop').click({ position: { x: 5, y: 5 } })
    await expect(page.getByTestId('dice-tray')).toBeHidden()
  })

  test('initialises the real 3D engine on Chromium', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'WebGL is only guaranteed in the Chromium project')

    await page.getByTestId('dice-fab').click()
    await expect(page.getByTestId('dice-tray')).toHaveAttribute('data-engine', '3d')
    await expect(page.locator('#dice-canvas-host canvas')).toBeVisible()
  })
})
