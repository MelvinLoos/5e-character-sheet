/**
 * Tests for the guild content validators/normalizers.
 * Covers #215: legacy HTML in guild spell/feat descriptions is normalized to
 * Markdown when guild content is fetched and synced into the rules store.
 */
import { describe, it, expect } from 'vitest'
import { normalizeGuildSpell, normalizeGuildFeat } from '@/utils/guildContentValidator'

describe('normalizeGuildSpell', () => {
  it('converts legacy HTML in descriptions to Markdown', () => {
    const spell = normalizeGuildSpell({
      name: 'Fireball',
      level: 3,
      desc: 'Damage:<ul><li>8d6 fire</li><li>ignites objects</li></ul>',
    })

    expect(spell.desc).toBe('Damage:\n- 8d6 fire\n- ignites objects\n')
  })

  it('leaves Markdown descriptions unchanged', () => {
    const spell = normalizeGuildSpell({
      name: 'Mage Armor',
      level: 1,
      desc: '**Protective** magic with *armor*.\n\n- +3 AC',
    })

    expect(spell.desc).toBe('**Protective** magic with *armor*.\n\n- +3 AC')
  })

  it('defaults a missing description to an empty string', () => {
    const spell = normalizeGuildSpell({ name: 'Light', level: 0 })

    expect(spell.desc).toBe('')
  })
})

describe('normalizeGuildFeat', () => {
  it('converts legacy HTML in descriptions to Markdown', () => {
    const feat = normalizeGuildFeat({
      title: 'Alert',
      desc: '<p>You cannot be surprised.</p>',
    })

    expect(feat.desc).toBe('You cannot be surprised.\n\n')
  })

  it('leaves Markdown descriptions unchanged', () => {
    const feat = normalizeGuildFeat({ title: 'Alert', desc: '**Always** ready.' })

    expect(feat.desc).toBe('**Always** ready.')
  })
})
