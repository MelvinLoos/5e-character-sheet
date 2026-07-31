/**
 * D&D 2024 Starting Equipment Bundles
 *
 * Defines all class starting equipment (Options A, B, and C), background
 * starting equipment (Options A and B), the class-to-focus mapping for
 * spellcasters, and the trinket selection list.
 *
 * Class Option C gold values use the official 2024 PHB flat GP amounts
 * (no dice rolling — 2024 removed randomized starting wealth).
 */

import type {
  ClassEquipmentBundle,
  BackgroundEquipment,
  FocusType,
} from '@/types/equipment'

// ---------------------------------------------------------------------------
// Class → Spellcasting Focus Type Map
// ---------------------------------------------------------------------------

/** Maps a class name to its required spellcasting focus type for the Magic Action. */
export const CLASS_FOCUS_MAP: Record<string, FocusType> = {
  'Cleric': 'holy',
  'Paladin': 'holy',
  'Druid': 'druidic',
  'Wizard': 'arcane',
  'Sorcerer': 'arcane',
  'Warlock': 'arcane',
  'Bard': 'bardic',
}

// ---------------------------------------------------------------------------
// Class Starting Equipment Bundles (Options A, B, and C)
// ---------------------------------------------------------------------------

/**
 * All class starting equipment bundles keyed by:
 *   CLASS_BUNDLES[className].optionA / optionB / optionC
 *
 * 2024 Flat GP values for Option C:
 *   Barbarian: 75, Bard: 100, Cleric: 110, Druid: 50, Fighter: 155,
 *   Monk: 50, Paladin: 150, Ranger: 150, Rogue: 110, Sorcerer: 50,
 *   Warlock: 100, Wizard: 55
 */
