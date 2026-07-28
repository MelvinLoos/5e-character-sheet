import { test, expect } from '@playwright/test'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { PDFParse } = require('pdf-parse')

test('generates a PDF with exactly 2 pages', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'PDF generation requires Chromium')

  await page.goto('/')

  const newCharButton = page.locator('button:has-text("new character")')
  const isNewCharVisible = await newCharButton.isVisible().catch(() => false)
  if (isNewCharVisible) {
    await newCharButton.click()
  }

  const printable = page.locator('.printable-sheet-container')
  await printable.waitFor({ state: 'attached' })

  await page.emulateMedia({ media: 'print' })

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

  console.log(`Generated PDF has ${result.total} pages.`)
  expect(result.total).toBe(2)
  expect(result.text.trim().length).toBeGreaterThan(0)
})
