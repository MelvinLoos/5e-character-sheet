import { test, expect } from '@playwright/test'

/**
 * Mobile Tab Bar Overlap E2E Test
 *
 * Verifies that content is fully scrollable past the fixed mobile tab bar
 * on a 375px (iPhone SE) viewport across all views with lists.
 *
 * Checks:
 *   1. viewport-fit=cover in the meta tag (required for env(safe-area-inset-bottom) on iOS)
 *   2. <main> computed padding-bottom >= 96px on mobile viewport
 *   3. Scroll container can reach its true bottom
 *   4. Skills view: last skill block is fully above the tab bar after scrolling to bottom
 */
test.describe('Mobile Tab Bar Clearance', () => {
  const charData = {
    name: 'Test',
    class: 'Fighter',
    background: 'Soldier',
    abilityScores: { str: 16, dex: 12, con: 14, int: 10, wis: 8, cha: 10 },
    pointBuyBaseScores: { str: 15, dex: 12, con: 14, int: 10, wis: 8, cha: 10 },
    backgroundBonusSelections: { plusTwo: 'str', plusOne: 'con' },
    proficiencies: { skills: ['athletics'], savingThrows: ['str', 'con'] },
    combat: { ac: 16, speed: '30ft', hp_max: 28, hp_current: 28 },
    features: [],
    spells: [],
    equippedGear: Array.from({ length: 25 }, (_, i) => ({
      id: `gear-${i}`,
      name: `Item ${i + 1}`,
      theme: 'default',
    })),
    gold: 100,
    supply: 10,
    influence: 0,
    renownTier: 1,
    attacks: [],
    consumables: [],
    personalityTraits: '',
    ideals: '',
    bonds: '',
    flaws: '',
    appearance: '',
    backstory: '',
    allies: '',
    notes: '',
    spellcasting: null,
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

  test('viewport-fit=cover is present in meta tag', async ({ page }) => {
    await page.goto('/')
    const viewportMeta = page.locator('meta[name="viewport"]')
    const content = await viewportMeta.getAttribute('content')
    expect(content).toContain('viewport-fit=cover')
  })

  test('<main> padding-bottom resolves to pb-mobile-safe on mobile viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await injectCharacter(page)
    await page.goto('/inventory')

    const tabBar = page.locator('nav.fixed.bottom-0.h-16')
    await tabBar.waitFor({ state: 'visible', timeout: 10000 })

    const mainElement = page.locator('main').first()
    const mainPaddingBottom = await mainElement.evaluate((el) => {
      return parseFloat(getComputedStyle(el).paddingBottom)
    })
    expect(mainPaddingBottom).toBeGreaterThanOrEqual(96)
  })

  test('scroll container can scroll to true bottom', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await injectCharacter(page)
    await page.goto('/inventory')

    const tabBar = page.locator('nav.fixed.bottom-0.h-16')
    await tabBar.waitFor({ state: 'visible', timeout: 10000 })

    // Scroll window to bottom (native scrolling after fix)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Verify we reached the bottom (within 5px tolerance)
    const atBottom = await page.evaluate(() => {
      return Math.abs(
        document.documentElement.scrollHeight -
          window.scrollY -
          window.innerHeight,
      ) < 5
    })
    expect(atBottom).toBe(true)
  })

  test('Skills view: last skill block is fully visible above tab bar after scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await injectCharacter(page)
    await page.goto('/skills')

    // Wait for the mobile tab bar to confirm mobile layout is active
    const tabBar = page.locator('nav.fixed.bottom-0.h-16')
    await tabBar.waitFor({ state: 'visible', timeout: 10000 })

    // Wait for skill cards to render
    const skillCards = page.locator(
      '.grid.grid-cols-1.md\\:grid-cols-2.xl\\:grid-cols-3 > div',
    )
    await skillCards.first().waitFor({ state: 'visible', timeout: 5000 })

    const skillCount = await skillCards.count()
    expect(skillCount).toBeGreaterThanOrEqual(18) // 18 D&D skills

    // Scroll to the very bottom of the page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))

    // Get the bounding box of the last skill card
    const lastSkill = skillCards.last()
    const lastSkillBox = await lastSkill.boundingBox()
    const tabBarBox = await tabBar.boundingBox()

    expect(lastSkillBox).not.toBeNull()
    expect(tabBarBox).not.toBeNull()

    // Non-null assertions are safe because the toBeNull assertions above will fail first
    const skillBottom = lastSkillBox!.y + lastSkillBox!.height
    expect(skillBottom).toBeLessThanOrEqual(tabBarBox!.y + 1)
  })
})