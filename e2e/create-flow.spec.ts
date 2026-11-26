import { test, expect } from '@playwright/test'

test('guided create flow builds a legal character and finishes on the sheet', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Create Character' }).click()

  const wizard = page.getByTestId('creation-wizard')
  await expect(wizard.getByRole('heading', { name: 'Choose your species' })).toBeVisible()
  const next = wizard.getByRole('button', { name: 'Next' })
  await expect(next).toBeDisabled()

  await wizard.locator('label', { hasText: /^Human/ }).click()
  await next.click()
  await wizard.locator('label', { hasText: /^Fighter/ }).click()
  await next.click()
  await wizard.locator('label', { hasText: /^Acolyte/ }).click()
  await next.click()

  await expect(wizard.getByText('27 of 27 points left')).toBeVisible()
  await wizard.getByRole('button', { name: 'Increase Strength' }).click()
  await expect(wizard.getByText('26 of 27 points left')).toBeVisible()
  await next.click()

  // Skills step: class skill choices
  await expect(wizard.getByRole('heading', { name: 'Choose your skills' })).toBeVisible()
  await next.click()

  await expect(wizard.getByTestId('creation-ready')).toBeVisible()
  await wizard.getByLabel('Character name').fill('Wizard Test')
  await wizard.getByRole('button', { name: 'Open character sheet' }).click()

  await expect(page).toHaveURL(/identity/)
  await expect(page.getByTestId('creation-wizard')).toHaveCount(0)
  await expect(page.getByText('Downed', { exact: false })).toHaveCount(0)
})
