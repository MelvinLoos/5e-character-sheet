/**
 * Canonical equipment-related data model interfaces.
 * Import from '@/types/equipment'.
 *
 * Defines the equipment catalog, starting equipment bundles (Class Options A/B/C),
 * background equipment choices (A/B), and the gold resolution system for the
 * D&D 2024 Starting Equipment feature.
 */

import type { DamageType, WeaponMastery } from './enums'
import type { AbilityKey } from './enums'

// ---------------------------------------------------------------------------
// Equipment Catalog
// ---------------------------------------------------------------------------

/** Classification of an equipment item for UI rendering and filtering. */
export type EquipmentCategory =
  | 'weapon'
  | 'armor'
  | 'shield'
  | 'focus'
  | 'pack'
  | 'tool'
  | 'gear'
  | 'ammunition'
  | 'trinket'
  | 'currency'

/** Semantic tags applied to weapons and armor for rule interactions. */
export type EquipmentTag =
  | 'simple'
  | 'martial'
  | 'melee'
  | 'ranged'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'finesse'
  | 'thrown'
  | 'two-handed'
  | 'versatile'
  | 'reach'
  | 'loading'
  | 'ammunition'
  | 'silvered'
  | 'magical'

/** Weapon-specific properties attached to items with category === 'weapon'. */
export interface WeaponProperties {
  damageDie: string              // e.g. "1d8", "2d6", "1d4"
  damageType: DamageType
  mastery: WeaponMastery         // 2024 mastery property (Cleave, Topple, Nick, etc.)
  versatileDie?: string          // e.g. "1d10" for longsword wielded two-handed
  range?: { normal: number; long?: number }
  atkStat?: AbilityKey           // Override attack stat (e.g. finesse → dex); default resolved by tags
}

/** Armor-specific properties for items with category === 'armor'. */
export interface ArmorProperties {
  baseAc: number
  dexCap?: number                // Max DEX modifier allowed; undefined = no cap (heavy armor uses 0)
  strengthRequirement?: number   // e.g. 13 for chain mail; -5 ft speed penalty if not met
  stealthDisadvantage?: boolean
}

/** Spellcasting focus type — required for the 2024 Magic Action. */
export type FocusType =
  | 'arcane'       // Wizard, Sorcerer, Warlock
  | 'druidic'      // Druid
  | 'holy'         // Cleric, Paladin
  | 'bardic'       // Bard (musical instrument)

// ---------------------------------------------------------------------------
// Core Equipment Item (Catalog Entry)
// ---------------------------------------------------------------------------

/**
 * Canonical definition of a single equipment item in the catalog.
 * Used as the lookup source for all starting equipment bundles.
 */
export interface EquipmentItem {
  id: string                     // Unique slug: "longsword", "chain-mail", "explorers-pack"
  name: string                   // Display name: "Longsword", "Chain Mail"
  category: EquipmentCategory
  cost?: { amount: number; unit: 'gp' | 'sp' | 'cp' }
  weight?: number                // In lbs (informational — not directly used in slot system)
  description?: string
  tags?: EquipmentTag[]

  // Category-specific properties (populated based on category)
  weapon?: WeaponProperties      // Only when category === 'weapon'
  armor?: ArmorProperties        // Only when category === 'armor'
  focusType?: FocusType          // Only when category === 'focus'

  // Pack contents (only when category === 'pack')
  packContents?: string[]        // IDs of items contained in this pack

  // Supply flag — true for consumable gear like torches, rations, candles
  supply?: boolean
}

// ---------------------------------------------------------------------------
// Starting Equipment Options
// ---------------------------------------------------------------------------

/** A quantity of a specific item. Used in both fixed items and choice options. */
export interface EquipmentOption {
  itemId: string                 // References EquipmentItem.id
  quantity: number               // e.g. 20 for arrows, 1 for a sword
}

/** A single choice within a bundle (e.g. "pick 1 from: Longsword or Shortsword"). */
export interface EquipmentChoice {
  pick: number                   // How many to pick (almost always 1)
  options: EquipmentOption[]     // The items to choose from
}

// ---------------------------------------------------------------------------
// Class Equipment Bundles (Options A, B, and C)
// ---------------------------------------------------------------------------

