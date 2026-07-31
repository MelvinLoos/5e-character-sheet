/**
 * D&D 2024 Equipment Catalog
 *
 * Canonical definitions for all weapons, armor, shields, foci, packs,
 * tools, and trinkets referenced by starting equipment bundles.
 *
 * Every WeaponMastery property is the official 2024 assignment per the PHB.
 */

import type { EquipmentItem } from '@/types/equipment'

// ---------------------------------------------------------------------------
// Weapons (with 2024 Mastery Properties)
// ---------------------------------------------------------------------------

const weapons: Record<string, EquipmentItem> = {
  // ── Simple Melee Weapons ──
  club: {
    id: 'club',
    name: 'Club',
    category: 'weapon',
    cost: { amount: 1, unit: 'sp' },
    weight: 2,
    tags: ['simple', 'melee', 'light'],
    weapon: { damageDie: '1d4', damageType: 'bludgeoning', mastery: 'Slow' },
  },
  dagger: {
    id: 'dagger',
    name: 'Dagger',
    category: 'weapon',
    cost: { amount: 2, unit: 'gp' },
    weight: 1,
    tags: ['simple', 'melee', 'light', 'finesse', 'thrown'],
    weapon: { damageDie: '1d4', damageType: 'piercing', mastery: 'Nick', range: { normal: 20, long: 60 }, atkStat: 'dex' },
  },
  'greatclub': {
    id: 'greatclub',
    name: 'Greatclub',
    category: 'weapon',
    cost: { amount: 2, unit: 'sp' },
    weight: 10,
    tags: ['simple', 'melee', 'two-handed'],
    weapon: { damageDie: '1d8', damageType: 'bludgeoning', mastery: 'Push' },
  },
  handaxe: {
    id: 'handaxe',
    name: 'Handaxe',
    category: 'weapon',
    cost: { amount: 5, unit: 'gp' },
    weight: 2,
    tags: ['simple', 'melee', 'light', 'thrown'],
    weapon: { damageDie: '1d6', damageType: 'slashing', mastery: 'Vex', range: { normal: 20, long: 60 } },
  },
  javelin: {
    id: 'javelin',
    name: 'Javelin',
    category: 'weapon',
    cost: { amount: 5, unit: 'sp' },
    weight: 2,
    tags: ['simple', 'melee', 'thrown'],
    weapon: { damageDie: '1d6', damageType: 'piercing', mastery: 'Slow', range: { normal: 30, long: 120 } },
  },
  'light-hammer': {
    id: 'light-hammer',
    name: 'Light Hammer',
    category: 'weapon',
    cost: { amount: 2, unit: 'gp' },
    weight: 2,
    tags: ['simple', 'melee', 'light', 'thrown'],
    weapon: { damageDie: '1d4', damageType: 'bludgeoning', mastery: 'Nick', range: { normal: 20, long: 60 } },
  },
  mace: {
    id: 'mace',
    name: 'Mace',
    category: 'weapon',
    cost: { amount: 5, unit: 'gp' },
    weight: 4,
    tags: ['simple', 'melee'],
    weapon: { damageDie: '1d6', damageType: 'bludgeoning', mastery: 'Sap' },
  },
  quarterstaff: {
    id: 'quarterstaff',
    name: 'Quarterstaff',
    category: 'weapon',
    cost: { amount: 2, unit: 'sp' },
    weight: 4,
    tags: ['simple', 'melee', 'versatile'],
    weapon: { damageDie: '1d6', damageType: 'bludgeoning', mastery: 'Topple', versatileDie: '1d8' },
  },
  sickle: {
    id: 'sickle',
    name: 'Sickle',
    category: 'weapon',
    cost: { amount: 1, unit: 'gp' },
    weight: 2,
    tags: ['simple', 'melee', 'light'],
    weapon: { damageDie: '1d4', damageType: 'slashing', mastery: 'Nick' },
  },
  spear: {
    id: 'spear',
    name: 'Spear',
    category: 'weapon',
    cost: { amount: 1, unit: 'gp' },
    weight: 3,
    tags: ['simple', 'melee', 'thrown', 'versatile'],
    weapon: { damageDie: '1d6', damageType: 'piercing', mastery: 'Sap', versatileDie: '1d8', range: { normal: 20, long: 60 } },
  },

  // ── Simple Ranged Weapons ──
  'hand-crossbow': {
    id: 'hand-crossbow',
    name: 'Hand Crossbow',
    category: 'weapon',
    cost: { amount: 75, unit: 'gp' },
    weight: 3,
    tags: ['simple', 'ranged', 'light', 'ammunition', 'loading'],
    weapon: { damageDie: '1d6', damageType: 'piercing', mastery: 'Vex', range: { normal: 30, long: 120 }, atkStat: 'dex' },
  },
  'light-crossbow': {
    id: 'light-crossbow',
    name: 'Light Crossbow',
    category: 'weapon',
    cost: { amount: 25, unit: 'gp' },
    weight: 5,
    tags: ['simple', 'ranged', 'two-handed', 'ammunition', 'loading'],
    weapon: { damageDie: '1d8', damageType: 'piercing', mastery: 'Push', range: { normal: 80, long: 320 }, atkStat: 'dex' },
  },
  shortbow: {
    id: 'shortbow',
    name: 'Shortbow',
    category: 'weapon',
    cost: { amount: 25, unit: 'gp' },
    weight: 2,
    tags: ['simple', 'ranged', 'two-handed', 'ammunition'],
    weapon: { damageDie: '1d6', damageType: 'piercing', mastery: 'Vex', range: { normal: 80, long: 320 }, atkStat: 'dex' },
  },
  sling: {
    id: 'sling',
    name: 'Sling',
    category: 'weapon',
    cost: { amount: 1, unit: 'sp' },
    weight: 0,
    tags: ['simple', 'ranged', 'ammunition'],
    weapon: { damageDie: '1d4', damageType: 'bludgeoning', mastery: 'Slow', range: { normal: 30, long: 120 }, atkStat: 'dex' },
  },

  // ── Martial Melee Weapons ──
  battleaxe: {
    id: 'battleaxe',
    name: 'Battleaxe',
    category: 'weapon',
    cost: { amount: 10, unit: 'gp' },
    weight: 4,
    tags: ['martial', 'melee', 'versatile'],
    weapon: { damageDie: '1d8', damageType: 'slashing', mastery: 'Topple', versatileDie: '1d10' },
  },
  flail: {
    id: 'flail',
    name: 'Flail',
    category: 'weapon',
    cost: { amount: 10, unit: 'gp' },
    weight: 2,
    tags: ['martial', 'melee'],
    weapon: { damageDie: '1d8', damageType: 'bludgeoning', mastery: 'Sap' },
  },
  glaive: {
    id: 'glaive',
    name: 'Glaive',
    category: 'weapon',
    cost: { amount: 20, unit: 'gp' },
    weight: 6,
    tags: ['martial', 'melee', 'heavy', 'two-handed', 'reach'],
    weapon: { damageDie: '1d10', damageType: 'slashing', mastery: 'Graze' },
  },
  greataxe: {
    id: 'greataxe',
    name: 'Greataxe',
    category: 'weapon',
    cost: { amount: 30, unit: 'gp' },
    weight: 7,
    tags: ['martial', 'melee', 'heavy', 'two-handed'],
    weapon: { damageDie: '1d12', damageType: 'slashing', mastery: 'Cleave' },
  },
  greatsword: {
    id: 'greatsword',
    name: 'Greatsword',
    category: 'weapon',
    cost: { amount: 50, unit: 'gp' },
    weight: 6,
    tags: ['martial', 'melee', 'heavy', 'two-handed'],
    weapon: { damageDie: '2d6', damageType: 'slashing', mastery: 'Graze' },
  },
  halberd: {
    id: 'halberd',
    name: 'Halberd',
    category: 'weapon',
    cost: { amount: 20, unit: 'gp' },
    weight: 6,
    tags: ['martial', 'melee', 'heavy', 'two-handed', 'reach'],
    weapon: { damageDie: '1d10', damageType: 'slashing', mastery: 'Cleave' },
  },
  lance: {
    id: 'lance',
    name: 'Lance',
    category: 'weapon',
    cost: { amount: 10, unit: 'gp' },
    weight: 6,
    tags: ['martial', 'melee', 'reach'],
    weapon: { damageDie: '1d12', damageType: 'piercing', mastery: 'Push' },
  },
  longsword: {
    id: 'longsword',
    name: 'Longsword',
    category: 'weapon',
    cost: { amount: 15, unit: 'gp' },
    weight: 3,
    tags: ['martial', 'melee', 'versatile'],
    weapon: { damageDie: '1d8', damageType: 'slashing', mastery: 'Sap', versatileDie: '1d10' },
  },
  maul: {
    id: 'maul',
    name: 'Maul',
    category: 'weapon',
    cost: { amount: 10, unit: 'gp' },
    weight: 10,
    tags: ['martial', 'melee', 'heavy', 'two-handed'],
    weapon: { damageDie: '2d6', damageType: 'bludgeoning', mastery: 'Topple' },
  },
  morningstar: {
    id: 'morningstar',
    name: 'Morningstar',
    category: 'weapon',
    cost: { amount: 15, unit: 'gp' },
    weight: 4,
    tags: ['martial', 'melee'],
    weapon: { damageDie: '1d8', damageType: 'piercing', mastery: 'Sap' },
  },
  pike: {
    id: 'pike',
    name: 'Pike',
    category: 'weapon',
    cost: { amount: 5, unit: 'gp' },
    weight: 18,
    tags: ['martial', 'melee', 'heavy', 'two-handed', 'reach'],
    weapon: { damageDie: '1d10', damageType: 'piercing', mastery: 'Push' },
  },
  rapier: {
    id: 'rapier',
    name: 'Rapier',
    category: 'weapon',
    cost: { amount: 25, unit: 'gp' },
    weight: 2,
    tags: ['martial', 'melee', 'finesse'],
    weapon: { damageDie: '1d8', damageType: 'piercing', mastery: 'Vex', atkStat: 'dex' },
  },
  scimitar: {
    id: 'scimitar',
    name: 'Scimitar',
    category: 'weapon',
    cost: { amount: 25, unit: 'gp' },
    weight: 3,
    tags: ['martial', 'melee', 'light', 'finesse'],
    weapon: { damageDie: '1d6', damageType: 'slashing', mastery: 'Nick', atkStat: 'dex' },
  },
  shortsword: {
    id: 'shortsword',
    name: 'Shortsword',
    category: 'weapon',
    cost: { amount: 10, unit: 'gp' },
    weight: 2,
    tags: ['martial', 'melee', 'light', 'finesse'],
    weapon: { damageDie: '1d6', damageType: 'piercing', mastery: 'Vex', atkStat: 'dex' },
  },
  trident: {
    id: 'trident',
    name: 'Trident',
    category: 'weapon',
    cost: { amount: 5, unit: 'gp' },
    weight: 4,
    tags: ['martial', 'melee', 'thrown', 'versatile'],
    weapon: { damageDie: '1d6', damageType: 'piercing', mastery: 'Topple', versatileDie: '1d8', range: { normal: 20, long: 60 } },
  },
  'war-pick': {
    id: 'war-pick',
    name: 'War Pick',
    category: 'weapon',
    cost: { amount: 5, unit: 'gp' },
    weight: 2,
    tags: ['martial', 'melee', 'versatile'],
    weapon: { damageDie: '1d8', damageType: 'piercing', mastery: 'Sap', versatileDie: '1d10' },
  },
  warhammer: {
    id: 'warhammer',
    name: 'Warhammer',
    category: 'weapon',
    cost: { amount: 15, unit: 'gp' },
    weight: 2,
    tags: ['martial', 'melee', 'versatile'],
    weapon: { damageDie: '1d8', damageType: 'bludgeoning', mastery: 'Push', versatileDie: '1d10' },
  },
  whip: {
    id: 'whip',
    name: 'Whip',
    category: 'weapon',
    cost: { amount: 2, unit: 'gp' },
    weight: 3,
    tags: ['martial', 'melee', 'finesse', 'reach'],
    weapon: { damageDie: '1d4', damageType: 'slashing', mastery: 'Slow', atkStat: 'dex' },
  },

  // ── Martial Ranged Weapons ──
  'heavy-crossbow': {
    id: 'heavy-crossbow',
    name: 'Heavy Crossbow',
    category: 'weapon',
    cost: { amount: 50, unit: 'gp' },
    weight: 18,
    tags: ['martial', 'ranged', 'heavy', 'two-handed', 'ammunition', 'loading'],
    weapon: { damageDie: '1d10', damageType: 'piercing', mastery: 'Push', range: { normal: 100, long: 400 }, atkStat: 'dex' },
  },
  longbow: {
    id: 'longbow',
    name: 'Longbow',
    category: 'weapon',
    cost: { amount: 50, unit: 'gp' },
    weight: 2,
    tags: ['martial', 'ranged', 'heavy', 'two-handed', 'ammunition'],
    weapon: { damageDie: '1d8', damageType: 'piercing', mastery: 'Slow', range: { normal: 150, long: 600 }, atkStat: 'dex' },
  },
}

