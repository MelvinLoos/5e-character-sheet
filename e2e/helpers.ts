import type { Page } from '@playwright/test'

/**
 * The app opens on a welcome screen for brand-new players (no character), so
 * specs that need a character sheet must create one first. Navigating to a
 * character-only route no longer auto-creates a blank sheet.
 *
 * Idempotent: if a character is already loaded (e.g. injected via
 * `addInitScript`), the welcome button is absent and this is a no-op.
 */
export async function openSheet(page: Page, path = '/identity'): Promise<void> {
  await page.goto(path)
  await page
    .getByRole('button', { name: 'Create Character' })
    .click({ timeout: 5000 })
    .catch(() => {
      // A character was already loaded — nothing to create.
    })
  // A freshly created character opens in edit mode; the specs expect the
  // read-only view (the previous blank sheet was not editing).
  await page
    .getByLabel('Exit Edit Mode')
    .first()
    .click({ timeout: 2000 })
    .catch(() => {
      // Already viewing.
    })
}
