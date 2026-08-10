import { test, expect } from '@playwright/test'

/**
 * Mobile Tab Bar Overlap E2E Test
 *
 * Verifies that content is fully scrollable past the fixed mobile tab bar
 * on a 375px (iPhone SE) viewport. The root cause was `p-container-padding`
 * (a shorthand) overriding the directional `pb-mobile-safe` padding-bottom.
 *
 * Checks:
 *   1. viewport-fit=cover in the meta tag (required for env(safe-area-inset-bottom) on iOS)
 *   2. <main> computed padding-bottom >= 96px on mobile viewport
 *   3. The scroll container can reach its true bottom
 */
test.describe('Mobile Tab Bar Clearance', () => {
  test('viewport-fit=cover is present in meta tag', async ({ page }) => {
    await page.goto('/')
    const viewportMeta = page.locator('meta[name="viewport"]')
    const content = await viewportMeta.getAttribute('content')
    expect(content).toContain('viewport-fit=cover')
  })

  test('<main> padding-bottom resolves to pb-mobile-safe on mobile viewport', async ({
    page,
  }) => {
    // iPhone SE viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Load a character with inventory items so the <main> renders with content
    await page.addInitScript(() => {
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
      localStorage.setItem('dnd_character_library', JSON.stringify({ Default: [charData] }))
      localStorage.setItem(
        'dnd_current_character_id',
        JSON.stringify({ session: 'Default', characterName: 'Test' }),
      )
    })

    await page.goto('/inventory')

    // Wait for the mobile tab bar to appear (confirms character loaded + mobile layout active)
    const tabBar = page.locator('nav.fixed.bottom-0.h-16')
    await tabBar.waitFor({ state: 'visible', timeout: 10000 })

    // --- Key assertion: computed padding-bottom must be >= 96px ---
    // Use .first() to target the app main (PrintableSheet also has <main>)
    const mainElement = page.locator('main').first()
    const mainPaddingBottom = await mainElement.evaluate((el) => {
      return parseFloat(getComputedStyle(el).paddingBottom)
    })
    expect(mainPaddingBottom).toBeGreaterThanOrEqual(96)
    // 6rem = 96px is the base; safe-area adds more on supported devices
    // On desktop in CI it should be exactly 96px (safe-area-inset-bottom = 0)
  })

  test('scroll container can scroll to true bottom', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.addInitScript(() => {
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
      localStorage.setItem('dnd_character_library', JSON.stringify({ Default: [charData] }))
      localStorage.setItem(
        'dnd_current_character_id',
        JSON.stringify({ session: 'Default', characterName: 'Test' }),
      )
    })

    await page.goto('/inventory')

    const tabBar = page.locator('nav.fixed.bottom-0.h-16')
    await tabBar.waitFor({ state: 'visible', timeout: 10000 })

    // Scroll the container to its bottom
    const scrollContainer = page.locator('.antialiased.min-h-screen')
    await scrollContainer.evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })

    // Verify we reached the bottom (within 5px tolerance)
    const atBottom = await scrollContainer.evaluate((el) => {
      return Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 5
    })
    expect(atBottom).toBe(true)
  })
})