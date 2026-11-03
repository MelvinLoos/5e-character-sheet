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

  // Brand-new players land on the welcome screen — create a character first.
  const create = page.getByRole('button', { name: 'Create Character' })
  const created = await create
    .waitFor({ state: 'visible', timeout: 15000 })
    .then(() => true)
    .catch(() => false)
  if (created) await create.click()

  // A freshly created character opens in edit mode; the specs expect the
  // read-only view (the previous blank sheet was not editing).
  const exitEdit = page.getByLabel('Exit Edit Mode').first()
  const editing = await exitEdit
    .waitFor({ state: 'visible', timeout: 15000 })
    .then(() => true)
    .catch(() => false)
  if (editing) await exitEdit.click()
}
