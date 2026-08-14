import { test, expect } from '@playwright/test'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { PDFParse } = require('pdf-parse')

// This test only runs on Chromium (configured in playwright.config.ts)
test('generates a PDF whose page count matches the DOM page count', async ({ page }) => {
  await page.goto('/')

  const newCharButton = page.locator('button:has-text(\"new character\")')
  await newCharButton.click({ timeout: 3000 }).catch(() => {
    // Button may not exist if character is already loaded
  })

  const printable = page.locator('.printable-sheet-container')
  await printable.waitFor({ state: 'attached' })

  await page.emulateMedia({ media: 'print' })

  const domPageCount = await page.locator('.a4-page').count()

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

  // Parse PDF to get page count and verify non-empty text
  const parser = new PDFParse({ data: pdfBuffer })
  const result = await parser.getText()

  console.log(`Generated PDF has ${result.total} pages; DOM reports ${domPageCount} .a4-page nodes.`)

  expect(result.total).toBe(domPageCount)
  expect(result.text.trim().length).toBeGreaterThan(0)
})