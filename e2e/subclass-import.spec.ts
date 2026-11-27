import { test, expect } from '@playwright/test'
import { openSheet } from './helpers'

/**
 * E2E for importing a custom subclass and choosing it on a character.
 *
 * Validates:
 *  - The Import modal accepts a subclass JSON file and previews it
 *  - The imported subclass appears in the class's subclass choice
 *  - Picking it grants the features unlocked at the character's tier, and
 *    keeps later-tier features locked
 */

const subclassFile = {
  subclasses: [
    {
      name: 'Blade Dancer',
      parentClass: 'Fighter',
      description: 'Graceful steel.',
      features: [
        { name: 'Opening Flourish', level: 3, description: 'You strike before the dance begins.' },
        { name: 'Whirling Edge', level: 7, description: 'You spin through every foe nearby.' },
      ],
    },
  ],
}

test.describe('Subclass import', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dnd_discord_unlock_reminder_dismissed', 'true')
    })
  })

  test('imports a subclass and picks it for a Fighter', async ({ page }) => {
    // Import from the welcome screen, before any character exists.
    await page.goto('/identity')
    await page.getByRole('button', { name: 'Import JSON' }).click()

    await page.locator('#import-category').selectOption('subclasses')
    await page.locator('#import-file-input').setInputFiles({
      name: 'blade-dancer.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(subclassFile)),
    })
    await page.getByRole('button', { name: 'Process File' }).click()
    await expect(page.getByText('Blade Dancer (Fighter)')).toBeVisible()
    await page.getByRole('button', { name: 'Confirm Import' }).click()
    // The modal closes itself once the import has been saved; reloading
    // before that would drop the write.
    await expect(page.locator('#import-category')).toBeHidden()

    // Create a character and make it a Fighter.
    await openSheet(page)
    await page.getByRole('button', { name: 'Edit', exact: true }).click()
    await page
      .locator('select')
      .filter({ has: page.locator('option[value="Fighter"]') })
      .selectOption('Fighter')

    // Pick the imported subclass from the Feats page.
    await page.getByRole('link', { name: /Feats/ }).first().click()
    await page.locator('[data-test="feature-choice-manage-fighter-subclass"]').click()
    await page.locator('[data-id="custom-fighter-blade-dancer"]').click()
    await page.getByRole('button', { name: 'Confirm Selections' }).click()

    // Tier 1 unlocks the level-3 feature but not the level-7 one.
    await expect(page.getByText('Opening Flourish').first()).toBeVisible()
    await expect(page.getByText('Whirling Edge')).toHaveCount(0)
  })

  test('importing while a character is open keeps the sheet usable', async ({ page }) => {
    await openSheet(page)

    // Open Import from the sidebar's More menu.
    await page.getByRole('button', { name: 'More', exact: true }).click()
    await page.getByRole('menuitem', { name: /Import Spells, Feats & Subclasses/ }).click()

    await page.locator('#import-category').selectOption('subclasses')
    await page.locator('#import-file-input').setInputFiles({
      name: 'blade-dancer.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(subclassFile)),
    })
    await page.getByRole('button', { name: 'Process File' }).click()
    await page.getByRole('button', { name: 'Confirm Import' }).click()
    await expect(page.locator('#import-category')).toBeHidden()

    // The open character can immediately choose the new subclass.
    await page.getByRole('button', { name: 'Edit', exact: true }).click()
    await page
      .locator('select')
      .filter({ has: page.locator('option[value="Fighter"]') })
      .selectOption('Fighter')
    await page.getByRole('link', { name: /Feats/ }).first().click()
    await page.locator('[data-test="feature-choice-manage-fighter-subclass"]').click()
    await expect(page.locator('[data-id="custom-fighter-blade-dancer"]')).toBeVisible()
  })

  test('rejects a subclass for an unknown class with a clear message', async ({ page }) => {
    await page.goto('/identity')
    await page.getByRole('button', { name: 'Import JSON' }).click()

    await page.locator('#import-category').selectOption('subclasses')
    await page.locator('#import-file-input').setInputFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from(
        JSON.stringify({
          subclasses: [{ ...subclassFile.subclasses[0], parentClass: 'Artificer' }],
        }),
      ),
    })
    await page.getByRole('button', { name: 'Process File' }).click()

    await expect(page.getByText(/unknown parentClass "Artificer"/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Confirm Import' })).toHaveCount(0)
  })
})
