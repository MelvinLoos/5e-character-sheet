import { test, expect } from '@playwright/test'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const pdf = require('pdf-parse')

test('generates a PDF with exactly 2 pages', async ({ page }, testInfo) => {
  // page.pdf is only supported in Headless Chromium
  if (testInfo.project.name !== 'chromium') {
    test.skip()
    return
  }

  // Navigate to the app
  await page.goto('/')

  // If the welcome screen is shown, click "new character" to load default data
  const newCharButton = page.locator('button:has-text("new character")')
  if (await newCharButton.isVisible()) {
    await newCharButton.click()
  }

  // Wait for the character sheet to load
  await page.waitForSelector('.printable-sheet-container', { state: 'attached' })

  // Emulate print media
  await page.emulateMedia({ media: 'print' })

  // Generate PDF buffer
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0.5cm',
      bottom: '0.5cm',
      left: '0.5cm',
      right: '0.5cm',
    },
  })

  // Parse PDF to get page count
  const parser = new pdf.PDFParse({ data: pdfBuffer })
  const result = await parser.getText()
  
  console.log(`Generated PDF has ${result.total} pages.`)
  expect(result.total).toBe(2)
})