// ---------------------------------------------------------------------------
// Armor
// ---------------------------------------------------------------------------

const armor: Record<string, EquipmentItem> = {
  // ── Light Armor ──
  padded: {
    id: 'padded',
    name: 'Padded',
    category: 'armor',
    cost: { amount: 5, unit: 'gp' },
    weight: 8,
    tags: ['light'],
    armor: { baseAc: 11, dexCap: undefined, stealthDisadvantage: true },
  },
  leather: {
    id: 'leather',
    name: 'Leather',
    category: 'armor',
    cost: { amount: 10, unit: 'gp' },
    weight: 10,
    tags: ['light'],
    armor: { baseAc: 11, dexCap: undefined },
  },
  'studded-leather': {
    id: 'studded-leather',
    name: 'Studded Leather',
    category: 'armor',
    cost: { amount: 45, unit: 'gp' },
    weight: 13,
    tags: ['light'],
    armor: { baseAc: 12, dexCap: undefined },
  },

  // ── Medium Armor ──
  hide: {
    id: 'hide',
    name: 'Hide',
    category: 'armor',
    cost: { amount: 10, unit: 'gp' },
    weight: 12,
    tags: ['medium'],
    armor: { baseAc: 12, dexCap: 2 },
  },
  'chain-shirt': {
    id: 'chain-shirt',
    name: 'Chain Shirt',
    category: 'armor',
    cost: { amount: 50, unit: 'gp' },
    weight: 20,
    tags: ['medium'],
    armor: { baseAc: 13, dexCap: 2 },
  },
  'scale-mail': {
    id: 'scale-mail',
    name: 'Scale Mail',
    category: 'armor',
    cost: { amount: 50, unit: 'gp' },
    weight: 45,
    tags: ['medium'],
    armor: { baseAc: 14, dexCap: 2, stealthDisadvantage: true },
  },
  breastplate: {
    id: 'breastplate',
    name: 'Breastplate',
    category: 'armor',
    cost: { amount: 400, unit: 'gp' },
    weight: 20,
    tags: ['medium'],
    armor: { baseAc: 14, dexCap: 2 },
  },
  'half-plate': {
    id: 'half-plate',
    name: 'Half Plate',
    category: 'armor',
    cost: { amount: 750, unit: 'gp' },
    weight: 40,
    tags: ['medium'],
    armor: { baseAc: 15, dexCap: 2, stealthDisadvantage: true },
  },

  // ── Heavy Armor ──
  'ring-mail': {
    id: 'ring-mail',
    name: 'Ring Mail',
    category: 'armor',
    cost: { amount: 30, unit: 'gp' },
    weight: 40,
    tags: ['heavy'],
    armor: { baseAc: 14, dexCap: 0, stealthDisadvantage: true },
  },
  'chain-mail': {
    id: 'chain-mail',
    name: 'Chain Mail',
    category: 'armor',
    cost: { amount: 75, unit: 'gp' },
    weight: 55,
    tags: ['heavy'],
    armor: { baseAc: 16, dexCap: 0, strengthRequirement: 13, stealthDisadvantage: true },
  },
  splint: {
    id: 'splint',
    name: 'Splint',
    category: 'armor',
    cost: { amount: 200, unit: 'gp' },
    weight: 60,
    tags: ['heavy'],
    armor: { baseAc: 17, dexCap: 0, strengthRequirement: 15, stealthDisadvantage: true },
  },
  plate: {
    id: 'plate',
    name: 'Plate',
    category: 'armor',
    cost: { amount: 1500, unit: 'gp' },
    weight: 65,
    tags: ['heavy'],
    armor: { baseAc: 18, dexCap: 0, strengthRequirement: 15, stealthDisadvantage: true },
  },
}

