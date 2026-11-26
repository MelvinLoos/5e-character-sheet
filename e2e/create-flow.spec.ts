import { test, expect } from '@playwright/test'

test('guided create flow builds a legal character and finishes on the sheet', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Create Character' }).click()

  const wizard = page.getByTestId('creation-wizard')
  await expect(wizard.getByRole('heading', { name: 'Choose your species' })).toBeVisible()
  const next = wizard.getByRole('navigation', { name: 'Wizard steps (bottom)' }).getByRole('button', { name: 'Next' })
  await expect(next).toBeDisabled()

  await wizard.locator('label', { hasText: /^Human/ }).click()
  await next.click()
  await wizard.locator('label', { hasText: /^Fighter/ }).click()
  await next.click()
  await expect(wizard.getByRole('heading', { name: 'Choose your Martial Archetype' })).toBeVisible()
  await expect(next).toBeDisabled()
  await wizard.locator('label', { hasText: /^Champion/ }).click()
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

test('reopening the guide lets a player change the background and finish', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Create Character' }).click()
  await page.getByRole('button', { name: 'Skip the guide' }).click()
  await page.getByRole('button', { name: 'Viewing', exact: true }).click()

  await page.getByRole('button', { name: 'More', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Reopen creation guide' }).click()

  const wizard = page.getByTestId('creation-wizard')
  const next = wizard.getByRole('navigation', { name: 'Wizard steps (bottom)' }).getByRole('button', { name: 'Next' })
  await expect(wizard.getByRole('heading', { name: 'Choose your species' })).toBeVisible()
  await expect(next).toBeEnabled() // prefilled
  await next.click() // species -> class
  await next.click() // class -> subclass (Barbarian has none picked yet)
  await wizard.locator('label', { hasText: /^Path of the Berserker/ }).click()
  await next.click()
  await wizard.locator('label', { hasText: /^Sage/ }).click()
  await next.click() // abilities
  await next.click() // skills
  await next.click() // ready
  await wizard.getByRole('navigation', { name: 'Wizard steps (bottom)' }).getByRole('button', { name: 'Open character sheet' }).click()

  await expect(page.getByTestId('creation-wizard')).toHaveCount(0)
  await page.getByRole('button', { name: 'Edit', exact: true }).first().click()
  await expect(page.locator('select').filter({ hasText: 'Sage' }).first()).toHaveValue('Sage')
})

test('cancelling a reopened guide leaves the character untouched', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Create Character' }).click()
  await page.getByRole('button', { name: 'Skip the guide' }).click()
  await page.getByRole('button', { name: 'Viewing', exact: true }).click()
  await page.getByRole('button', { name: 'More', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Reopen creation guide' }).click()
  await page.getByRole('button', { name: 'Cancel and keep my character' }).click()
  await expect(page.getByTestId('creation-wizard')).toHaveCount(0)
})
