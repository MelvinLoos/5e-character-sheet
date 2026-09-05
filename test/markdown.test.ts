/**
 * Unit tests for the shared Markdown renderer introduced for #215.
 *
 * Descriptions loaded from Supabase (spells, feats, features, gear) are stored
 * as Markdown. renderMarkdown() renders them safely: Markdown formatting is
 * applied, legacy <ul>/<li>/<br>/<p>/<strong>/<em> HTML is normalized to
 * Markdown first, and any remaining raw HTML is escaped (never executed).
 */
import { describe, it, expect } from 'vitest'
import { legacyHtmlToMarkdown, renderMarkdown } from '@/utils/markdown'

describe('renderMarkdown', () => {
  it('renders bold, italic, lists, and paragraphs from Markdown', () => {
    const html = renderMarkdown(
      '**Fireball** is *powerful*.\n\n- Burns things\n- Deals 8d6 fire damage',
    )

    expect(html).toContain('<strong>Fireball</strong>')
    expect(html).toContain('<em>powerful</em>')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>Burns things</li>')
    expect(html).toContain('<li>Deals 8d6 fire damage</li>')
    expect(html).toContain('<p>')
  })

  it('renders the "At Higher Levels" section appended by the 5e.tools adapter', () => {
    const html = renderMarkdown('Creates fire.\n\n**At Higher Levels:** You may upcast this spell.')

    expect(html).toContain('<strong>At Higher Levels:</strong>')
  })

  it('escapes raw HTML so scripts can never execute', () => {
    const html = renderMarkdown('Hello <script>alert(1)</script> <img src=x onerror=alert(2)>')

    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&lt;img')
  })

  it('renders plain text as a single paragraph', () => {
    expect(renderMarkdown('Just some text.')).toContain('<p>Just some text.</p>')
  })

  it('returns an empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('')
  })

  it('renders legacy HTML descriptions by normalizing them first', () => {
    const html = renderMarkdown('<ul><li>Never surprised</li><li>+5 initiative</li></ul>')

    expect(html).toContain('<li>Never surprised</li>')
    expect(html).toContain('<li>+5 initiative</li>')
    expect(html).not.toContain('&lt;ul&gt;')
  })
})

describe('legacyHtmlToMarkdown', () => {
  it('converts legacy <ul>/<li> lists into Markdown list items', () => {
    expect(legacyHtmlToMarkdown('<ul><li>First</li><li>Second</li></ul>')).toBe(
      '\n- First\n- Second\n',
    )
  })

  it('converts legacy <ol> lists into Markdown list items', () => {
    expect(legacyHtmlToMarkdown('<ol><li>Step one</li></ol>')).toBe('\n- Step one\n')
  })

  it('converts legacy <br> tags into hard line breaks', () => {
    expect(legacyHtmlToMarkdown('Line one<br>Line two')).toBe('Line one  \nLine two')
  })

  it('converts legacy <p> tags into paragraph breaks', () => {
    expect(legacyHtmlToMarkdown('<p>Alpha</p><p>Beta</p>')).toBe('Alpha\n\nBeta\n\n')
  })

  it('converts legacy <strong>/<em> tags into Markdown emphasis', () => {
    expect(legacyHtmlToMarkdown('<strong>Bold</strong> and <em>italic</em>')).toBe(
      '**Bold** and *italic*',
    )
  })

  it('converts legacy <b>/<i> tags into Markdown emphasis', () => {
    expect(legacyHtmlToMarkdown('<b>Bold</b> and <i>italic</i>')).toBe('**Bold** and *italic*')
  })

  it('leaves Markdown text unchanged (idempotent)', () => {
    const md = '**Bold** and *italic*\n\n- Item'
    expect(legacyHtmlToMarkdown(md)).toBe(md)
  })

  it('leaves unknown HTML alone so the renderer can escape it', () => {
    const dirty = 'Text <script>alert(1)</script>'
    expect(legacyHtmlToMarkdown(dirty)).toBe(dirty)
    expect(renderMarkdown(dirty)).not.toContain('<script>')
  })
})
