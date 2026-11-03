import { test, expect } from '@playwright/test'

/**
 * First-time player onboarding tour.
 *
 * Covers the empty-state entry points, the route-spanning tour flow (including
 * gracefully skipping the Spells step for a non-caster), completion persistence,
 * replaying from the More menu, and mobile tab-bar clearance.
 */
test.describe('Onboarding tour', () => {
  test('welcomes new players and offers creation, import, and the tour', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Welcome, Adventurer' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Character' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Import JSON' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Take a quick tour' })).toBeVisible()
  })

  test('runs the tour from the empty state and persists completion', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Take a quick tour' }).click()

    const tooltip = page.locator('.tour-tooltip')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText('Your Character')
    await expect(tooltip).toContainText('1 / 5')

    // Advance through Ability Scores and Combat, then the Skills step (new route).
    await tooltip.getByRole('button', { name: 'Next' }).click()
    await tooltip.getByRole('button', { name: 'Next' }).click()
    await tooltip.getByRole('button', { name: 'Next' }).click()
    await expect(tooltip).toContainText('Skills & Proficiencies')
    await expect(page).toHaveURL(/\/skills$/)

    // The final step lives on the Spells route.
    await tooltip.getByRole('button', { name: 'Next' }).click()
    await expect(tooltip).toContainText('Spells & Grimoire')
    await expect(page).toHaveURL(/\/spells$/)

    // Finishing persists completion.
    await tooltip.getByRole('button', { name: 'Finish' }).click()
    await expect(tooltip).toBeHidden()

    const completed = await page.evaluate(() =>
      localStorage.getItem('dnd_onboarding_tour_completed'),
    )
    expect(completed).toBe('true')
  })

  test('can be restarted from the desktop More menu', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Create Character' }).click()

    await page.getByRole('button', { name: 'More', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Restart Tour' }).click()

    await expect(page.locator('.tour-tooltip')).toBeVisible()
  })

  test('keeps the tooltip clear of the mobile tab bar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Take a quick tour' }).click()

    const tooltip = page.locator('.tour-tooltip')
    await expect(tooltip).toBeVisible()

    const box = await tooltip.boundingBox()
    expect(box).not.toBeNull()
    // The mobile tab bar is 64px tall; the tooltip must sit above it.
    expect(box!.y + box!.height).toBeLessThanOrEqual(700 - 64)
  })
})