/** Gold buyout for Class Option C.
 *  2024 rules removed dice rolling — only flat GP amounts are used. */
export interface ClassGoldBuyout {
  flatAmount: number             // The resolved flat GP value (per 2024 PHB values)
  description: string            // e.g. "155 GP — purchase your own equipment"
}

/** Non-item benefits granted by a bundle (features, proficiencies, foci). */
export interface BundleGrant {
  type: 'feature' | 'proficiency' | 'spell' | 'focus'
  target: string                 // Feature title, proficiency name, spell name, or focus type
}

/**
 * A curated class starting equipment bundle.
 * Option A and B contain items + choices. Option C contains a gold buyout.
 */
export interface ClassEquipmentBundle {
  bundleId: string               // e.g. "fighter-option-A"
  className: string
  optionLabel: 'A' | 'B' | 'C'
  description: string            // Human-readable summary for the UI selection card

  // Options A & B only:
  items?: EquipmentOption[]      // Fixed items — granted automatically
  choices?: EquipmentChoice[]    // Items requiring player selection
  grants?: BundleGrant[]         // Non-item benefits

  // Option C only:
  goldBuyout?: ClassGoldBuyout   // Flat GP lump sum
}

// ---------------------------------------------------------------------------
// Background Equipment (Options A and B)
// ---------------------------------------------------------------------------

/** Background equipment Option A — thematic gear bundle + small coin pouch. */
export interface BackgroundEquipmentOptionA {
  items: EquipmentOption[]       // Thematic items (clothes, tools, holy symbols, etc.)
  currency: {
    gp: number                   // Typically 10–25 GP
    sp?: number
  }
}

/** Background equipment definition with A/B choice. */
export interface BackgroundEquipment {
  optionA: BackgroundEquipmentOptionA  // Thematic bundle + small gold
  optionB: {
    flatGold: 50                       // Standardized 50 GP across all backgrounds
    description: string                // "50 GP — purchase your own gear"
  }
  trinket?: boolean                    // true = this background grants a trinket selection
}

// ---------------------------------------------------------------------------
// Starting Equipment State (Creation-Time Only)
// ---------------------------------------------------------------------------

/** A resolved choice — the player's selection from an EquipmentChoice prompt. */
export interface ResolvedChoice {
  choiceIndex: number             // Index into the bundle's choices[] array
  selectedItemId: string          // The item the player picked
  selectedQuantity: number
}

/**
 * Transient state tracking the player's equipment selections during
 * character creation. This is NOT persisted on CharacterData — it lives
 * only during the creation wizard and is resolved into inventory items.
 */
export interface StartingEquipmentState {
  classOption: 'A' | 'B' | 'C' | null
  backgroundOption: 'A' | 'B' | null
  resolvedClassChoices: ResolvedChoice[]    // Player's selections from EquipmentChoice prompts
  selectedTrinket: string | null            // EquipmentItem.id of the chosen trinket
}

// ---------------------------------------------------------------------------
// Gold Resolution
// ---------------------------------------------------------------------------

/** Result of calculateTotalGold — shows the breakdown by source. */
export interface GoldBreakdown {
  classGold: number              // Gold contributed by class selection (0 for A/B, flatAmount for C)
  backgroundGold: number         // Gold contributed by background (gp from A, 50 from B)
  totalGold: number              // Sum to apply to character.gold
}

// ---------------------------------------------------------------------------
// Equipment Resolution Result
// ---------------------------------------------------------------------------

/** The fully resolved result of applying starting equipment to a character. */
export interface EquipmentResolutionResult {
  equippedGear: Array<{
    id: string
    name: string
    type: string
    description: string
    slotCost: number
    rarity?: string
    theme?: string
  }>
  consumables: Array<{
    id: string
    name: string
    type: string
    slotCost: number
    usageDie: string
  }>
  attacks: Array<{
    name: string
    dmgDie: string
    type: DamageType | string
    weaponMastery?: string
    atkStat?: AbilityKey | string | null
    dmgStat?: AbilityKey | string | null
    dmgBonus: number
    notes?: string
  }>
  gold: GoldBreakdown
  focusGrants: BundleGrant[]
}