// ---------------------------------------------------------------------------
// Shields
// ---------------------------------------------------------------------------

const shields: Record<string, EquipmentItem> = {
  shield: {
    id: 'shield',
    name: 'Shield',
    category: 'shield',
    cost: { amount: 10, unit: 'gp' },
    weight: 6,
    description: '+2 AC when wielded in one hand',
  },
}

// ---------------------------------------------------------------------------
// Spellcasting Foci
// ---------------------------------------------------------------------------

const foci: Record<string, EquipmentItem> = {
  'arcane-focus-orb': {
    id: 'arcane-focus-orb',
    name: 'Arcane Focus (Orb)',
    category: 'focus',
    cost: { amount: 20, unit: 'gp' },
    weight: 3,
    focusType: 'arcane',
    description: 'Used by Wizards, Sorcerers, and Warlocks as a spellcasting focus for the Magic Action.',
  },
  'arcane-focus-crystal': {
    id: 'arcane-focus-crystal',
    name: 'Arcane Focus (Crystal)',
    category: 'focus',
    cost: { amount: 10, unit: 'gp' },
    weight: 1,
    focusType: 'arcane',
    description: 'Used by Wizards, Sorcerers, and Warlocks as a spellcasting focus for the Magic Action.',
  },
  'arcane-focus-rod': {
    id: 'arcane-focus-rod',
    name: 'Arcane Focus (Rod)',
    category: 'focus',
    cost: { amount: 10, unit: 'gp' },
    weight: 2,
    focusType: 'arcane',
    description: 'Used by Wizards, Sorcerers, and Warlocks as a spellcasting focus for the Magic Action.',
  },
  'arcane-focus-staff': {
    id: 'arcane-focus-staff',
    name: 'Arcane Focus (Staff)',
    category: 'focus',
    cost: { amount: 5, unit: 'gp' },
    weight: 4,
    focusType: 'arcane',
    description: 'Used by Wizards, Sorcerers, and Warlocks as a spellcasting focus. Can also be used as a quarterstaff.',
  },
  'arcane-focus-wand': {
    id: 'arcane-focus-wand',
    name: 'Arcane Focus (Wand)',
    category: 'focus',
    cost: { amount: 10, unit: 'gp' },
    weight: 1,
    focusType: 'arcane',
    description: 'Used by Wizards, Sorcerers, and Warlocks as a spellcasting focus for the Magic Action.',
  },
  'component-pouch': {
    id: 'component-pouch',
    name: 'Component Pouch',
    category: 'focus',
    cost: { amount: 25, unit: 'gp' },
    weight: 2,
    focusType: 'arcane',
    description: 'A waterproof belt pouch with compartments for material components. Can substitute for any focus type.',
  },
  'druidic-focus': {
    id: 'druidic-focus',
    name: 'Druidic Focus',
    category: 'focus',
    cost: { amount: 5, unit: 'gp' },
    weight: 1,
    focusType: 'druidic',
    description: 'A sprig of mistletoe, totem, or other natural focus for druidic magic.',
  },
  'holy-symbol': {
    id: 'holy-symbol',
    name: 'Holy Symbol',
    category: 'focus',
    cost: { amount: 5, unit: 'gp' },
    weight: 1,
    focusType: 'holy',
    description: 'A divine focus used by Clerics and Paladins for the Magic Action. Can be emblazoned on a shield.',
  },
  'musical-instrument': {
    id: 'musical-instrument',
    name: 'Musical Instrument',
    category: 'focus',
    cost: { amount: 25, unit: 'gp' },
    weight: 3,
    focusType: 'bardic',
    description: 'Used by Bards as a spellcasting focus for the Magic Action.',
  },
}

