import { test, expect } from '@playwright/test'

/**
 * E2E tests for navigation completion badges (Issue #204).
 *
 * Verifies that the desktop sidebar and mobile tab bar surface count/alert
 * badges for unfinished character-creation steps:
 *   - Identity: unspent point-buy points (count)
 *   - Skills: remaining class skill choices (count)
 *   - Feats: incomplete class feature choice (alert `!`)
 *   - Inventory: starting equipment not chosen (alert `!`)
 */

const charData = {
  name: 'Badge Test',
  title: '',
  jobInParty: '',
  class: 'Fighter',
  renownTier: 1,
  renownMilestones: 0,
  species: 'Human',
  subChoice: null,
  featureChoices: {},
  background: 'Soldier',
  pointBuyBaseScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
  backgroundBonusSelections: { plusTwo: 'str', plusOne: 'con' },
  abilityScores: { str: 10, dex: 8, con: 9, int: 8, wis: 8, cha: 8 },
  profBonus: 2,
  proficiencies: { skills: [], savingThrows: ['str', 'con'] },
  combat: { ac: 10, isAcOverride: false, hp_max: 12, hp_current: 12, speed: '30ft' },
  attacks: [],
  features: [],
  equipment: '',
  personality: { traits: '', ideal: '', bond: '', flaw: '', notes: '' },
  spellcasting: null,
  spells: [],
  gold: 0,
  supply: 0,
  influence: 0,
  inventorySlots: 10,
  equippedGear: [],
  consumables: [],
}

function injectCharacter(page: import('@playwright/test').Page) {
  return page.addInitScript((data) => {
    localStorage.setItem('dnd_character_library', JSON.stringify({ Default: [data] }))
    localStorage.setItem(
      'dnd_current_character_id',
      JSON.stringify({ session: 'Default', characterName: data.name }),
    )
  }, charData)
}

test.describe('Navigation completion badges', () => {
  test('renders count and alert badges in the desktop sidebar', async ({ page }) => {
    await injectCharacter(page)
    await page.goto('/identity')

    const sidebar = page.locator('nav').filter({ has: page.getByText('Identity') }).first()
    await sidebar.waitFor({ state: 'visible', timeout: 10_000 })

    // Count badges surface their label via the link's accessible name.
    await expect(page.getByRole('link', { name: /27 ability points remaining/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /2 skill choices remaining/ })).toBeVisible()

    // Alert badges render an `!` and expose their label via the title.
    await expect(page.getByRole('link', { name: /Class feature choices remaining/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Choose starting equipment/ })).toBeVisible()
  })

  test('renders badges in the mobile tab bar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await injectCharacter(page)
    await page.goto('/identity')

    const tabBar = page.locator('nav.h-16')
    await tabBar.waitFor({ state: 'visible', timeout: 10_000 })

    await expect(page.getByRole('link', { name: /27 ability points remaining/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /2 skill choices remaining/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Class feature choices remaining/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Choose starting equipment/ })).toBeVisible()
  })
})
