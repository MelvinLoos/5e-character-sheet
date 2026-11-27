import { test, expect } from '@playwright/test'
import { openSheet } from './helpers'

/**
 * E2E for feats that raise ability scores.
 *
 * Validates:
 *  - Importing a 5e.tools feat keeps its `ability` data
 *  - Taking Ability Score Improvement prompts for a pick and the score rises
 *  - Switching to +1/+1 re-applies the increase
 */

const ALL = ['str', 'dex', 'con', 'int', 'wis', 'cha']
const featFile = {
  feat: [
    {
      name: 'Ability Score Improvement',
      source: 'XPHB',
      entries: ['Increase one ability score by 2, or two by 1.'],
      ability: [
        { choose: { from: ALL, amount: 2 }, hidden: true },
        { choose: { from: ALL, count: 2 }, hidden: true },
      ],
    },
  ],
}

test.describe('Feat ability score increases', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('dnd_discord_unlock_reminder_dismissed', 'true')
    })
  })

  test('Ability Score Improvement raises the chosen scores', async ({ page }) => {
    await page.goto('/identity')
    await page.getByRole('button', { name: 'Import JSON' }).click()
    await page.locator('#import-category').selectOption('feats')
    await page.locator('#import-file-input').setInputFiles({
      name: 'feats.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(featFile)),
    })
    await page.getByRole('button', { name: 'Process File' }).click()
    await page.getByRole('button', { name: 'Confirm Import' }).click()
    await expect(page.locator('#import-category')).toBeHidden()

    await openSheet(page)
    await page.getByRole('button', { name: 'Edit', exact: true }).click()
    const score = (key: string) =>
      page.getByLabel(`Decrease ${key} score`).locator('xpath=following-sibling::span[1]')
    const strBefore = Number(await score('STR').textContent())

    await page.getByRole('link', { name: /Feats/ }).first().click()
    await page.getByRole('button', { name: 'Add Feats' }).click()
    await page.getByRole('button', { name: 'Transcribe' }).click()

    // +2 to one score
    const modal = page.locator('[data-test="ability-increase-modal"]')
    await modal.locator('#ability-pick-0').selectOption('str')
    await page.locator('[data-test="ability-increase-confirm"]').click()
    await expect(page.locator('[data-test="ability-increase-badge"]')).toHaveText('+2 STR')

    await page.getByRole('link', { name: /Identity/ }).first().click()
    await expect(score('STR')).toHaveText(String(strBefore + 2))

    // Switch to +1 STR / +1 DEX
    const dexBefore = Number(await score('DEX').textContent())
    await page.getByRole('link', { name: /Feats/ }).first().click()
    await page.locator('[data-test="ability-increase-badge"]').click()
    await modal.getByRole('radio').nth(1).check()
    await modal.locator('#ability-pick-0').selectOption('str')
    await modal.locator('#ability-pick-1').selectOption('dex')
    await page.locator('[data-test="ability-increase-confirm"]').click()

    await page.getByRole('link', { name: /Identity/ }).first().click()
    await expect(score('STR')).toHaveText(String(strBefore + 1))
    await expect(score('DEX')).toHaveText(String(dexBefore + 1))
  })
})