// ---------------------------------------------------------------------------
// Packs
// ---------------------------------------------------------------------------

const packs: Record<string, EquipmentItem> = {
  'explorers-pack': {
    id: 'explorers-pack',
    name: "Explorer's Pack",
    category: 'pack',
    cost: { amount: 10, unit: 'gp' },
    weight: 59,
    description: 'Contains everything an adventurer needs for wilderness travel.',
    packContents: [
      'backpack', 'bedroll', 'mess-kit', 'tinderbox',
      'torch', 'torch', 'torch', 'torch', 'torch', 'torch', 'torch', 'torch', 'torch', 'torch',
      'rations', 'rations', 'rations', 'rations', 'rations', 'rations', 'rations', 'rations', 'rations', 'rations',
      'waterskin', 'rope-hempen-50ft',
    ],
  },
  'priests-pack': {
    id: 'priests-pack',
    name: "Priest's Pack",
    category: 'pack',
    cost: { amount: 19, unit: 'gp' },
    weight: 29,
    description: 'Contains the essentials for a traveling cleric or paladin.',
    packContents: [
      'backpack', 'blanket',
      'candle', 'candle', 'candle', 'candle', 'candle', 'candle', 'candle', 'candle', 'candle', 'candle',
      'tinderbox', 'alms-box',
      'incense-block', 'incense-block',
      'vestments',
      'rations', 'rations',
    ],
  },
  'scholars-pack': {
    id: 'scholars-pack',
    name: "Scholar's Pack",
    category: 'pack',
    cost: { amount: 40, unit: 'gp' },
    weight: 22,
    description: 'Contains the tools a wizard or scholar needs to study and record knowledge.',
    packContents: [
      'backpack', 'book-lore', 'ink', 'ink-pen',
      'parchment', 'parchment', 'parchment', 'parchment', 'parchment',
      'parchment', 'parchment', 'parchment', 'parchment', 'parchment',
      'little-bag-of-sand', 'small-knife',
    ],
  },
  'dungeoneers-pack': {
    id: 'dungeoneers-pack',
    name: "Dungeoneer's Pack",
    category: 'pack',
    cost: { amount: 12, unit: 'gp' },
    weight: 61,
    description: 'Contains essential gear for dungeon delving.',
    packContents: [
      'backpack', 'crowbar', 'hammer',
      'pitons', 'pitons', 'pitons', 'pitons', 'pitons', 'pitons', 'pitons', 'pitons', 'pitons', 'pitons',
      'torch', 'torch', 'torch', 'torch', 'torch', 'torch', 'torch', 'torch', 'torch', 'torch',
      'tinderbox',
      'rations', 'rations', 'rations', 'rations', 'rations', 'rations', 'rations', 'rations', 'rations', 'rations',
      'waterskin',
      'rope-hempen-50ft',
    ],
  },
  'entertainers-pack': {
    id: 'entertainers-pack',
    name: "Entertainer's Pack",
    category: 'pack',
    cost: { amount: 40, unit: 'gp' },
    weight: 37,
    description: 'Contains everything a traveling performer needs.',
    packContents: [
      'backpack', 'bedroll',
      'costume', 'costume',
      'candle', 'candle', 'candle', 'candle', 'candle',
      'rations', 'rations', 'rations', 'rations', 'rations',
      'waterskin', 'disguise-kit',
    ],
  },
  'burglars-pack': {
    id: 'burglars-pack',
    name: "Burglar's Pack",
    category: 'pack',
    cost: { amount: 16, unit: 'gp' },
    weight: 49,
    description: 'Contains the tools needed for stealth and infiltration.',
    packContents: [
      'backpack',
      'ball-bearings', 'bell', 'candle', 'candle', 'candle', 'candle', 'candle',
      'crowbar', 'hammer',
      'pitons', 'pitons', 'pitons', 'pitons', 'pitons', 'pitons', 'pitons', 'pitons', 'pitons', 'pitons',
      'hooded-lantern', 'oil-flask', 'oil-flask',
      'rations', 'rations', 'rations', 'rations', 'rations',
      'tinderbox', 'waterskin',
      'rope-hempen-50ft',
    ],
  },
  'diplomats-pack': {
    id: 'diplomats-pack',
    name: "Diplomat's Pack",
    category: 'pack',
    cost: { amount: 39, unit: 'gp' },
    weight: 39,
    description: 'Contains items for negotiation and social encounters.',
    packContents: [
      'chest',
      'map-case', 'map-case',
      'fine-clothes',
      'ink', 'ink-pen',
      'lamp', 'oil-flask', 'oil-flask',
      'paper', 'paper', 'paper', 'paper', 'paper',
      'vial-perfume',
      'sealing-wax', 'soap',
    ],
  },
}

