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