export const CLASS_BUNDLES: Record<string, Record<'optionA' | 'optionB' | 'optionC', ClassEquipmentBundle>> = {
  // ──────────────── Barbarian ────────────────
  Barbarian: {
    optionA: {
      bundleId: 'barbarian-option-A',
      className: 'Barbarian',
      optionLabel: 'A',
      description: 'Greataxe, Handaxe ×2, Explorer\'s Pack, Javelin ×4',
      items: [
        { itemId: 'greataxe', quantity: 1 },
        { itemId: 'explorers-pack', quantity: 1 },
        { itemId: 'javelin', quantity: 4 },
      ],
      choices: [],
      grants: [],
    },
    optionB: {
      bundleId: 'barbarian-option-B',
      className: 'Barbarian',
      optionLabel: 'B',
      description: 'Battleaxe, Shield, Handaxe ×2, Explorer\'s Pack, Javelin ×4',
      items: [
        { itemId: 'battleaxe', quantity: 1 },
        { itemId: 'shield', quantity: 1 },
        { itemId: 'explorers-pack', quantity: 1 },
        { itemId: 'javelin', quantity: 4 },
      ],
      choices: [],
      grants: [],
    },
    optionC: {
      bundleId: 'barbarian-option-C',
      className: 'Barbarian',
      optionLabel: 'C',
      description: '75 GP — purchase your own equipment',
      goldBuyout: { flatAmount: 75, description: '75 GP — purchase your own equipment' },
    },
  },

  // ──────────────── Bard ────────────────
  Bard: {
    optionA: {
      bundleId: 'bard-option-A',
      className: 'Bard',
      optionLabel: 'A',
      description: 'Rapier, Entertainer\'s Pack, Musical Instrument, Leather Armor, Dagger',
      items: [
        { itemId: 'rapier', quantity: 1 },
        { itemId: 'entertainers-pack', quantity: 1 },
        { itemId: 'musical-instrument', quantity: 1 },
        { itemId: 'leather', quantity: 1 },
        { itemId: 'dagger', quantity: 1 },
      ],
      choices: [],
      grants: [
        { type: 'focus', target: 'bardic' },
      ],
    },
    optionB: {
      bundleId: 'bard-option-B',
      className: 'Bard',
      optionLabel: 'B',
      description: 'Shortsword, Entertainer\'s Pack, Musical Instrument, Leather Armor, Dagger',
      items: [
        { itemId: 'shortsword', quantity: 1 },
        { itemId: 'entertainers-pack', quantity: 1 },
        { itemId: 'musical-instrument', quantity: 1 },
        { itemId: 'leather', quantity: 1 },
        { itemId: 'dagger', quantity: 1 },
      ],
      choices: [],
      grants: [
        { type: 'focus', target: 'bardic' },
      ],
    },
    optionC: {
      bundleId: 'bard-option-C',
      className: 'Bard',
      optionLabel: 'C',
      description: '100 GP — purchase your own equipment',
      goldBuyout: { flatAmount: 100, description: '100 GP — purchase your own equipment' },
    },
  },

  // ──────────────── Cleric ────────────────
  Cleric: {
    optionA: {
      bundleId: 'cleric-option-A',
      className: 'Cleric',
      optionLabel: 'A',
      description: 'Scale Mail, Shield, Mace, Holy Symbol, Priest\'s Pack',
      items: [
        { itemId: 'scale-mail', quantity: 1 },
        { itemId: 'shield', quantity: 1 },
        { itemId: 'mace', quantity: 1 },
        { itemId: 'holy-symbol', quantity: 1 },
        { itemId: 'priests-pack', quantity: 1 },
      ],
      choices: [],
      grants: [
        { type: 'focus', target: 'holy' },
      ],
    },
    optionB: {
      bundleId: 'cleric-option-B',
      className: 'Cleric',
      optionLabel: 'B',
      description: 'Chain Mail, Warhammer, Holy Symbol, Priest\'s Pack',
      items: [
        { itemId: 'chain-mail', quantity: 1 },
        { itemId: 'warhammer', quantity: 1 },
        { itemId: 'holy-symbol', quantity: 1 },
        { itemId: 'priests-pack', quantity: 1 },
      ],
      choices: [],
      grants: [
        { type: 'focus', target: 'holy' },
      ],
    },
    optionC: {
      bundleId: 'cleric-option-C',
      className: 'Cleric',
      optionLabel: 'C',
      description: '110 GP — purchase your own equipment',
      goldBuyout: { flatAmount: 110, description: '110 GP — purchase your own equipment' },
    },
  },

  // ──────────────── Druid ────────────────
  Druid: {
    optionA: {
      bundleId: 'druid-option-A',
      className: 'Druid',
      optionLabel: 'A',
      description: 'Hide Armor, Scimitar, Druidic Focus, Explorer\'s Pack, Shield',
      items: [
        { itemId: 'hide', quantity: 1 },
        { itemId: 'scimitar', quantity: 1 },
        { itemId: 'druidic-focus', quantity: 1 },
        { itemId: 'explorers-pack', quantity: 1 },
        { itemId: 'shield', quantity: 1 },
      ],
      choices: [],
      grants: [
        { type: 'focus', target: 'druidic' },
      ],
    },
    optionB: {
      bundleId: 'druid-option-B',
      className: 'Druid',
      optionLabel: 'B',
      description: 'Leather Armor, Quarterstaff, Druidic Focus, Explorer\'s Pack, Shield',
      items: [
        { itemId: 'leather', quantity: 1 },
        { itemId: 'quarterstaff', quantity: 1 },
        { itemId: 'druidic-focus', quantity: 1 },
        { itemId: 'explorers-pack', quantity: 1 },
        { itemId: 'shield', quantity: 1 },
      ],
      choices: [],
      grants: [
        { type: 'focus', target: 'druidic' },
      ],
    },
    optionC: {
      bundleId: 'druid-option-C',
      className: 'Druid',
      optionLabel: 'C',
      description: '50 GP — purchase your own equipment',
      goldBuyout: { flatAmount: 50, description: '50 GP — purchase your own equipment' },
    },
  },

  // ──────────────── Fighter ────────────────
  Fighter: {
    optionA: {
      bundleId: 'fighter-option-A',
      className: 'Fighter',
      optionLabel: 'A',
      description: 'Chain Mail, Longsword, Shield, Handaxe ×2, Explorer\'s Pack, 20 Arrows',
      items: [
        { itemId: 'chain-mail', quantity: 1 },
        { itemId: 'longsword', quantity: 1 },
        { itemId: 'shield', quantity: 1 },
        { itemId: 'explorers-pack', quantity: 1 },
        { itemId: 'arrow', quantity: 20 },
      ],
      choices: [
        {
          pick: 1,
          options: [
            { itemId: 'handaxe', quantity: 2 },
            { itemId: 'light-hammer', quantity: 2 },
          ],
        },
      ],
      grants: [],
    },
    optionB: {
      bundleId: 'fighter-option-B',
      className: 'Fighter',
      optionLabel: 'B',
      description: 'Studded Leather, Longbow, Rapier, Shortsword, Explorer\'s Pack, 20 Arrows',
      items: [
        { itemId: 'studded-leather', quantity: 1 },
        { itemId: 'longbow', quantity: 1 },
        { itemId: 'rapier', quantity: 1 },
        { itemId: 'shortsword', quantity: 1 },
        { itemId: 'explorers-pack', quantity: 1 },
        { itemId: 'arrow', quantity: 20 },
      ],
      choices: [],
      grants: [],
    },
    optionC: {
      bundleId: 'fighter-option-C',
      className: 'Fighter',
      optionLabel: 'C',
      description: '155 GP — purchase your own equipment',
      goldBuyout: { flatAmount: 155, description: '155 GP — purchase your own equipment' },
    },
  },

  // ──────────────── Monk ────────────────
  Monk: {
    optionA: {
      bundleId: 'monk-option-A',
      className: 'Monk',
      optionLabel: 'A',
      description: 'Shortsword, Dungeoneer\'s Pack, Dagger ×10',
      items: [
        { itemId: 'shortsword', quantity: 1 },
        { itemId: 'dungeoneers-pack', quantity: 1 },
        { itemId: 'dagger', quantity: 10 },
      ],
      choices: [],
      grants: [],
    },
    optionB: {
      bundleId: 'monk-option-B',
      className: 'Monk',
      optionLabel: 'B',
      description: 'Quarterstaff, Dungeoneer\'s Pack, Dagger ×10',
      items: [
        { itemId: 'quarterstaff', quantity: 1 },
        { itemId: 'dungeoneers-pack', quantity: 1 },
        { itemId: 'dagger', quantity: 10 },
      ],
      choices: [],
      grants: [],
    },
    optionC: {
      bundleId: 'monk-option-C',
      className: 'Monk',
      optionLabel: 'C',
      description: '50 GP — purchase your own equipment',
      goldBuyout: { flatAmount: 50, description: '50 GP — purchase your own equipment' },
    },
  },

  // ──────────────── Paladin ────────────────
  Paladin: {
    optionA: {
      bundleId: 'paladin-option-A',
      className: 'Paladin',
      optionLabel: 'A',
      description: 'Chain Mail, Longsword, Shield, Holy Symbol, Priest\'s Pack, Javelin ×5',
      items: [
        { itemId: 'chain-mail', quantity: 1 },
        { itemId: 'longsword', quantity: 1 },
        { itemId: 'shield', quantity: 1 },
        { itemId: 'holy-symbol', quantity: 1 },
        { itemId: 'priests-pack', quantity: 1 },
        { itemId: 'javelin', quantity: 5 },
      ],
      choices: [],
      grants: [
        { type: 'focus', target: 'holy' },
      ],
    },
    optionB: {
      bundleId: 'paladin-option-B',
      className: 'Paladin',
      optionLabel: 'B',
      description: 'Scale Mail, Warhammer, Shield, Holy Symbol, Priest\'s Pack',
      items: [
        { itemId: 'scale-mail', quantity: 1 },
        { itemId: 'warhammer', quantity: 1 },
        { itemId: 'shield', quantity: 1 },
        { itemId: 'holy-symbol', quantity: 1 },
        { itemId: 'priests-pack', quantity: 1 },
      ],
      choices: [],
      grants: [
        { type: 'focus', target: 'holy' },
      ],
    },
    optionC: {
      bundleId: 'paladin-option-C',
      className: 'Paladin',
      optionLabel: 'C',
      description: '150 GP — purchase your own equipment',
      goldBuyout: { flatAmount: 150, description: '150 GP — purchase your own equipment' },
    },
  },

  // ──────────────── Ranger ────────────────
  Ranger: {
    optionA: {
      bundleId: 'ranger-option-A',
      className: 'Ranger',
      optionLabel: 'A',
      description: 'Scale Mail, Shortsword ×2, Explorer\'s Pack, Longbow, 20 Arrows',
      items: [
        { itemId: 'scale-mail', quantity: 1 },
        { itemId: 'shortsword', quantity: 2 },
        { itemId: 'explorers-pack', quantity: 1 },
        { itemId: 'longbow', quantity: 1 },
        { itemId: 'arrow', quantity: 20 },
      ],
      choices: [],
      grants: [],
    },
    optionB: {
      bundleId: 'ranger-option-B',
      className: 'Ranger',
      optionLabel: 'B',
      description: 'Studded Leather, Scimitar ×2, Explorer\'s Pack, Hand Crossbow, 20 Bolts',
      items: [
        { itemId: 'studded-leather', quantity: 1 },
        { itemId: 'scimitar', quantity: 2 },
        { itemId: 'explorers-pack', quantity: 1 },
        { itemId: 'hand-crossbow', quantity: 1 },
        { itemId: 'crossbow-bolt', quantity: 20 },
      ],
      choices: [],
      grants: [],
    },
    optionC: {
      bundleId: 'ranger-option-C',
      className: 'Ranger',
      optionLabel: 'C',
      description: '150 GP — purchase your own equipment',
      goldBuyout: { flatAmount: 150, description: '150 GP — purchase your own equipment' },
    },
  },

  // ──────────────── Rogue ────────────────
  Rogue: {
    optionA: {
      bundleId: 'rogue-option-A',
      className: 'Rogue',
      optionLabel: 'A',
      description: 'Leather Armor, Shortsword, Shortbow, Burglar\'s Pack, Dagger ×2',
      items: [
        { itemId: 'leather', quantity: 1 },
        { itemId: 'shortsword', quantity: 1 },
        { itemId: 'shortbow', quantity: 1 },
        { itemId: 'burglars-pack', quantity: 1 },
        { itemId: 'arrow', quantity: 20 },
        { itemId: 'dagger', quantity: 2 },
      ],
      choices: [],
      grants: [],
    },
    optionB: {
      bundleId: 'rogue-option-B',
      className: 'Rogue',
      optionLabel: 'B',
      description: 'Leather Armor, Rapier, Shortsword, Burglar\'s Pack, Dagger ×2',
      items: [
        { itemId: 'leather', quantity: 1 },
        { itemId: 'rapier', quantity: 1 },
        { itemId: 'shortsword', quantity: 1 },
        { itemId: 'burglars-pack', quantity: 1 },
        { itemId: 'dagger', quantity: 2 },
      ],
      choices: [],
      grants: [],
    },
    optionC: {
      bundleId: 'rogue-option-C',
      className: 'Rogue',
      optionLabel: 'C',
      description: '110 GP — purchase your own equipment',
      goldBuyout: { flatAmount: 110, description: '110 GP — purchase your own equipment' },
    },
  },

  // ──────────────── Sorcerer ────────────────
  Sorcerer: {
    optionA: {
      bundleId: 'sorcerer-option-A',
      className: 'Sorcerer',
      optionLabel: 'A',
      description: 'Arcane Focus (Crystal), Dungeoneer\'s Pack, Dagger ×2',
      items: [
        { itemId: 'arcane-focus-crystal', quantity: 1 },
        { itemId: 'dungeoneers-pack', quantity: 1 },
        { itemId: 'dagger', quantity: 2 },
      ],
      choices: [],
      grants: [
        { type: 'focus', target: 'arcane' },
      ],
    },
    optionB: {
      bundleId: 'sorcerer-option-B',
      className: 'Sorcerer',
      optionLabel: 'B',
      description: 'Component Pouch, Dungeoneer\'s Pack, Dagger ×2',
      items: [
        { itemId: 'component-pouch', quantity: 1 },
        { itemId: 'dungeoneers-pack', quantity: 1 },
        { itemId: 'dagger', quantity: 2 },
      ],
      choices: [],
      grants: [
        { type: 'focus', target: 'arcane' },
      ],
    },
    optionC: {
      bundleId: 'sorcerer-option-C',
      className: 'Sorcerer',
      optionLabel: 'C',
      description: '50 GP — purchase your own equipment',
      goldBuyout: { flatAmount: 50, description: '50 GP — purchase your own equipment' },
    },
  },

  // ──────────────── Warlock ────────────────
  Warlock: {
    optionA: {
      bundleId: 'warlock-option-A',
      className: 'Warlock',
      optionLabel: 'A',
      description: 'Arcane Focus (Orb), Dagger ×2, Scholar\'s Pack, Leather Armor',
      items: [
        { itemId: 'arcane-focus-orb', quantity: 1 },
        { itemId: 'dagger', quantity: 2 },
        { itemId: 'scholars-pack', quantity: 1 },
        { itemId: 'leather', quantity: 1 },
      ],
      choices: [],
      grants: [
        { type: 'focus', target: 'arcane' },
      ],
    },
    optionB: {
      bundleId: 'warlock-option-B',
      className: 'Warlock',
      optionLabel: 'B',
      description: 'Component Pouch, Dagger ×2, Dungeoneer\'s Pack, Leather Armor',
      items: [
        { itemId: 'component-pouch', quantity: 1 },
        { itemId: 'dagger', quantity: 2 },
        { itemId: 'dungeoneers-pack', quantity: 1 },
        { itemId: 'leather', quantity: 1 },
      ],
      choices: [],
      grants: [
        { type: 'focus', target: 'arcane' },
      ],
    },
    optionC: {
      bundleId: 'warlock-option-C',
      className: 'Warlock',
      optionLabel: 'C',
      description: '100 GP — purchase your own equipment',
      goldBuyout: { flatAmount: 100, description: '100 GP — purchase your own equipment' },
    },
  },

  // ──────────────── Wizard ────────────────
  Wizard: {
    optionA: {
      bundleId: 'wizard-option-A',
      className: 'Wizard',
      optionLabel: 'A',
      description: 'Arcane Focus (Orb), Dagger, Scholar\'s Pack, Spellbook',
      items: [
        { itemId: 'quarterstaff', quantity: 1 },
        { itemId: 'dagger', quantity: 1 },
        { itemId: 'scholars-pack', quantity: 1 },
        { itemId: 'spellbook', quantity: 1 },
      ],
      choices: [],
      grants: [
        { type: 'focus', target: 'arcane' },
      ],
    },
    optionB: {
      bundleId: 'wizard-option-B',
      className: 'Wizard',
      optionLabel: 'B',
      description: 'Component Pouch, Dagger, Scholar\'s Pack, Spellbook',
      items: [
        { itemId: 'component-pouch', quantity: 1 },
        { itemId: 'dagger', quantity: 1 },
        { itemId: 'scholars-pack', quantity: 1 },
        { itemId: 'spellbook', quantity: 1 },
      ],
      choices: [],
      grants: [
        { type: 'focus', target: 'arcane' },
      ],
    },
    optionC: {
      bundleId: 'wizard-option-C',
      className: 'Wizard',
      optionLabel: 'C',
      description: '55 GP — purchase your own equipment',
      goldBuyout: { flatAmount: 55, description: '55 GP — purchase your own equipment' },
    },
  },
}