// ---------------------------------------------------------------------------
// Ammunition
// ---------------------------------------------------------------------------

const ammunition: Record<string, EquipmentItem> = {
  arrow: {
    id: 'arrow',
    name: 'Arrow',
    category: 'ammunition',
    cost: { amount: 1, unit: 'gp' },
    weight: 0.05,
    description: 'Ammunition for bows. Sold in bundles of 20.',
  },
  'crossbow-bolt': {
    id: 'crossbow-bolt',
    name: 'Crossbow Bolt',
    category: 'ammunition',
    cost: { amount: 1, unit: 'gp' },
    weight: 0.075,
    description: 'Ammunition for crossbows. Sold in bundles of 20.',
  },
  'sling-bullet': {
    id: 'sling-bullet',
    name: 'Sling Bullet',
    category: 'ammunition',
    cost: { amount: 4, unit: 'cp' },
    weight: 0.075,
    description: 'Ammunition for slings. Sold in bundles of 20.',
  },
}

// ---------------------------------------------------------------------------
// Gear (Miscellaneous Adventuring Gear)
// ---------------------------------------------------------------------------

const gear: Record<string, EquipmentItem> = {
  backpack: { id: 'backpack', name: 'Backpack', category: 'gear', cost: { amount: 2, unit: 'gp' }, weight: 5 },
  bedroll: { id: 'bedroll', name: 'Bedroll', category: 'gear', cost: { amount: 1, unit: 'gp' }, weight: 7 },
  blanket: { id: 'blanket', name: 'Blanket', category: 'gear', cost: { amount: 5, unit: 'sp' }, weight: 3 },
  'mess-kit': { id: 'mess-kit', name: 'Mess Kit', category: 'gear', cost: { amount: 2, unit: 'sp' }, weight: 1 },
  tinderbox: { id: 'tinderbox', name: 'Tinderbox', category: 'gear', cost: { amount: 5, unit: 'sp' }, weight: 1 },
  torch: { id: 'torch', name: 'Torch', category: 'gear', cost: { amount: 1, unit: 'cp' }, weight: 1, supply: true },
  waterskin: { id: 'waterskin', name: 'Waterskin', category: 'gear', cost: { amount: 2, unit: 'sp' }, weight: 5 },
  rations: { id: 'rations', name: 'Rations (1 day)', category: 'gear', cost: { amount: 5, unit: 'sp' }, weight: 2, supply: true },
  'rope-hempen-50ft': { id: 'rope-hempen-50ft', name: 'Hempen Rope (50 ft.)', category: 'gear', cost: { amount: 1, unit: 'gp' }, weight: 10 },
  'rope-silk-50ft': { id: 'rope-silk-50ft', name: 'Silk Rope (50 ft.)', category: 'gear', cost: { amount: 10, unit: 'gp' }, weight: 5 },
  'common-clothes': { id: 'common-clothes', name: 'Common Clothes', category: 'gear', cost: { amount: 5, unit: 'sp' }, weight: 3 },
  'fine-clothes': { id: 'fine-clothes', name: 'Fine Clothes', category: 'gear', cost: { amount: 15, unit: 'gp' }, weight: 6 },
  costume: { id: 'costume', name: 'Costume', category: 'gear', cost: { amount: 5, unit: 'gp' }, weight: 4 },
  robe: { id: 'robe', name: 'Robe', category: 'gear', cost: { amount: 1, unit: 'gp' }, weight: 4 },
  vestments: { id: 'vestments', name: 'Vestments', category: 'gear', cost: { amount: 5, unit: 'gp' }, weight: 4 },
  candle: { id: 'candle', name: 'Candle', category: 'gear', cost: { amount: 1, unit: 'cp' }, weight: 0, supply: true },
  'incense-block': { id: 'incense-block', name: 'Block of Incense', category: 'gear', cost: { amount: 2, unit: 'sp' }, weight: 0, supply: true },
  shovel: { id: 'shovel', name: 'Shovel', category: 'gear', cost: { amount: 2, unit: 'gp' }, weight: 5 },
  crowbar: { id: 'crowbar', name: 'Crowbar', category: 'gear', cost: { amount: 2, unit: 'gp' }, weight: 5 },
  hammer: { id: 'hammer', name: 'Hammer', category: 'gear', cost: { amount: 1, unit: 'gp' }, weight: 3 },
  'pitons': { id: 'pitons', name: 'Piton', category: 'gear', cost: { amount: 5, unit: 'cp' }, weight: 0.25 },
  'ball-bearings': { id: 'ball-bearings', name: 'Ball Bearings (bag of 1,000)', category: 'gear', cost: { amount: 1, unit: 'gp' }, weight: 2 },
  bell: { id: 'bell', name: 'Bell', category: 'gear', cost: { amount: 1, unit: 'gp' }, weight: 0 },
  'hooded-lantern': { id: 'hooded-lantern', name: 'Hooded Lantern', category: 'gear', cost: { amount: 5, unit: 'gp' }, weight: 2 },
  'oil-flask': { id: 'oil-flask', name: 'Oil (flask)', category: 'gear', cost: { amount: 1, unit: 'sp' }, weight: 1, supply: true },
  lamp: { id: 'lamp', name: 'Lamp', category: 'gear', cost: { amount: 5, unit: 'sp' }, weight: 1 },
  'alms-box': { id: 'alms-box', name: 'Alms Box', category: 'gear', cost: { amount: 0, unit: 'gp' }, weight: 0 },
  'book-lore': { id: 'book-lore', name: 'Book (Lore)', category: 'gear', cost: { amount: 25, unit: 'gp' }, weight: 5 },
  ink: { id: 'ink', name: 'Ink (1 oz. bottle)', category: 'gear', cost: { amount: 10, unit: 'gp' }, weight: 0 },
  'ink-pen': { id: 'ink-pen', name: 'Ink Pen', category: 'gear', cost: { amount: 2, unit: 'cp' }, weight: 0 },
  parchment: { id: 'parchment', name: 'Parchment (one sheet)', category: 'gear', cost: { amount: 1, unit: 'sp' }, weight: 0 },
  paper: { id: 'paper', name: 'Paper (one sheet)', category: 'gear', cost: { amount: 2, unit: 'sp' }, weight: 0 },
  'little-bag-of-sand': { id: 'little-bag-of-sand', name: 'Little Bag of Sand', category: 'gear', cost: { amount: 0, unit: 'gp' }, weight: 1 },
  'small-knife': { id: 'small-knife', name: 'Small Knife', category: 'gear', cost: { amount: 0, unit: 'gp' }, weight: 0.5 },
  'trophy-from-foe': { id: 'trophy-from-foe', name: 'Trophy from a Fallen Foe', category: 'gear', cost: { amount: 0, unit: 'gp' }, weight: 1 },
  'belt-pouch': { id: 'belt-pouch', name: 'Belt Pouch', category: 'gear', cost: { amount: 5, unit: 'sp' }, weight: 1 },
  quiver: { id: 'quiver', name: 'Quiver', category: 'gear', cost: { amount: 1, unit: 'gp' }, weight: 1 },
  'spellbook': { id: 'spellbook', name: 'Spellbook', category: 'gear', cost: { amount: 50, unit: 'gp' }, weight: 3, description: 'Essential for Wizards to prepare spells.' },
  'disguise-kit': { id: 'disguise-kit', name: 'Disguise Kit', category: 'tool', cost: { amount: 25, unit: 'gp' }, weight: 3 },
  'forgery-kit': { id: 'forgery-kit', name: 'Forgery Kit', category: 'tool', cost: { amount: 15, unit: 'gp' }, weight: 5 },
  'artisans-tools-choice': { id: 'artisans-tools-choice', name: "Artisan's Tools (any)", category: 'tool', cost: { amount: 0, unit: 'gp' }, weight: 5 },
  'chest': { id: 'chest', name: 'Chest', category: 'gear', cost: { amount: 5, unit: 'gp' }, weight: 25 },
  'map-case': { id: 'map-case', name: 'Map or Scroll Case', category: 'gear', cost: { amount: 1, unit: 'gp' }, weight: 1 },
  'vial-perfume': { id: 'vial-perfume', name: 'Vial of Perfume', category: 'gear', cost: { amount: 5, unit: 'gp' }, weight: 0 },
  'sealing-wax': { id: 'sealing-wax', name: 'Sealing Wax', category: 'gear', cost: { amount: 5, unit: 'sp' }, weight: 0 },
  soap: { id: 'soap', name: 'Soap', category: 'gear', cost: { amount: 2, unit: 'cp' }, weight: 0 },
}

