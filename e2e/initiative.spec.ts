import { test, expect, type Page } from '@playwright/test'
import { openSheet } from './helpers'

test.describe('Initiative tracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dnd_discord_unlock_reminder_dismissed', 'true')
    })
    await openSheet(page)
    await page.getByLabel('Enter Edit Mode').first().click()
    const classSelect = page.locator('select').filter({
      has: page.locator('option[value="Fighter"]'),
    })
    await classSelect.selectOption('Fighter')
    await page.getByLabel('Exit Edit Mode').first().click()
  })

  /**
   * The initiative roll runs through the 3D dice tray, which overlays the sheet,
   * so dismiss it before interacting with the card again.
   */
  async function dismissTray(page: Page): Promise<void> {
    await page.getByTestId('dice-backdrop').click({ position: { x: 5, y: 5 } })
    await expect(page.getByTestId('dice-tray')).toBeHidden()
  }

  test('roll shows a value and breakdown, manual entry overrides, both persist', async ({ page }) => {
    const value = page.getByTestId('initiative-value')
    await expect(value).toHaveValue('')

    const mod = Number((await page.getByTestId('initiative-mod').textContent())?.match(/[+-]?\d+/)?.[0])

    await page.getByTestId('initiative-roll').click()
    // The roll opens the dice tray and settles asynchronously once the dice rest.
    await expect(page.getByTestId('dice-tray')).toBeVisible()
    await expect(value).not.toHaveValue('')
    const rolled = Number(await value.inputValue())
    expect(rolled).toBeGreaterThanOrEqual(1 + mod)
    expect(rolled).toBeLessThanOrEqual(20 + mod)
    await expect(page.getByTestId('initiative-breakdown')).toContainText(`= ${rolled}`)
    await dismissTray(page)

    await page.getByTestId('initiative-mode-advantage').click()
    await page.getByTestId('initiative-roll').click()
    await expect(page.getByTestId('initiative-breakdown')).toContainText('→')
    await dismissTray(page)

    await value.fill('22')
    await value.blur()
    await expect(page.getByTestId('initiative-breakdown')).toHaveText('Set manually')

    // Drafts are saved on a debounce; wait until the value reaches storage.
    await page.waitForFunction(() =>
      Object.values(localStorage).some((v) => /"initiative":\s*22/.test(v)),
    )
    await page.reload()
    await expect(page.getByTestId('initiative-value')).toHaveValue('22')
  })
})
