import { describe, it, expect } from 'vitest'
import { generateQrSvg } from '../src/utils/qrCode'
import { buildShareUrl } from '../src/utils/shareUrl'

describe('buildShareUrl', () => {
  it('builds a share URL from the current location and a character id', () => {
    const url = buildShareUrl('char-123')

    expect(url).toContain('?id=char-123')
    expect(url.startsWith(window.location.origin)).toBe(true)
    expect(url).toContain(window.location.pathname)
  })

  it('returns an empty string when no id is provided', () => {
    expect(buildShareUrl(null)).toBe('')
    expect(buildShareUrl(undefined)).toBe('')
    expect(buildShareUrl('')).toBe('')
  })
})

describe('generateQrSvg', () => {
  it('renders an inline SVG QR code for a URL', async () => {
    const svg = await generateQrSvg('https://example.com/?id=abc')

    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
    expect(svg).toContain('viewBox=')
  })

  it('returns an empty string for a blank or missing URL', async () => {
    expect(await generateQrSvg('')).toBe('')
    expect(await generateQrSvg('   ')).toBe('')
    expect(await generateQrSvg(null)).toBe('')
    expect(await generateQrSvg(undefined)).toBe('')
  })

  it('encodes different URLs into different QR codes', async () => {
    const first = await generateQrSvg('https://example.com/?id=aaa')
    const second = await generateQrSvg('https://example.com/?id=bbb')

    expect(first).not.toBe(second)
  })
})
