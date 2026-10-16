import { test, expect } from '@playwright/test'

/**
 * E2E tests for the "Login with Discord unlocks spells and feats" reminder.
 *
 * Covers the contextual popup shown to logged-out players on the Spells and
 * Feats views, and that its "Don't show this again" toggle persists the choice.
 */

const loginButton = '[data-test="discord-reminder-login"]'
const dontShowAgainToggle = '[data-test="discord-reminder-dont-show"]'
const dismissButton = '[data-test="discord-reminder-dismiss"]'

test.describe('Discord unlock reminder', () => {
  test("shows on the Spells view and stays hidden when the 'don't show again' toggle is used", async ({
    page,
  }) => {
    await page.goto('/spells')

    await expect(page.locator(loginButton)).toBeVisible()

    // Tick the toggle and dismiss — the reminder is suppressed permanently.
    await page.locator(dontShowAgainToggle).check()
    await page.locator(dismissButton).click()
    await expect(page.locator(loginButton)).toBeHidden()

    await page.reload()
    await expect(page.locator(loginButton)).toBeHidden()
  })

  test("re-shows on the Feats view when dismissed without the 'don't show again' toggle", async ({
    page,
  }) => {
    await page.goto('/feats')

    await expect(page.locator(loginButton)).toBeVisible()

    await page.locator(dismissButton).click()
    await expect(page.locator(loginButton)).toBeHidden()

    // Without the toggle, the reminder returns on the next visit.
    await page.reload()
    await expect(page.locator(loginButton)).toBeVisible()
  })
})