// ---------------------------------------------------------------------------
// Trinkets (PHB 2024 Trinket Table — selection list, not random)
// ---------------------------------------------------------------------------

const trinkets: Record<string, EquipmentItem> = {
  'trinket-mummified-goblin-hand': { id: 'trinket-mummified-goblin-hand', name: 'A mummified goblin hand', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.5 },
  'trinket-crystal-knob': { id: 'trinket-crystal-knob', name: 'A small crystal knob from a door', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.5 },
  'trinket-dead-sprite-bottle': { id: 'trinket-dead-sprite-bottle', name: 'A dead sprite inside a clear glass bottle', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.5 },
  'trinket-metal-can': { id: 'trinket-metal-can', name: 'A metal can that has no opening but sounds as if it is filled with liquid', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.5 },
  'trinket-glass-orbit': { id: 'trinket-glass-orbit', name: 'A glass orb filled with moving smoke', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.5 },
  'trinket-egg-shell': { id: 'trinket-egg-shell', name: 'A 1-ounce egg with a bright red shell', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.1 },
  'trinket-pipe-bubbles': { id: 'trinket-pipe-bubbles', name: 'A pipe that blows bubbles', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.5 },
  'trinket-glass-jar': { id: 'trinket-glass-jar', name: 'A glass jar containing a weird bit of flesh floating in pickling fluid', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 1 },
  'trinket-music-box': { id: 'trinket-music-box', name: 'A tiny music box that plays a song you dimly remember from your childhood', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 1 },
  'trinket-skull-mouse': { id: 'trinket-skull-mouse', name: 'The skull of a mouse, with a tiny saddle attached', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.5 },
  'trinket-wooden-dice': { id: 'trinket-wooden-dice', name: 'A set of wooden dice, each face painted with a different animal', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.5 },
  'trinket-leather-pouch': { id: 'trinket-leather-pouch', name: 'A leather pouch filled with dried herbs that smell like home', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.5 },
  'trinket-silver-charm': { id: 'trinket-silver-charm', name: 'A tarnished silver charm in the shape of a crescent moon', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.5 },
  'trinket-clockwork-beetle': { id: 'trinket-clockwork-beetle', name: 'A tiny clockwork beetle that scuttles when wound', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.1 },
  'trinket-wishbone': { id: 'trinket-wishbone', name: 'A wishbone painted gold', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0 },
  'trinket-feather-cap': { id: 'trinket-feather-cap', name: 'A feather from an unknown bird, stuck through a tiny leather cap', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.1 },
  'trinket-neverwrite-ink': { id: 'trinket-neverwrite-ink', name: 'A bottle of invisible ink that can only be read at sunset', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.5 },
  'trinket-dragon-tooth': { id: 'trinket-dragon-tooth', name: 'A dragon\'s tooth, still bloody at the root', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.5 },
  'trinket-petrified-eye': { id: 'trinket-petrified-eye', name: 'A petrified eyeball that slowly swivels to watch you', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.2 },
  'trinket-lock-of-hair': { id: 'trinket-lock-of-hair', name: 'A lock of hair wrapped around a finger bone', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.1 },
  'trinket-candle-wax': { id: 'trinket-candle-wax', name: 'A candle whose flame never goes out in wind, but water extinguishes it instantly', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 1 },
  'trinket-chalk-runes': { id: 'trinket-chalk-runes', name: 'A piece of chalk that writes in glowing runes visible only in moonlight', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0 },
  'trinket-tea-leaves': { id: 'trinket-tea-leaves', name: 'A pouch of tea leaves that, when brewed, always form the same pattern in the cup', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.2 },
  'trinket-wooden-whistle': { id: 'trinket-wooden-whistle', name: 'A wooden whistle that sounds like a scream when blown', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.1 },
  'trinket-pearl-locket': { id: 'trinket-pearl-locket', name: 'A locket containing a tiny portrait that sometimes winks', category: 'trinket', cost: { amount: 0, unit: 'gp' }, weight: 0.5 },
}

// ---------------------------------------------------------------------------
// Exported Lookup Map
// ---------------------------------------------------------------------------

/** Master catalog of all equipment items keyed by their unique ID. */
export const EQUIPMENT_CATALOG: Record<string, EquipmentItem> = {
  ...weapons,
  ...armor,
  ...shields,
  ...foci,
  ...packs,
  ...ammunition,
  ...gear,
  ...trinkets,
}

/** Convenience subset: all weapon items only. */
export const WEAPONS_CATALOG: Record<string, EquipmentItem> = weapons

/** Convenience subset: all armor items only. */
export const ARMOR_CATALOG: Record<string, EquipmentItem> = armor

/** Convenience subset: all trinket items only. */
export const TRINKETS_CATALOG: Record<string, EquipmentItem> = trinkets

/** Convenience subset: all focus items only. */
export const FOCI_CATALOG: Record<string, EquipmentItem> = foci

/** Convenience subset: all pack items only. */
export const PACKS_CATALOG: Record<string, EquipmentItem> = packs