/**
 * Inventory Icon Resolution (Issue #61)
 *
 * Pure utility that maps a gear type string to a Material Icon name.
 * Supports case-insensitive matching, whitespace trimming, and fallback
 * via catalog ID category lookup.
 */

import { ICON_MAP } from '@/types/equipment'
import type { EquipmentCategory } from '@/types/equipment'
import { EQUIPMENT_CATALOG } from '@/data/equipment-items'

// ---------------------------------------------------------------------------
// Category → Icon Mapping (Fallback)
// ---------------------------------------------------------------------------

/** Maps raw EquipmentCategory enum values to Material Icon names.
 *  Used as a secondary lookup when the type string is unrecognized
 *  but a catalogId provides a category reference. */
export const CATEGORY_ICON_MAP: Record<EquipmentCategory, string> = {
  weapon: 'swords',
  armor: 'shield_question',
  shield: 'shield',
  focus: 'auto_awesome',
  pack: 'backpack',
  tool: 'build',
  gear: 'inventory_2',
  ammunition: 'target',
  trinket: 'diamond',
  currency: 'monetization_on',
}

// ---------------------------------------------------------------------------
// Normalized Lookup
// ---------------------------------------------------------------------------

/**
 * Pre-computed lowercase lookup for case-insensitive matching.
 * Built from ICON_MAP at module init so we don't rebuild on every call.
 */
const lookup = new Map<string, string>()
for (const [key, icon] of Object.entries(ICON_MAP)) {
  lookup.set(key.toLowerCase().trim(), icon)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolves a gear type string to a Material Icon name.
 *
 * Resolution order:
 * 1. Trim and lowercase-normalize input, then check ICON_MAP (and legacy aliases).
 * 2. If unmatched and `catalogId` is provided, look up the catalog item's
 *    `category` and map it via CATEGORY_ICON_MAP.
 * 3. Fall back to `'category'` (generic icon).
 *
 * @param type - The gear type string (e.g. "Weapon", "Spellcasting Focus", "Potion").
 * @param catalogId - Optional catalog item ID for category-based fallback.
 * @returns A Material Icon name (e.g. "swords", "science", "category").
 */
export function gearTypeToIcon(type: string, catalogId?: string): string {
  // Normalize input: trim whitespace, lowercase
  const normalized = type?.trim().toLowerCase() ?? ''

  // 1. Direct lookup in the normalized map (includes canonical types + legacy aliases)
  if (normalized.length > 0) {
    const icon = lookup.get(normalized)
    if (icon) return icon
  }

  // 2. Catalog-based fallback via category
  if (catalogId) {
    const catalogItem = EQUIPMENT_CATALOG[catalogId]
    if (catalogItem) {
      const categoryIcon = CATEGORY_ICON_MAP[catalogItem.category]
      if (categoryIcon) return categoryIcon
    }
  }

  // 3. Ultimate fallback
  return 'category'
}