// ---------------------------------------------------------------------------
// Background Starting Equipment (Options A and B)
// ---------------------------------------------------------------------------

/**
 * All background equipment definitions keyed by background name.
 * Option A: thematic gear bundle + small coin pouch.
 * Option B: flat 50 GP (standardized for all backgrounds in 2024).
 */
export const BACKGROUND_EQUIPMENT: Record<string, BackgroundEquipment> = {
  Acolyte: {
    optionA: {
      items: [
        { itemId: 'holy-symbol', quantity: 1 },
        { itemId: 'common-clothes', quantity: 1 },
        { itemId: 'robe', quantity: 1 },
        { itemId: 'candle', quantity: 5 },
        { itemId: 'incense-block', quantity: 2 },
        { itemId: 'blanket', quantity: 1 },
        { itemId: 'belt-pouch', quantity: 1 },
      ],
      currency: { gp: 15 },
    },
    optionB: { flatGold: 50, description: '50 GP — purchase your own gear' },
    trinket: false,
  },
  Artisan: {
    optionA: {
      items: [
        { itemId: 'common-clothes', quantity: 1 },
        { itemId: 'artisans-tools-choice', quantity: 1 },
        { itemId: 'blanket', quantity: 1 },
        { itemId: 'waterskin', quantity: 1 },
        { itemId: 'belt-pouch', quantity: 1 },
      ],
      currency: { gp: 15 },
    },
    optionB: { flatGold: 50, description: '50 GP — purchase your own gear' },
    trinket: false,
  },
  Charlatan: {
    optionA: {
      items: [
        { itemId: 'fine-clothes', quantity: 1 },
        { itemId: 'disguise-kit', quantity: 1 },
        { itemId: 'forgery-kit', quantity: 1 },
        { itemId: 'belt-pouch', quantity: 1 },
      ],
      currency: { gp: 15 },
    },
    optionB: { flatGold: 50, description: '50 GP — purchase your own gear' },
    trinket: false,
  },
  Criminal: {
    optionA: {
      items: [
        { itemId: 'common-clothes', quantity: 1 },
        { itemId: 'crowbar', quantity: 1 },
        { itemId: 'dagger', quantity: 1 },
        { itemId: 'belt-pouch', quantity: 1 },
      ],
      currency: { gp: 15 },
    },
    optionB: { flatGold: 50, description: '50 GP — purchase your own gear' },
    trinket: false,
  },
  Entertainer: {
    optionA: {
      items: [
        { itemId: 'costume', quantity: 1 },
        { itemId: 'musical-instrument', quantity: 1 },
        { itemId: 'belt-pouch', quantity: 1 },
      ],
      currency: { gp: 15 },
    },
    optionB: { flatGold: 50, description: '50 GP — purchase your own gear' },
    trinket: true,
  },
  Farmer: {
    optionA: {
      items: [
        { itemId: 'common-clothes', quantity: 1 },
        { itemId: 'shovel', quantity: 1 },
        { itemId: 'blanket', quantity: 1 },
        { itemId: 'waterskin', quantity: 1 },
        { itemId: 'belt-pouch', quantity: 1 },
      ],
      currency: { gp: 10 },
    },
    optionB: { flatGold: 50, description: '50 GP — purchase your own gear' },
    trinket: false,
  },
  Guard: {
    optionA: {
      items: [
        { itemId: 'spear', quantity: 1 },
        { itemId: 'common-clothes', quantity: 1 },
        { itemId: 'hooded-lantern', quantity: 1 },
        { itemId: 'mess-kit', quantity: 1 },
        { itemId: 'belt-pouch', quantity: 1 },
      ],
      currency: { gp: 10 },
    },
    optionB: { flatGold: 50, description: '50 GP — purchase your own gear' },
    trinket: false,
  },
  Guide: {
    optionA: {
      items: [
        { itemId: 'common-clothes', quantity: 1 },
        { itemId: 'waterskin', quantity: 1 },
        { itemId: 'blanket', quantity: 1 },
        { itemId: 'tinderbox', quantity: 1 },
        { itemId: 'rope-hempen-50ft', quantity: 1 },
        { itemId: 'belt-pouch', quantity: 1 },
      ],
      currency: { gp: 15 },
    },
    optionB: { flatGold: 50, description: '50 GP — purchase your own gear' },
    trinket: false,
  },
  Hermit: {
    optionA: {
      items: [
        { itemId: 'common-clothes', quantity: 1 },
        { itemId: 'blanket', quantity: 1 },
        { itemId: 'tinderbox', quantity: 1 },
        { itemId: 'rations', quantity: 5 },
        { itemId: 'waterskin', quantity: 1 },
        { itemId: 'belt-pouch', quantity: 1 },
      ],
      currency: { gp: 5 },
    },
    optionB: { flatGold: 50, description: '50 GP — purchase your own gear' },
    trinket: false,
  },
  Merchant: {
    optionA: {
      items: [
        { itemId: 'common-clothes', quantity: 1 },
        { itemId: 'belt-pouch', quantity: 1 },
        { itemId: 'mess-kit', quantity: 1 },
        { itemId: 'blanket', quantity: 1 },
      ],
      currency: { gp: 20 },
    },
    optionB: { flatGold: 50, description: '50 GP — purchase your own gear' },
    trinket: false,
  },
  Noble: {
    optionA: {
      items: [
        { itemId: 'fine-clothes', quantity: 1 },
        { itemId: 'belt-pouch', quantity: 1 },
      ],
      currency: { gp: 25 },
    },
    optionB: { flatGold: 50, description: '50 GP — purchase your own gear' },
    trinket: true,
  },
  Sage: {
    optionA: {
      items: [
        { itemId: 'common-clothes', quantity: 1 },
        { itemId: 'ink', quantity: 1 },
        { itemId: 'ink-pen', quantity: 1 },
        { itemId: 'parchment', quantity: 10 },
        { itemId: 'little-bag-of-sand', quantity: 1 },
        { itemId: 'small-knife', quantity: 1 },
        { itemId: 'belt-pouch', quantity: 1 },
      ],
      currency: { gp: 10 },
    },
    optionB: { flatGold: 50, description: '50 GP — purchase your own gear' },
    trinket: false,
  },
  Sailor: {
    optionA: {
      items: [
        { itemId: 'common-clothes', quantity: 1 },
        { itemId: 'dagger', quantity: 1 },
        { itemId: 'rope-hempen-50ft', quantity: 1 },
        { itemId: 'belt-pouch', quantity: 1 },
      ],
      currency: { gp: 15 },
    },
    optionB: { flatGold: 50, description: '50 GP — purchase your own gear' },
    trinket: false,
  },
  Scribe: {
    optionA: {
      items: [
        { itemId: 'common-clothes', quantity: 1 },
        { itemId: 'ink', quantity: 1 },
        { itemId: 'ink-pen', quantity: 1 },
        { itemId: 'parchment', quantity: 10 },
        { itemId: 'small-knife', quantity: 1 },
        { itemId: 'belt-pouch', quantity: 1 },
      ],
      currency: { gp: 10 },
    },
    optionB: { flatGold: 50, description: '50 GP — purchase your own gear' },
    trinket: false,
  },
  Soldier: {
    optionA: {
      items: [
        { itemId: 'common-clothes', quantity: 1 },
        { itemId: 'dagger', quantity: 1 },
        { itemId: 'trophy-from-foe', quantity: 1 },
        { itemId: 'shovel', quantity: 1 },
        { itemId: 'blanket', quantity: 1 },
        { itemId: 'mess-kit', quantity: 1 },
        { itemId: 'belt-pouch', quantity: 1 },
      ],
      currency: { gp: 10 },
    },
    optionB: { flatGold: 50, description: '50 GP — purchase your own gear' },
    trinket: true,
  },
  Urchin: {
    optionA: {
      items: [
        { itemId: 'common-clothes', quantity: 1 },
        { itemId: 'small-knife', quantity: 1 },
        { itemId: 'candle', quantity: 3 },
        { itemId: 'blanket', quantity: 1 },
        { itemId: 'belt-pouch', quantity: 1 },
      ],
      currency: { gp: 10 },
    },
    optionB: { flatGold: 50, description: '50 GP — purchase your own gear' },
    trinket: true,
  },
}