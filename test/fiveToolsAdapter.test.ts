import { describe, it, expect } from 'vitest'
import { sanitizeText } from '../src/utils/fiveToolsAdapter'

describe('fiveToolsAdapter', () => {
  describe('sanitizeText', () => {
    it('returns empty string for null/undefined', () => {
      expect(sanitizeText(null)).toBe('')
      expect(sanitizeText(undefined)).toBe('')
    })

    it('processes plain strings without tags', () => {
      expect(sanitizeText('Hello world')).toBe('Hello world')
    })

    it('converts {@spell} tags to italic markdown', () => {
      const input = 'You cast {@spell fireball} and {@spell magic missile}.'
      const expected = 'You cast *fireball* and *magic missile*.'
      expect(sanitizeText(input)).toBe(expected)
    })

    it('converts {@damage} tags to plain text', () => {
      const input = 'Deals {@damage 2d6} fire damage.'
      const expected = 'Deals 2d6 fire damage.'
      expect(sanitizeText(input)).toBe(expected)
    })

    it('converts {@dc} tags correctly', () => {
      const input = 'Make a {@dc 15} Dexterity saving throw.'
      const expected = 'Make a DC 15 Dexterity saving throw.'
      expect(sanitizeText(input)).toBe(expected)
    })

    it('converts {@hit} tags to plain text', () => {
      const input = 'Attack bonus: {@hit +5}'
      const expected = 'Attack bonus: +5'
      expect(sanitizeText(input)).toBe(expected)
    })

    it('converts {@creature} tags to bold markdown', () => {
      const input = 'You encounter a {@creature goblin}.'
      const expected = 'You encounter a **goblin**.'
      expect(sanitizeText(input)).toBe(expected)
    })

    it('converts {@item} tags to italic markdown', () => {
      const input = 'You find a {@item longsword}.'
      const expected = 'You find a *longsword*.'
      expect(sanitizeText(input)).toBe(expected)
    })

    it('converts {@condition} tags to italic markdown', () => {
      const input = 'The target is {@condition poisoned}.'
      const expected = 'The target is *poisoned*.'
      expect(sanitizeText(input)).toBe(expected)
    })

    it('converts {@skill} tags to plain text', () => {
      const input = 'Make a {@skill Stealth} check.'
      const expected = 'Make a Stealth check.'
      expect(sanitizeText(input)).toBe(expected)
    })

    it('converts {@ability} tags to full ability names', () => {
      const input = 'Add your {@ability str} modifier.'
      const expected = 'Add your Strength modifier.'
      expect(sanitizeText(input)).toBe(expected)

      expect(sanitizeText('{@ability dex}')).toBe('Dexterity')
      expect(sanitizeText('{@ability con}')).toBe('Constitution')
      expect(sanitizeText('{@ability int}')).toBe('Intelligence')
      expect(sanitizeText('{@ability wis}')).toBe('Wisdom')
      expect(sanitizeText('{@ability cha}')).toBe('Charisma')
    })

    it('converts {@atk} tags to descriptive text', () => {
      expect(sanitizeText('{@atk mw}')).toBe('melee weapon attack')
      expect(sanitizeText('{@atk rw}')).toBe('ranged weapon attack')
      expect(sanitizeText('{@atk ms}')).toBe('melee spell attack')
      expect(sanitizeText('{@atk rs}')).toBe('ranged spell attack')
    })

    it('handles multiple different tags in one string', () => {
      const input =
        'Cast {@spell fireball} for {@damage 8d6} damage, {@dc 15} Dex save for half.'
      const expected = 'Cast *fireball* for 8d6 damage, DC 15 Dex save for half.'
      expect(sanitizeText(input)).toBe(expected)
    })

    it('processes string arrays and joins with double newlines', () => {
      const input = ['First paragraph.', 'Second paragraph.', 'Third paragraph.']
      const expected = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.'
      expect(sanitizeText(input)).toBe(expected)
    })

    it('filters out empty strings from arrays', () => {
      const input = ['First.', '', 'Second.', null, 'Third.']
      const expected = 'First.\n\nSecond.\n\nThird.'
      expect(sanitizeText(input)).toBe(expected)
    })

    it('handles nested entries objects with names', () => {
      const input = {
        type: 'entries',
        name: 'Special Ability',
        entries: ['This is a description.', 'It has multiple parts.'],
      }
      const expected = '**Special Ability**\n\nThis is a description.\n\nIt has multiple parts.'
      expect(sanitizeText(input)).toBe(expected)
    })

    it('handles nested entries without names', () => {
      const input = {
        type: 'entries',
        entries: ['Line 1', 'Line 2'],
      }
      const expected = 'Line 1\n\nLine 2'
      expect(sanitizeText(input)).toBe(expected)
    })

    it('processes list objects correctly', () => {
      const input = {
        type: 'list',
        items: ['First item', 'Second item', 'Third item'],
      }
      const expected = '- First item\n- Second item\n- Third item'
      expect(sanitizeText(input)).toBe(expected)
    })

    it('handles complex nested structures', () => {
      const input = [
        'Main description with {@spell mage armor}.',
        {
          type: 'entries',
          name: 'At Higher Levels',
          entries: ['When you cast using a {@dice 1d6} slot.'],
        },
      ]
      const expected =
        'Main description with *mage armor*.\n\n**At Higher Levels**\n\nWhen you cast using a 1d6 slot.'
      expect(sanitizeText(input)).toBe(expected)
    })

    it('handles table objects (simplified)', () => {
      const input = {
        type: 'table',
        caption: 'Damage by Level',
      }
      const expected = '**Table: Damage by Level**'
      expect(sanitizeText(input)).toBe(expected)
    })

    it('strips unrecognized tags as fallback', () => {
      const input = 'This has {@unknownTag some content} in it.'
      const expected = 'This has some content in it.'
      expect(sanitizeText(input)).toBe(expected)
    })

    it('handles deeply nested arrays and objects', () => {
      const input = [
        'Outer text',
        {
          type: 'entries',
          name: 'Section',
          entries: [
            'Inner text with {@spell shield}',
            {
              type: 'list',
              items: ['Bullet {@damage 1d4}', 'Another bullet'],
            },
          ],
        },
      ]
      const result = sanitizeText(input)
      expect(result).toContain('Outer text')
      expect(result).toContain('**Section**')
      expect(result).toContain('Inner text with *shield*')
      expect(result).toContain('- Bullet 1d4')
      expect(result).toContain('- Another bullet')
    })
  })
})
