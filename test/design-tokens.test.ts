/**
 * Guards for the design-system foundation from the UI/UX audit:
 * - every typography token used in templates is defined in tailwind.config.js
 * - ElevatedCard emits a static shadow class per elevation (so Tailwind never purges it)
 * - the pre-paint theme script and a11y base styles exist
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import tailwindConfig from '../tailwind.config.js'
import ElevatedCard from '../src/components/ui/ElevatedCard.vue'

function vueFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? vueFiles(p) : p.endsWith('.vue') ? [p] : []
  })
}

describe('typography tokens', () => {
  const fontSize = Object.keys(tailwindConfig.theme.extend.fontSize)
  const fontFamily = Object.keys(tailwindConfig.theme.extend.fontFamily)
  const used = new Set<string>()
  for (const file of vueFiles('src')) {
    const src = readFileSync(file, 'utf8')
    for (const m of src.matchAll(/\b(?:text|font)-((?:label|body|headline|display)-(?:sm|md|lg))\b/g)) {
      used.add(m[1]!)
    }
  }

  it('defines every text-* size used in templates', () => {
    const missing = [...used].filter((t) => !fontSize.includes(t))
    expect(missing).toEqual([])
  })

  it('defines every font-* family used in templates', () => {
    const missing = [...used].filter((t) => !fontFamily.includes(t))
    expect(missing).toEqual([])
  })
})

describe('ElevatedCard', () => {
  it.each([1, 2, 3, 4] as const)('applies a static shadow class for elevation %i', (elevation) => {
    const wrapper = mount(ElevatedCard, { props: { elevation } })
    expect(wrapper.classes()).toContain(`shadow-elevation-${elevation}`)
  })
})

describe('theme + accessibility foundations', () => {
  const html = readFileSync('index.html', 'utf8')
  const css = readFileSync('src/assets/main.css', 'utf8')

  it('applies the saved or OS theme before first paint', () => {
    expect(html).toMatch(/<script>[\s\S]*dnd_app_theme[\s\S]*prefers-color-scheme[\s\S]*<\/script>/)
  })

  it('defines focus-visible and reduced-motion base styles', () => {
    expect(css).toContain(':focus-visible')
    expect(css).toContain('prefers-reduced-motion: reduce')
  })

  it('no longer overrides grid gaps globally', () => {
    expect(css).not.toMatch(/\.grid\s*\{\s*gap:\s*[12]rem;/)
  })
})

describe('error colour', () => {
  const css = readFileSync('src/assets/main.css', 'utf8')
  const darkBlock = css.slice(0, css.indexOf('html.light {'))
  const token = (block: string, name: string) =>
    block.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, 'i'))![1]!

  function luminance(hex: string): number {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!)
  }
  function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi! + 0.05) / (lo! + 0.05)
  }

  it('is a real red in the dark theme, not the Material pink', () => {
    expect(token(darkBlock, 'error').toLowerCase()).not.toBe('#ffb4ab')
  })

  it('meets AA for badge digits and for red text on the dark background', () => {
    const error = token(darkBlock, 'error')
    expect(contrast(token(darkBlock, 'on-error'), error)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(error, token(darkBlock, 'background'))).toBeGreaterThanOrEqual(4.5)
  })
})
