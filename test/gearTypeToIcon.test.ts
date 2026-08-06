import { describe, it, expect } from 'vitest'
import { gearTypeToIcon, CATEGORY_ICON_MAP } from '@/utils/gearTypeToIcon'
import type { EquipmentCategory } from '@/types/equipment'

describe('gearTypeToIcon', () => {
  // ──── Exact String Matches (D&D Canonical Names) ────

  describe('exact GearType matches', () => {
    it.each([
      ['Weapon', 'swords'],
      ['Armor', 'shield_question'],
      ['Shield', 'shield'],
      ['Spellcasting Focus', 'auto_awesome'],
      ['Equipment Pack', 'backpack'],
      ['Tool', 'build'],
      ['Adventuring Gear', 'inventory_2'],
      ['Ammunition', 'target'],
      ['Trinket', 'diamond'],
      ['Currency', 'monetization_on'],
      ['Supply', 'water_drop'],
      ['Potion', 'science'],
      ['Scroll', 'description'],
      ['Ring', 'circle'],
      ['Rod', 'remove'],
      ['Staff', 'difference'],
      ['Wand', 'gesture'],
      ['Wondrous Item', 'stars'],
      ['Other', 'category'],
    ])('%s → %s', (type, expectedIcon) => {
      expect(gearTypeToIcon(type)).toBe(expectedIcon)
    })
  })

  // ──── Case-Insensitivity ────

  describe('case-insensitive matching', () => {
    it('lowercase input matches', () => {
      expect(gearTypeToIcon('weapon')).toBe('swords')
      expect(gearTypeToIcon('armor')).toBe('shield_question')
      expect(gearTypeToIcon('shield')).toBe('shield')
      expect(gearTypeToIcon('spellcasting focus')).toBe('auto_awesome')
      expect(gearTypeToIcon('equipment pack')).toBe('backpack')
      expect(gearTypeToIcon('tool')).toBe('build')
      expect(gearTypeToIcon('adventuring gear')).toBe('inventory_2')
      expect(gearTypeToIcon('ammunition')).toBe('target')
      expect(gearTypeToIcon('trinket')).toBe('diamond')
      expect(gearTypeToIcon('currency')).toBe('monetization_on')
      expect(gearTypeToIcon('supply')).toBe('water_drop')
      expect(gearTypeToIcon('potion')).toBe('science')
      expect(gearTypeToIcon('scroll')).toBe('description')
      expect(gearTypeToIcon('ring')).toBe('circle')
      expect(gearTypeToIcon('rod')).toBe('remove')
      expect(gearTypeToIcon('staff')).toBe('difference')
      expect(gearTypeToIcon('wand')).toBe('gesture')
      expect(gearTypeToIcon('wondrous item')).toBe('stars')
      expect(gearTypeToIcon('other')).toBe('category')
    })

    it('UPPERCASE input matches', () => {
      expect(gearTypeToIcon('WEAPON')).toBe('swords')
      expect(gearTypeToIcon('ARMOR')).toBe('shield_question')
      expect(gearTypeToIcon('SPELLCASTING FOCUS')).toBe('auto_awesome')
      expect(gearTypeToIcon('EQUIPMENT PACK')).toBe('backpack')
      expect(gearTypeToIcon('WONDROUS ITEM')).toBe('stars')
    })

    it('mixed case input matches', () => {
      expect(gearTypeToIcon('Weapon')).toBe('swords')
      expect(gearTypeToIcon('sPelLcAsTiNg FoCuS')).toBe('auto_awesome')
      expect(gearTypeToIcon('Adventuring Gear')).toBe('inventory_2')
      expect(gearTypeToIcon('Wondrous Item')).toBe('stars')
      expect(gearTypeToIcon('Equipment Pack')).toBe('backpack')
    })
  })

  // ──── Whitespace Trimming ────

  describe('whitespace trimming', () => {
    it('trims leading/trailing whitespace', () => {
      expect(gearTypeToIcon('  Weapon  ')).toBe('swords')
      expect(gearTypeToIcon('\tArmor\n')).toBe('shield_question')
      expect(gearTypeToIcon('   Spellcasting Focus   ')).toBe('auto_awesome')
    })
  })

  // ──── Fallback: Unrecognized Type (no catalogId) ────

  describe('fallback for unrecognized type', () => {
    it('returns "category" when type is unrecognized and no catalogId provided', () => {
      expect(gearTypeToIcon('Mysterious Artifact')).toBe('category')
      expect(gearTypeToIcon('')).toBe('category')
    })

    it('returns "category" for empty string', () => {
      expect(gearTypeToIcon('')).toBe('category')
    })

    it('returns "category" for null/undefined-like edge cases (coerced to empty string)', () => {
      // Function signature takes string; runtime might pass falsy
      expect(gearTypeToIcon('')).toBe('category')
    })
  })

  // ──── Fallback via catalogId (category lookup) ────

  describe('fallback via catalogId category lookup', () => {
    it('resolves via catalogId when type is unrecognized', () => {
      // 'Some String' not in ICON_MAP → falls back to category lookup via catalogId
      // catalogId 'scale-mail' has category 'armor' → maps to 'shield_question'
      expect(gearTypeToIcon('Some Unknown Type', 'scale-mail')).toBe('shield_question')
    })

    it('resolves weapon category via catalogId', () => {
      expect(gearTypeToIcon('Custom Sword', 'longsword')).toBe('swords')
    })

    it('returns "category" when catalogId is not found in catalog', () => {
      expect(gearTypeToIcon('Mysterious Artifact', 'nonexistent-id-12345')).toBe('category')
    })

    it('returns "category" when catalogId is empty string', () => {
      expect(gearTypeToIcon('Mysterious Artifact', '')).toBe('category')
    })
  })

  // ──── CATEGORY_ICON_MAP Tests ────

  describe('CATEGORY_ICON_MAP', () => {
    it('maps all EquipmentCategory values to a non-empty string', () => {
      const categories: EquipmentCategory[] = [
        'weapon', 'armor', 'shield', 'focus', 'pack',
        'tool', 'gear', 'ammunition', 'trinket', 'currency',
      ]
      for (const cat of categories) {
        const icon = CATEGORY_ICON_MAP[cat]
        expect(icon).toBeDefined()
        expect(typeof icon).toBe('string')
        expect(icon.length).toBeGreaterThan(0)
      }
    })
  })

  // ──── Backward Compatibility (Legacy Saves) ────

  describe('backward compatibility with legacy saves', () => {
    it('handles legacy "Gear" type (old saves before migration)', () => {
      // Pre-Issue #61 saves may have type: 'Gear'
      expect(gearTypeToIcon('Gear')).toBe('category')
    })

    it('handles legacy "Focus" type', () => {
      expect(gearTypeToIcon('Focus')).toBe('category')
    })

    it('handles legacy "Pack" type', () => {
      expect(gearTypeToIcon('Pack')).toBe('category')
    })
  })
})