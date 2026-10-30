import { test, expect } from '@playwright/test'

test.describe('Short and long rests', () => {
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

  test('damage, short rest with hit dice, long rest and undo', async ({ page }) => {
    const hp = page.getByTestId('hp-current')
    const pool = page.getByTestId('hit-dice-pool')
    const max = Number(await hp.inputValue())
    const dice = (await pool.textContent())?.match(/^\s*(\d+)\/(\d+)/)
    expect(dice).not.toBeNull()
    const total = Number(dice![2])

    // Take damage
    await page.getByTestId('hp-amount').fill('8')
    await page.getByTestId('hp-damage').click()
    await expect(hp).toHaveValue(String(max - 8))

    // Short rest spending one die on average
    await page.getByTestId('short-rest-btn').click()
    await page.getByLabel('Spend more Hit Dice').click()
    await page.getByTestId('rest-confirm').click()
    await expect(hp).not.toHaveValue(String(max - 8))
    await expect(pool).toContainText(`${total - 1}/${total}`)

    // Damage again, long rest restores HP and half the dice
    await page.getByTestId('hp-amount').fill('8')
    await page.getByTestId('hp-damage').click()
    await page.getByTestId('long-rest-btn').click()
    await page.getByTestId('rest-confirm').click()
    await expect(hp).toHaveValue(String(max))
    await expect(pool).toContainText(`${total}/${total}`)

    // Undo reverts the long rest
    await page.getByTestId('undo-rest').click()
    await expect(hp).not.toHaveValue(String(max))
  })
})
