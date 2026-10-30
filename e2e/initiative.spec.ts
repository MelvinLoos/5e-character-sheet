import { test, expect } from '@playwright/test'

test.describe('Initiative tracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dnd_discord_unlock_reminder_dismissed', 'true')
    })
    await page.goto('/identity')
    await page.getByLabel('Enter Edit Mode').first().click()
    const classSelect = page.locator('select').filter({
      has: page.locator('option[value="Fighter"]'),
    })
    await classSelect.selectOption('Fighter')
    await page.getByLabel('Exit Edit Mode').first().click()
  })

  test('roll shows a value and breakdown, manual entry overrides, both persist', async ({ page }) => {
    const value = page.getByTestId('initiative-value')
    await expect(value).toHaveValue('')

    const mod = Number((await page.getByTestId('initiative-mod').textContent())?.match(/[+-]?\d+/)?.[0])
    await page.getByTestId('initiative-roll').click()
    const rolled = Number(await value.inputValue())
    expect(rolled).toBeGreaterThanOrEqual(1 + mod)
    expect(rolled).toBeLessThanOrEqual(20 + mod)
    await expect(page.getByTestId('initiative-breakdown')).toContainText(`= ${rolled}`)

    await page.getByTestId('initiative-mode-advantage').click()
    await page.getByTestId('initiative-roll').click()
    await expect(page.getByTestId('initiative-breakdown')).toContainText('→')

    await value.fill('22')
    await value.blur()
    await expect(page.getByTestId('initiative-breakdown')).toHaveText('')

    // Drafts are saved on a debounce; wait until the value reaches storage.
    await page.waitForFunction(() =>
      Object.values(localStorage).some((v) => /"initiative":\s*22/.test(v)),
    )
    await page.reload()
    await expect(page.getByTestId('initiative-value')).toHaveValue('22')
  })
})
