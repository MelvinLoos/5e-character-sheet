import { test, expect, type Page } from '@playwright/test'

/**
 * Concentration tracker (issue #238).
 *
 * A caster with concentration spells is injected straight into the draft slot so
 * the spec does not depend on the (guild-populated) spell library. The draft is
 * restored by `initStore` before the sheet renders.
 */
const charData = {
  version: 2,
  name: 'Concentration Test',
  title: '',
  jobInParty: '',
  class: 'Wizard',
  renownTier: 3,
  renownMilestones: 0,
  species: 'Human',
  subChoice: null,
  featureChoices: {},
  background: 'Soldier',
  pointBuyBaseScores: { str: 8, dex: 12, con: 14, int: 14, wis: 10, cha: 8 },
  backgroundBonusSelections: { plusTwo: 'int', plusOne: 'con' },
  abilityScores: { str: 8, dex: 12, con: 15, int: 16, wis: 10, cha: 8 },
  profBonus: 4,
  proficiencies: { skills: [], savingThrows: ['int', 'wis'] },
  combat: { ac: 12, isAcOverride: false, hp_max: 40, hp_current: 40, hp_temp: 0, speed: '30ft' },
  attacks: [],
  features: [],
  equipment: '',
  personality: { traits: '', ideal: '', bond: '', flaw: '', notes: '' },
  spellcasting: { ability: 'int', slotsSpent: {}, concentration: null },
  spells: [
    { id: 'bless', name: 'Bless', level: 1, desc: '', concentration: true },
    { id: 'hex', name: 'Hex', level: 1, desc: '', concentration: true },
    { id: 'fireball', name: 'Fireball', level: 3, desc: '', concentration: false },
  ],
  gold: 0,
  supply: 0,
  influence: 0,
  inventorySlots: 10,
  equippedGear: [],
  consumables: [],
}

function injectCharacter(page: Page) {
  return page.addInitScript((data) => {
    localStorage.setItem('dnd_discord_unlock_reminder_dismissed', 'true')
    localStorage.setItem('dnd_current_draft', JSON.stringify(data))
  }, charData)
}

test.describe('Concentration tracker', () => {
  test.beforeEach(async ({ page }) => {
    await injectCharacter(page)
    await page.goto('/identity')
  })

  test('marks concentration, warns on damage and clears at 0 HP', async ({ page }) => {
    const select = page.getByTestId('concentration-select')
    // Generous timeout: the very first test in the file races a cold dev server.
    await expect(select).toBeVisible({ timeout: 15_000 })

    await select.selectOption('bless')
    await page.getByTestId('concentration-start').click()
    await expect(page.getByTestId('concentration-name')).toHaveText('Bless')

    const hp = page.getByTestId('hp-current')
    const max = Number(await hp.inputValue())
    const dmg = Math.max(1, Math.min(24, max - 1))

    await page.getByTestId('hp-amount').fill(String(dmg))
    await page.getByTestId('hp-damage').click()
    await expect(page.getByTestId('concentration-dc-value')).toHaveText(
      String(Math.max(10, Math.floor(dmg / 2))),
    )
    // Still concentrating after non-lethal damage.
    await expect(page.getByTestId('concentration-banner')).toBeVisible()

    // Drop to 0 HP → concentration ends and the reminder clears.
    await page.getByTestId('hp-amount').fill(String(max))
    await page.getByTestId('hp-damage').click()
    await expect(page.getByTestId('concentration-banner')).toBeHidden()
    await expect(page.getByTestId('concentration-dc')).toBeHidden()
  })

  test('starting a second concentration prompts to replace the first', async ({ page }) => {
    await page.getByTestId('concentration-select').selectOption('bless')
    await page.getByTestId('concentration-start').click()
    await expect(page.getByTestId('concentration-name')).toHaveText('Bless')

    await page.getByTestId('concentration-select').selectOption('hex')
    await page.getByTestId('concentration-start').click()

    await page.getByRole('button', { name: 'Replace' }).click()
    await expect(page.getByTestId('concentration-name')).toHaveText('Hex')
  })

  test('the End button clears the active concentration', async ({ page }) => {
    await page.getByTestId('concentration-select').selectOption('bless')
    await page.getByTestId('concentration-start').click()
    await expect(page.getByTestId('concentration-banner')).toBeVisible()

    await page.getByTestId('concentration-end').click()
    await expect(page.getByTestId('concentration-banner')).toBeHidden()
  })
})
