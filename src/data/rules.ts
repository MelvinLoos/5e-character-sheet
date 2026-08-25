// A simplified library of D&D 2024 rules for the Heroes Guild Character Sheet.

// --- Type definitions for the exported rules data ---
// All canonical interfaces are now defined in @/types/rules and re-exported here.

// Re-export types that other files import from this module.
// RulesFeature is aliased as Feature for backward compatibility.
export type {
  RulesFeature as Feature,
  ClassData,
  SpeciesData,
  BackgroundData,
  SpellSlotsByLevel,
  SubChoice,
FeatureChoice,
  FeatureChoiceOption,
  FeatureChoicePrerequisites,
} from '@/types/rules'

// Also import for internal use
import type {
  ClassData,
  SpeciesData,
  BackgroundData,
  SpellSlotsByLevel,
  FeatureChoiceOption,
} from '@/types/rules'
import type { CharacterFeature } from '@/types/character'
import type { AbilityKey, CasterType } from '@/types/enums'

/**
 * Maps a Renown Tier to its equivalent standard D&D 5.5e character level.
 * Used to translate the West Marches "Tiers of Renown" system into
 * standard spell slot / proficiency / hit-dice progression tables.
 */
export const TIER_TO_LEVEL: Record<number, number> = {
  1: 3,
  2: 6,
  3: 10,
}

/**
 * Translates a character's Renown Tier (1-3) into an effective caster level
 * suitable for querying SPELL_SLOT_PROGRESSION, PROFICIENCY_BONUS_PROGRESSION,
 * and other level-keyed rule tables.
 *
 * Returns 3 for any out-of-bounds or unknown tier value.
 */
export function getEffectiveLevel(tier: number): number {
  return TIER_TO_LEVEL[tier] ?? 3
}

export const ABILITIES: Record<string, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

export const SKILLS: Record<string, string> = {
  Acrobatics: 'dex',
  'Animal Handling': 'wis',
  Arcana: 'int',
  Athletics: 'str',
  Deception: 'cha',
  History: 'int',
  Insight: 'wis',
  Intimidation: 'cha',
  Investigation: 'int',
  Medicine: 'wis',
  Nature: 'int',
  Perception: 'wis',
  Performance: 'cha',
  Persuasion: 'cha',
  Religion: 'int',
  'Sleight of Hand': 'dex',
  Stealth: 'dex',
  Survival: 'wis',
}

export const PROFICIENCY_BONUS_PROGRESSION: Record<number, number> = {
  1: 2,
  5: 3,
  9: 4,
  13: 5,
  17: 6,
}

/**
 * Spellcasting feats automatically granted by classes. Classes no longer
 * carry `casterType` on their own features; instead they grant one of these
 * feats when a character selects the class.
 */
export const CLASS_SPELLCASTING_FEATS: Record<string, CharacterFeature> = {
  Bard: {
    title: 'Bard Spellcasting',
    desc: 'You can cast bard spells you know. Charisma is your spellcasting ability.',
    casterType: 'full' as CasterType,
    key: true,
    source: 'Class',
    featureType: 'Class Feature',
  },
  Cleric: {
    title: 'Cleric Spellcasting',
    desc: 'You can cast cleric spells you have prepared. Wisdom is your spellcasting ability.',
    casterType: 'full' as CasterType,
    key: true,
    source: 'Class',
    featureType: 'Class Feature',
  },
  Druid: {
    title: 'Druid Spellcasting',
    desc: 'You can cast druid spells you have prepared. Wisdom is your spellcasting ability.',
    casterType: 'full' as CasterType,
    key: true,
    source: 'Class',
    featureType: 'Class Feature',
  },
  Paladin: {
    title: 'Paladin Spellcasting',
    desc: 'You can cast Paladin spells. Charisma is your spellcasting ability.',
    casterType: 'half' as CasterType,
    key: true,
    source: 'Class',
    featureType: 'Class Feature',
  },
  Ranger: {
    title: 'Ranger Spellcasting',
    desc: 'You can cast ranger spells you know. Wisdom is your spellcasting ability.',
    casterType: 'half' as CasterType,
    key: true,
    source: 'Class',
    featureType: 'Class Feature',
  },
  Sorcerer: {
    title: 'Sorcerer Spellcasting',
    desc: 'You can cast sorcerer spells you know. Charisma is your spellcasting ability.',
    casterType: 'full' as CasterType,
    key: true,
    source: 'Class',
    featureType: 'Class Feature',
  },
  Warlock: {
    title: 'Warlock Pact Magic',
    desc: 'You can cast warlock spells you know. Charisma is your spellcasting ability. You regain all expended spell slots when you finish a short or long rest.',
    casterType: 'pact' as CasterType,
    key: true,
    source: 'Class',
    featureType: 'Class Feature',
  },
  Wizard: {
    title: 'Wizard Spellcasting',
    desc: 'You can cast wizard spells you have prepared. Intelligence is your spellcasting ability.',
    casterType: 'full' as CasterType,
    key: true,
    source: 'Class',
    featureType: 'Class Feature',
  },
}

/**
 * The spellcasting ability used by each spellcasting class.
 * Non-casters are absent; {@link getSpellcastingAbility} falls back to 'int'.
 */
export const CLASS_SPELLCASTING_ABILITY: Record<string, AbilityKey> = {
  Bard: 'cha',
  Cleric: 'wis',
  Druid: 'wis',
  Paladin: 'cha',
  Ranger: 'wis',
  Sorcerer: 'cha',
  Warlock: 'cha',
  Wizard: 'int',
}

/**
 * Resolve the spellcasting ability for a given class name.
 *
 * Returns the mapped {@link AbilityKey} for known spellcaster classes;
 * falls back to `'int'` when the class is not a known spellcaster,
 * or when `className` is `null` / `undefined`.
 */
export function getSpellcastingAbility(
  className: string | null | undefined,
): AbilityKey {
  return (className && CLASS_SPELLCASTING_ABILITY[className]) || 'int'
}

/**
 * Standard feats available in the feat library. These are distinct from
 * class-granted features and can be selected by players in the Feats view.
 */
export const FEATS: CharacterFeature[] = [
  {
    title: 'Magic Initiate',
    desc: 'You learn two cantrips and one 1st-level spell from a class spell list. You can cast the 1st-level spell once per long rest without a spell slot.',
    key: false,
    source: 'Feat',
    featureType: 'General Feat',
    grantsSpells: true,
    grantedSpellLevels: [0, 1],
  },
]

/**
 * Eldritch Invocations catalog — 28 options from the 2024 SRD.
 *
 * Each entry is a FeatureChoiceOption that can be selected by Warlocks
 * (and potentially other classes/feats) when a class defines a featureChoices
 * rule pointing at this catalog.
 */
export const INVOCATIONS: FeatureChoiceOption[] = [
  {
    id: 'agonizing-blast',
    label: 'Agonizing Blast',
    description: "Choose one of your known Warlock cantrips that deals damage. You can add your Charisma modifier to that spell's damage rolls.",
    traits: [{ title: 'Agonizing Blast', desc: "Choose one of your known Warlock cantrips that deals damage. You can add your Charisma modifier to that spell's damage rolls.", key: true }],
    prerequisites: { minLevel: 2, requiresCantrip: 'damage' },
    repeatable: true,
  },
  {
    id: 'armor-of-shadows',
    label: 'Armor of Shadows',
    description: 'You can cast Mage Armor on yourself without expending a spell slot.',
    traits: [{ title: 'Armor of Shadows', desc: 'You can cast Mage Armor on yourself without expending a spell slot.', key: true }],
  },
  {
    id: 'ascendant-step',
    label: 'Ascendant Step',
    description: 'You can cast Levitate on yourself without expending a spell slot.',
    traits: [{ title: 'Ascendant Step', desc: 'You can cast Levitate on yourself without expending a spell slot.', key: true }],
    prerequisites: { minLevel: 5 },
  },
  {
    id: 'devils-sight',
    label: "Devil's Sight",
    description: 'You can see normally in Dim Light and Darkness (both magical and nonmagical) within 120 feet of yourself.',
    traits: [{ title: "Devil's Sight", desc: 'You can see normally in Dim Light and Darkness (both magical and nonmagical) within 120 feet of yourself.', key: true }],
    prerequisites: { minLevel: 2 },
  },
  {
    id: 'devouring-blade',
    label: 'Devouring Blade',
    description: 'The Extra Attack of your Thirsting Blade invocation confers two extra attacks rather than one.',
    traits: [{ title: 'Devouring Blade', desc: 'The Extra Attack of your Thirsting Blade invocation confers two extra attacks rather than one.', key: true }],
    prerequisites: { minLevel: 12, requiresInvocation: 'thirsting-blade' },
  },
  {
    id: 'eldritch-mind',
    label: 'Eldritch Mind',
    description: 'You have Advantage on Constitution saving throws that you make to maintain Concentration.',
    traits: [{ title: 'Eldritch Mind', desc: 'You have Advantage on Constitution saving throws that you make to maintain Concentration.', key: true }],
  },
  {
    id: 'eldritch-smite',
    label: 'Eldritch Smite',
    description: 'Once per turn when you hit a creature with your pact weapon, you can expend a Pact Magic spell slot to deal an extra 1d8 Force damage to the target, plus another 1d8 per level of the spell slot, and you can give the target the Prone condition if it is Huge or smaller.',
    traits: [{ title: 'Eldritch Smite', desc: 'Once per turn when you hit a creature with your pact weapon, you can expend a Pact Magic spell slot to deal an extra 1d8 Force damage to the target, plus another 1d8 per level of the spell slot, and you can give the target the Prone condition if it is Huge or smaller.', key: true }],
    prerequisites: { minLevel: 5, requiresInvocation: 'pact-of-the-blade' },
  },
  {
    id: 'eldritch-spear',
    label: 'Eldritch Spear',
    description: 'Choose one of your known Warlock cantrips that deals damage and has a range of 10+ feet. When you cast that spell, its range increases by a number of feet equal to 30 times your Warlock level.',
    traits: [{ title: 'Eldritch Spear', desc: 'Choose one of your known Warlock cantrips that deals damage and has a range of 10+ feet. When you cast that spell, its range increases by a number of feet equal to 30 times your Warlock level.', key: true }],
    prerequisites: { minLevel: 2, requiresCantrip: 'damage' },
    repeatable: true,
  },
  {
    id: 'fiendish-vigor',
    label: 'Fiendish Vigor',
    description: "You can cast False Life on yourself without expending a spell slot. When you cast the spell with this feature, you don't roll the die for the Temporary Hit Points; you automatically get the highest number on the die.",
    traits: [{ title: 'Fiendish Vigor', desc: "You can cast False Life on yourself without expending a spell slot. When you cast the spell with this feature, you don't roll the die for the Temporary Hit Points; you automatically get the highest number on the die.", key: true }],
    prerequisites: { minLevel: 2 },
  },
  {
    id: 'gaze-of-two-minds',
    label: 'Gaze of Two Minds',
    description: "You can use a Bonus Action to touch a willing creature and perceive through its senses until the end of your next turn. As long as the creature is on the same plane of existence as you, you can take a Bonus Action on subsequent turns to maintain this connection. While perceiving through the other creature's senses, you benefit from any special senses possessed by that creature, and you can cast spells as if you were in your space or the other creature's space if the two of you are within 60 feet of each other.",
    traits: [{ title: 'Gaze of Two Minds', desc: "You can use a Bonus Action to touch a willing creature and perceive through its senses until the end of your next turn. As long as the creature is on the same plane of existence as you, you can take a Bonus Action on subsequent turns to maintain this connection. While perceiving through the other creature's senses, you benefit from any special senses possessed by that creature, and you can cast spells as if you were in your space or the other creature's space if the two of you are within 60 feet of each other.", key: true }],
    prerequisites: { minLevel: 5 },
  },
  {
    id: 'gift-of-the-depths',
    label: 'Gift of the Depths',
    description: 'You can breathe underwater, and you gain a Swim Speed equal to your Speed. You can also cast Water Breathing once without expending a spell slot. You regain the ability to cast it in this way again when you finish a Long Rest.',
    traits: [{ title: 'Gift of the Depths', desc: 'You can breathe underwater, and you gain a Swim Speed equal to your Speed. You can also cast Water Breathing once without expending a spell slot. You regain the ability to cast it in this way again when you finish a Long Rest.', key: true }],
    prerequisites: { minLevel: 5 },
  },
  {
    id: 'gift-of-the-protectors',
    label: 'Gift of the Protectors',
    description: "A new page appears in your Book of Shadows when you conjure it. With your permission, a creature can take an action to write its name on that page, which can contain a number of names equal to your Charisma modifier (minimum of one name). When any creature whose name is on the page is reduced to 0 Hit Points but not killed outright, the creature magically drops to 1 Hit Point instead. Once this magic is triggered, no creature can benefit from it until you finish a Long Rest. As a Magic action, you can erase a name on the page by touching it.",
    traits: [{ title: 'Gift of the Protectors', desc: "A new page appears in your Book of Shadows when you conjure it. With your permission, a creature can take an action to write its name on that page, which can contain a number of names equal to your Charisma modifier (minimum of one name). When any creature whose name is on the page is reduced to 0 Hit Points but not killed outright, the creature magically drops to 1 Hit Point instead. Once this magic is triggered, no creature can benefit from it until you finish a Long Rest. As a Magic action, you can erase a name on the page by touching it.", key: true }],
    prerequisites: { minLevel: 9, requiresInvocation: 'pact-of-the-tome' },
  },
  {
    id: 'investment-of-the-chain-master',
    label: 'Investment of the Chain Master',
    description: 'When you cast Find Familiar, you infuse the summoned familiar with a measure of your eldritch power, granting the creature the following benefits. Aerial or Aquatic: The familiar gains either a Fly Speed or a Swim Speed (your choice) of 40 feet. Quick Attack: As a Bonus Action, you can command the familiar to take the Attack action. Necrotic or Radiant Damage: Whenever the familiar deals Bludgeoning, Piercing, or Slashing damage, you can make it deal Necrotic or Radiant damage instead. Your Save DC: If the familiar forces a creature to make a saving throw, it uses your spell save DC. Resistance: When the familiar takes damage, you can take a Reaction to grant it Resistance against that damage.',
    traits: [{ title: 'Investment of the Chain Master', desc: 'When you cast Find Familiar, you infuse the summoned familiar with a measure of your eldritch power, granting the creature the following benefits. Aerial or Aquatic: The familiar gains either a Fly Speed or a Swim Speed (your choice) of 40 feet. Quick Attack: As a Bonus Action, you can command the familiar to take the Attack action. Necrotic or Radiant Damage: Whenever the familiar deals Bludgeoning, Piercing, or Slashing damage, you can make it deal Necrotic or Radiant damage instead. Your Save DC: If the familiar forces a creature to make a saving throw, it uses your spell save DC. Resistance: When the familiar takes damage, you can take a Reaction to grant it Resistance against that damage.', key: true }],
    prerequisites: { minLevel: 5, requiresInvocation: 'pact-of-the-chain' },
  },
  {
    id: 'lessons-of-the-first-ones',
    label: 'Lessons of the First Ones',
    description: 'You have received knowledge from an elder entity of the multiverse, allowing you to gain one Origin feat of your choice.',
    traits: [{ title: 'Lessons of the First Ones', desc: 'You have received knowledge from an elder entity of the multiverse, allowing you to gain one Origin feat of your choice.', key: true }],
    prerequisites: { minLevel: 2 },
    repeatable: true,
  },
  {
    id: 'lifedrinker',
    label: 'Lifedrinker',
    description: 'Once per turn when you hit a creature with your pact weapon, you can deal an extra 1d6 Necrotic, Psychic, or Radiant damage (your choice) to the creature, and you can expend one of your Hit Point Dice to roll it and regain a number of Hit Points equal to the roll plus your Constitution modifier (minimum of 1 Hit Point).',
    traits: [{ title: 'Lifedrinker', desc: 'Once per turn when you hit a creature with your pact weapon, you can deal an extra 1d6 Necrotic, Psychic, or Radiant damage (your choice) to the creature, and you can expend one of your Hit Point Dice to roll it and regain a number of Hit Points equal to the roll plus your Constitution modifier (minimum of 1 Hit Point).', key: true }],
    prerequisites: { minLevel: 9, requiresInvocation: 'pact-of-the-blade' },
  },
  {
    id: 'mask-of-many-faces',
    label: 'Mask of Many Faces',
    description: 'You can cast Disguise Self without expending a spell slot.',
    traits: [{ title: 'Mask of Many Faces', desc: 'You can cast Disguise Self without expending a spell slot.', key: true }],
    prerequisites: { minLevel: 2 },
  },
  {
    id: 'master-of-myriad-forms',
    label: 'Master of Myriad Forms',
    description: 'You can cast Alter Self without expending a spell slot.',
    traits: [{ title: 'Master of Myriad Forms', desc: 'You can cast Alter Self without expending a spell slot.', key: true }],
    prerequisites: { minLevel: 5 },
  },
  {
    id: 'misty-visions',
    label: 'Misty Visions',
    description: 'You can cast Silent Image without expending a spell slot.',
    traits: [{ title: 'Misty Visions', desc: 'You can cast Silent Image without expending a spell slot.', key: true }],
    prerequisites: { minLevel: 2 },
  },
  {
    id: 'one-with-shadows',
    label: 'One with Shadows',
    description: "While you're in an area of Dim Light or Darkness, you can cast Invisibility on yourself without expending a spell slot.",
    traits: [{ title: 'One with Shadows', desc: "While you're in an area of Dim Light or Darkness, you can cast Invisibility on yourself without expending a spell slot.", key: true }],
    prerequisites: { minLevel: 5 },
  },
  {
    id: 'otherworldly-leap',
    label: 'Otherworldly Leap',
    description: 'You can cast Jump on yourself without expending a spell slot.',
    traits: [{ title: 'Otherworldly Leap', desc: 'You can cast Jump on yourself without expending a spell slot.', key: true }],
    prerequisites: { minLevel: 2 },
  },
  {
    id: 'pact-of-the-blade',
    label: 'Pact of the Blade',
    description: "As a Bonus Action, you can conjure a pact weapon in your hand—a Simple or Martial Melee weapon of your choice with which you bond—or create a bond with a magic weapon you touch; you can't bond with a magic weapon if someone else is attuned to it or another Warlock is bonded with it. Until the bond ends, you have proficiency with the weapon, and you can use it as a Spellcasting Focus. Whenever you attack with the bonded weapon, you can use your Charisma modifier for the attack and damage rolls instead of using Strength or Dexterity; and you can cause the weapon to deal Necrotic, Psychic, or Radiant damage or its normal damage type. Your bond with the weapon ends if you use this feature's Bonus Action again, if the weapon is more than 5 feet away from you for 1 minute or more, or if you die. A conjured weapon disappears when the bond ends.",
    traits: [{ title: 'Pact of the Blade', desc: "As a Bonus Action, you can conjure a pact weapon in your hand—a Simple or Martial Melee weapon of your choice with which you bond—or create a bond with a magic weapon you touch. Until the bond ends, you have proficiency with the weapon, you can use it as a Spellcasting Focus, and you can use your Charisma modifier for attack and damage rolls. You can also cause the weapon to deal Necrotic, Psychic, or Radiant damage instead of its normal damage type.", key: true }],
  },
  {
    id: 'pact-of-the-chain',
    label: 'Pact of the Chain',
    description: 'You learn the Find Familiar spell and can cast it as a Magic action without expending a spell slot. When you cast the spell, you choose one of the normal forms for your familiar or one of the following special forms: Imp, Pseudodragon, Quasit, Skeleton, Sphinx of Wonder, Sprite, or Venomous Snake. Additionally, when you take the Attack action, you can forgo one of your own attacks to allow your familiar to make one attack of its own with its Reaction.',
    traits: [{ title: 'Pact of the Chain', desc: 'You learn the Find Familiar spell and can cast it as a Magic action without expending a spell slot. You can choose special familiar forms: Imp, Pseudodragon, Quasit, Skeleton, Sphinx of Wonder, Sprite, or Venomous Snake. Additionally, when you take the Attack action, you can forgo one of your own attacks to allow your familiar to make one attack with its Reaction.', key: true }],
  },
  {
    id: 'pact-of-the-tome',
    label: 'Pact of the Tome',
    description: "Stitching together strands of shadow, you conjure forth a book in your hand at the end of a Short or Long Rest. This Book of Shadows (you determine its appearance) contains eldritch magic that only you can access, granting you the benefits below. The book disappears if you conjure another book with this feature or if you die. Cantrips and Rituals: When the book appears, choose three cantrips, and choose two level 1 spells that have the Ritual tag. The spells can be from any class's spell list, and they must be spells you don't already have prepared. While the book is on your person, you have the chosen spells prepared, and they function as Warlock spells for you. Spellcasting Focus: You can use the book as a Spellcasting Focus.",
    traits: [{ title: 'Pact of the Tome', desc: "You conjure a Book of Shadows at the end of a Short or Long Rest. When the book appears, choose three cantrips and two level 1 Ritual spells from any class's spell list (that you don't already have prepared). While the book is on your person, you have the chosen spells prepared and they function as Warlock spells for you. You can use the book as a Spellcasting Focus.", key: true }],
  },
  {
    id: 'repelling-blast',
    label: 'Repelling Blast',
    description: 'Choose one of your known Warlock cantrips that requires an attack roll. When you hit a Large or smaller creature with that cantrip, you can push the creature up to 10 feet straight away from you.',
    traits: [{ title: 'Repelling Blast', desc: 'Choose one of your known Warlock cantrips that requires an attack roll. When you hit a Large or smaller creature with that cantrip, you can push the creature up to 10 feet straight away from you.', key: true }],
    prerequisites: { minLevel: 2, requiresCantrip: 'attack-roll' },
    repeatable: true,
  },
  {
    id: 'thirsting-blade',
    label: 'Thirsting Blade',
    description: 'You gain the Extra Attack feature for your pact weapon only. With that feature, you can attack twice with the weapon instead of once when you take the Attack action on your turn.',
    traits: [{ title: 'Thirsting Blade', desc: 'You gain the Extra Attack feature for your pact weapon only. With that feature, you can attack twice with the weapon instead of once when you take the Attack action on your turn.', key: true }],
    prerequisites: { minLevel: 5, requiresInvocation: 'pact-of-the-blade' },
  },
  {
    id: 'visions-of-distant-realms',
    label: 'Visions of Distant Realms',
    description: 'You can cast Arcane Eye without expending a spell slot.',
    traits: [{ title: 'Visions of Distant Realms', desc: 'You can cast Arcane Eye without expending a spell slot.', key: true }],
    prerequisites: { minLevel: 9 },
  },
  {
    id: 'whispers-of-the-grave',
    label: 'Whispers of the Grave',
    description: 'You can cast Speak with Dead without expending a spell slot.',
    traits: [{ title: 'Whispers of the Grave', desc: 'You can cast Speak with Dead without expending a spell slot.', key: true }],
    prerequisites: { minLevel: 7 },
  },
  {
    id: 'witch-sight',
    label: 'Witch Sight',
    description: 'You have Truesight with a range of 30 feet.',
    traits: [{ title: 'Witch Sight', desc: 'You have Truesight with a range of 30 feet.', key: true }],
    prerequisites: { minLevel: 15 },
  },
]

export const SPELL_SLOT_PROGRESSION: Record<string, SpellSlotsByLevel> = {
  full: {
    1: { level1: 2 },
    2: { level1: 3 },
    3: { level1: 4, level2: 2 },
    4: { level1: 4, level2: 3 },
    5: { level1: 4, level2: 3, level3: 2 },
    6: { level1: 4, level2: 3, level3: 3 },
    7: { level1: 4, level2: 3, level3: 3, level4: 1 },
    8: { level1: 4, level2: 3, level3: 3, level4: 2 },
    9: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 1 },
    10: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2 },
    11: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1 },
    12: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1 },
    13: {
      level1: 4,
      level2: 3,
      level3: 3,
      level4: 3,
      level5: 2,
      level6: 1,
      level7: 1,
    },
    14: {
      level1: 4,
      level2: 3,
      level3: 3,
      level4: 3,
      level5: 2,
      level6: 1,
      level7: 1,
    },
    15: {
      level1: 4,
      level2: 3,
      level3: 3,
      level4: 3,
      level5: 2,
      level6: 1,
      level7: 1,
      level8: 1,
    },
    16: {
      level1: 4,
      level2: 3,
      level3: 3,
      level4: 3,
      level5: 2,
      level6: 1,
      level7: 1,
      level8: 1,
    },
    17: {
      level1: 4,
      level2: 3,
      level3: 3,
      level4: 3,
      level5: 2,
      level6: 1,
      level7: 1,
      level8: 1,
      level9: 1,
    },
    18: {
      level1: 4,
      level2: 3,
      level3: 3,
      level4: 3,
      level5: 3,
      level6: 1,
      level7: 1,
      level8: 1,
      level9: 1,
    },
    19: {
      level1: 4,
      level2: 3,
      level3: 3,
      level4: 3,
      level5: 3,
      level6: 2,
      level7: 1,
      level8: 1,
      level9: 1,
    },
    20: {
      level1: 4,
      level2: 3,
      level3: 3,
      level4: 3,
      level5: 3,
      level6: 2,
      level7: 2,
      level8: 1,
      level9: 1,
    },
  },
  half: {
    1: { level1: 2 },
    2: { level1: 2 },
    3: { level1: 3 },
    4: { level1: 3 },
    5: { level1: 4, level2: 2 },
    6: { level1: 4, level2: 2 },
    7: { level1: 4, level2: 3 },
    8: { level1: 4, level2: 3 },
    9: { level1: 4, level2: 3, level3: 2 },
    10: { level1: 4, level2: 3, level3: 2 },
    11: { level1: 4, level2: 3, level3: 3 },
    12: { level1: 4, level2: 3, level3: 3 },
    13: { level1: 4, level2: 3, level3: 3, level4: 1 },
    14: { level1: 4, level2: 3, level3: 3, level4: 1 },
    15: { level1: 4, level2: 3, level3: 3, level4: 2 },
    16: { level1: 4, level2: 3, level3: 3, level4: 2 },
    17: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 1 },
    18: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 1 },
    19: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2 },
    20: { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2 },
  },
  third: {
    1: {},
    2: {},
    3: { level1: 2 },
    4: { level1: 3 },
    5: { level1: 3 },
    6: { level1: 3 },
    7: { level1: 4, level2: 2 },
    8: { level1: 4, level2: 2 },
    9: { level1: 4, level2: 2 },
    10: { level1: 4, level2: 3 },
    11: { level1: 4, level2: 3 },
    12: { level1: 4, level2: 3 },
    13: { level1: 4, level2: 3, level3: 2 },
    14: { level1: 4, level2: 3, level3: 2 },
    15: { level1: 4, level2: 3, level3: 2 },
    16: { level1: 4, level2: 3, level3: 3 },
    17: { level1: 4, level2: 3, level3: 3 },
    18: { level1: 4, level2: 3, level3: 3 },
    19: { level1: 4, level2: 3, level3: 3, level4: 1 },
    20: { level1: 4, level2: 3, level3: 3, level4: 1 },
  },
  pact: {
    1: { level1: 1 },
    2: { level1: 2 },
    3: { level2: 2 },
    4: { level2: 2 },
    5: { level3: 2 },
    6: { level3: 2 },
    7: { level4: 2 },
    8: { level4: 2 },
    9: { level5: 2 },
    10: { level5: 2 },
    11: { level5: 3 },
    12: { level5: 3 },
    13: { level5: 3 },
    14: { level5: 3 },
    15: { level5: 3 },
    16: { level5: 3 },
    17: { level5: 4 },
    18: { level5: 4 },
    19: { level5: 4 },
    20: { level5: 4 },
  },
}

export const CLASSES: Record<string, ClassData> = {
  Barbarian: {
    description: 'A fierce warrior who can enter a battle rage.',
    hitDice: 12,
    hitDiceAverage: 7,
    savingThrows: ['str', 'con'],
    skillChoices: {
      count: 2,
      from: ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'],
    },
    features: [
      {
        title: 'Rage',
        desc: 'As a bonus action, you can enter a rage. You gain advantage on Strength checks and saves, +2 damage on melee Strength attacks, and resistance to bludgeoning, piercing, and slashing damage. Your rage lasts for 1 minute.',
        uses: { total: 2, per: 'Long Rest' },
        key: true,
      },
      {
        title: 'Unarmored Defense (Barbarian)',
        desc: 'While you are not wearing any armor, your Armor Class equals 10 + your Dexterity modifier + your Constitution modifier.',
        key: false,
      },
    ],
  },
  Bard: {
    description: 'An inspiring magician whose power echoes the music of creation.',
    hitDice: 8,
    hitDiceAverage: 5,
    savingThrows: ['dex', 'cha'],
    skillChoices: {
      count: 3,
      from: 'any',
    },
    features: [
      {
        title: 'Bardic Inspiration',
        desc: 'As a bonus action, you can give one creature a d6 inspiration die. Once within 10 minutes, the creature can roll the die and add the number to one ability check, attack roll, or saving throw.',
        uses: { total: 3, per: 'Long Rest' },
        key: true,
      },
    ],
  },
  Cleric: {
    description: 'A priestly champion who wields divine magic in service of a higher power.',
    hitDice: 8,
    hitDiceAverage: 5,
    savingThrows: ['wis', 'cha'],
    skillChoices: {
      count: 2,
      from: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'],
    },
    features: [
      {
        title: 'Channel Divinity',
        desc: 'You can channel divine energy to fuel magical effects. You start with one effect: Turn Undead.',
        uses: { total: 1, per: 'Short Rest' },
        key: true,
      },
    ],
  },
  Druid: {
    description:
      'A priest of the Old Faith, wielding the powers of nature and adopting animal forms.',
    hitDice: 8,
    hitDiceAverage: 5,
    savingThrows: ['int', 'wis'],
    skillChoices: {
      count: 2,
      from: [
        'Animal Handling',
        'Arcana',
        'Insight',
        'Medicine',
        'Nature',
        'Perception',
        'Religion',
        'Survival',
      ],
    },
    features: [
      {
        title: 'Wild Shape',
        desc: 'As an action, you can magically assume the shape of a beast you have seen before. You can use this feature twice.',
        uses: { total: 2, per: 'Short Rest' },
        key: true,
      },
    ],
  },
  Fighter: {
    description: 'A master of martial combat, skilled with a variety of weapons and armor.',
    hitDice: 10,
    hitDiceAverage: 6,
    savingThrows: ['str', 'con'],
    skillChoices: {
      count: 2,
      from: [
        'Acrobatics',
        'Animal Handling',
        'Athletics',
        'History',
        'Insight',
        'Intimidation',
        'Perception',
        'Persuasion',
        'Survival',
      ],
    },
    features: [
      {
        title: 'Second Wind',
        desc: 'On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level.',
        uses: { total: 1, per: 'Short Rest' },
        key: true,
      },
    ],
    featureChoices: [
      {
        id: 'fighting-style',
        label: 'Fighting Style',
        description: 'You gain a Fighting Style feat of your choice.',
        count: 1,
        options: [
          {
            id: 'defense',
            label: 'Defense',
            description: 'While wearing armor, you gain a +1 bonus to AC.',
            traits: [
              {
                title: 'Fighting Style: Defense',
                desc: 'While you are wearing armor, you gain a +1 bonus to AC.',
                key: false,
                featureType: 'Class Feature',
              },
            ],
          },
          {
            id: 'dueling',
            label: 'Dueling',
            description: 'When wielding a melee weapon in one hand and no other weapons, you gain +2 to damage rolls.',
            traits: [
              {
                title: 'Fighting Style: Dueling',
                desc: 'When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.',
                key: false,
                featureType: 'Class Feature',
              },
            ],
          },
          {
            id: 'great-weapon-fighting',
            label: 'Great Weapon Fighting',
            description: 'Reroll 1s and 2s on damage dice for two-handed weapons.',
            traits: [
              {
                title: 'Fighting Style: Great Weapon Fighting',
                desc: 'When you roll damage for an attack you make with a melee weapon that you are wielding with two hands, you can reroll any 1 or 2 on a damage die. You must use the new roll, even if it is a 1 or a 2.',
                key: false,
                featureType: 'Class Feature',
              },
            ],
          },
        ],
      },
      {
        id: 'fighter-subclass',
        label: 'Martial Archetype',
        description: 'You choose a Martial Archetype that defines your combat style. Your choice grants you features at level 3, and again at levels 7, 10, 15, and 18.',
        count: 1,
        options: [
          {
            id: 'champion',
            label: 'Champion',
            description: 'The Champion focuses on the development of raw physical power honed to deadly perfection.',
            traits: [
              {
                title: 'Improved Critical',
                desc: 'Your weapon attacks score a critical hit on a roll of 19 or 20.',
                key: true,
                minTier: 1,
                featureType: 'Class Feature',
              },
              {
                title: 'Remarkable Athlete',
                desc: "You can add half your Proficiency Bonus (round up) to any Strength, Dexterity, or Constitution check you make that doesn't already use your Proficiency Bonus. In addition, when you make a running long jump, the distance you can cover increases by a number of feet equal to your Strength modifier.",
                key: true,
                minTier: 1,
                featureType: 'Class Feature',
              },
              {
                title: 'Additional Fighting Style',
                desc: 'You can choose a second option from the Fighting Style class feature.',
                key: true,
                minTier: 2,
                featureType: 'Class Feature',
              },
              {
                title: 'Heroic Warrior',
                desc: 'When you have to make a death saving throw at the start of your turn, you can instead regain hit points equal to 5 + your Constitution modifier and spring to your feet. You cannot use this feature again until you finish a Long Rest.',
                key: true,
                minTier: 3,
                featureType: 'Class Feature',
                uses: { total: 1, per: 'Long Rest' },
              },
              {
                title: 'Superior Critical',
                desc: 'Your weapon attacks score a critical hit on a roll of 18–20.',
                key: true,
                minTier: 4,
                featureType: 'Class Feature',
              },
              {
                title: 'Survivor',
                desc: "At the start of each of your turns, you regain hit points equal to 5 + your Constitution modifier if you have no more than half of your hit points left. You don't gain this benefit if you have 0 hit points.",
                key: true,
                minTier: 4,
                featureType: 'Class Feature',
              },
            ],
          },
        ],
      },
    ],
  },
  Monk: {
    description:
      'A master of martial arts, harnessing the power of the body in pursuit of physical and spiritual perfection.',
    hitDice: 8,
    hitDiceAverage: 5,
    savingThrows: ['str', 'dex'],
    skillChoices: {
      count: 2,
      from: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'],
    },
    features: [
      {
        title: 'Martial Arts',
        desc: 'You gain the following benefits while unarmed or wielding only Monk weapons: you can use Dexterity instead of Strength for attack and damage rolls; your unarmed strikes deal 1d6 Bludgeoning damage; and when you take the Attack action, you can make one unarmed strike as a bonus action.',
        key: true,
      },
      {
        title: 'Unarmored Defense',
        desc: 'While you are not wearing armor or wielding a shield, your Armor Class equals 10 plus your Dexterity modifier plus your Wisdom modifier.',
        key: false,
      },
      {
        title: "Monk's Focus",
        desc: 'You have 2 Focus Points. You can spend these points to use Flurry of Blows, Patient Defense, and Step of the Wind.',
        uses: { total: 2, per: 'Short Rest' },
        key: true,
      },
      {
        title: 'Unarmored Movement',
        desc: 'Your speed increases by 10 feet while you are not wearing armor or wielding a shield.',
        key: false,
      },
      {
        title: 'Deflect Attacks',
        desc: 'When an attack roll hits you and its damage includes Bludgeoning, Piercing, or Slashing damage, you can take a Reaction to reduce the attack\'s damage by 1d10 + your Dexterity modifier + your Monk level. If you reduce the damage to 0, you can spend 1 Focus Point to redirect the attack.',
        key: true,
      },
      {
        title: 'Monk Subclass',
        desc: 'You choose a Monastic Tradition, which grants you features at level 3, and again at levels 6, 11, and 17.',
        key: true,
      },
    ],
    featureChoices: [
      {
        id: 'monk-subclass',
        label: 'Monastic Tradition',
        description: 'You choose a Monastic Tradition that defines your martial arts practice. Your choice grants you features at level 3, and again at levels 6, 11, and 17.',
        count: 1,
        options: [
          {
            id: 'warrior-of-the-open-hand',
            label: 'Warrior of the Open Hand',
            description: 'Warriors of the Open Hand are masters of unarmed combat, using their ki to manipulate their enemies\' bodies.',
            traits: [
              {
                title: 'Open Hand Technique',
                desc: 'Whenever you hit a creature with one of the attacks granted by your Flurry of Blows, you can impose one of the following effects on that target: it must succeed on a Dexterity saving throw or be knocked prone; it must make a Strength saving throw or be pushed up to 15 feet away from you; or it can\'t take reactions until the end of your next turn.',
                key: true,
                minTier: 1,
                featureType: 'Class Feature',
              },
              {
                title: 'Wholeness of Body',
                desc: 'As an action, you can regain hit points equal to three times your Monk level. You must finish a Long Rest before you can use this feature again.',
                key: true,
                minTier: 2,
                featureType: 'Class Feature',
                uses: { total: 1, per: 'Long Rest' },
              },
              {
                title: 'Fleet Step',
                desc: 'When a creature you can see ends its turn within 5 feet of you, you can use your Reaction to move up to half your speed without provoking Opportunity Attacks.',
                key: true,
                minTier: 4,
                featureType: 'Class Feature',
              },
              {
                title: 'Quivering Palm',
                desc: 'When you hit a creature with an unarmed strike, you can spend 3 Focus Points to start imperceptible vibrations in the target, which last for a number of days equal to your Monk level. As an action, you can end the vibrations harmlessly, or the target must make a Constitution saving throw or take 10d12 Necrotic damage (half on a save). You can have only one creature under the effect of this feature at a time.',
                key: true,
                minTier: 4,
                featureType: 'Class Feature',
                uses: { total: 1, per: 'Long Rest' },
              },
            ],
          },
        ],
      },
    ],
  },
  Paladin: {
    description:
      'A holy warrior bound to a sacred oath, combining martial prowess with divine magic.',
    hitDice: 10,
    hitDiceAverage: 6,
    savingThrows: ['wis', 'cha'],
    skillChoices: {
      count: 2,
      from: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'],
    },
    features: [
      {
        title: 'Lay on Hands',
        desc: 'You have a pool of healing power equal to your Paladin level × 5. As a Magic action, you can touch a creature and draw from the pool to restore hit points or cure the Poisoned condition.',
        key: true,
      },
      {
        title: 'Weapon Mastery',
        desc: 'Your training with weapons allows you to use the Mastery property of two kinds of Simple or Martial Melee weapons of your choice. Whenever you finish a Long Rest, you can change the kinds of weapons you chose.',
        key: true,
      },
      {
        title: "Paladin's Smite",
        desc: 'You always have the Divine Smite spell prepared. You can cast it once without expending a spell slot, regaining the ability to do so when you finish a Long Rest.',
        uses: { total: 1, per: 'Long Rest' },
        key: true,
      },
      {
        title: 'Fighting Style',
        desc: 'You gain a Fighting Style feat of your choice.',
        key: true,
      },
      {
        title: 'Channel Divinity',
        desc: 'You can channel divine energy directly from the Outer Planes. You start with two options: Divine Sense and an option from your subclass. You can use this feature twice, regaining expended uses on a Short or Long Rest.',
        uses: { total: 2, per: 'Short or Long Rest' },
        key: true,
      },
      {
        title: 'Paladin Subclass',
        desc: 'You choose a Paladin Oath, which grants you specific features at level 3, and again at levels 7, 15, and 20.',
        key: true,
      },
    ],
    featureChoices: [
      {
        id: 'paladin-oath',
        label: 'Sacred Oath',
        description: 'You swear a Sacred Oath that defines your code of conduct and grants you features at level 3, and again at levels 7, 15, and 20.',
        count: 1,
        options: [
          {
            id: 'oath-of-devotion',
            label: 'Oath of Devotion',
            description: 'Knights of the Oath of Devotion hold themselves to the highest ideals of justice, virtue, and order.',
            traits: [
              {
                title: 'Sacred Weapon',
                desc: 'As an action, you can imbue one weapon that you are holding with positive energy. For 1 minute, you add your Charisma modifier to attack rolls made with that weapon (minimum +1). The weapon also emits bright light for 20 feet and dim light for 20 feet beyond that. You can end this effect on your turn as a Bonus Action. You can use this feature a number of times equal to your Charisma modifier (minimum once), regaining expended uses on a Long Rest.',
                key: true,
                minTier: 1,
                featureType: 'Class Feature',
                uses: { total: 1, per: 'Long Rest' },
              },
              {
                title: 'Oath Spells (Devotion)',
                desc: 'You always have the spells Protection from Evil and Good, Sanctuary, Lesser Restoration, Zone of Truth, Beacon of Hope, and Dispel Magic prepared. Charisma is your spellcasting ability for these spells.',
                key: true,
                minTier: 1,
                featureType: 'Class Feature',
              },
              {
                title: 'Aura of Devotion',
                desc: 'You and friendly creatures within 10 feet of you can\'t be Charmed while you are conscious.',
                key: true,
                minTier: 2,
                featureType: 'Class Feature',
              },
              {
                title: 'Smite of Protection',
                desc: 'When you use your Divine Smite, you can choose to forego the extra damage. If you do, the target must make a Wisdom saving throw or be unable to take hostile actions (attacks, damaging spells/abilities) against you until the end of your next turn.',
                key: true,
                minTier: 4,
                featureType: 'Class Feature',
              },
              {
                title: 'Holy Nimbus',
                desc: 'As an action, you can emit an aura of sunlight. For 1 minute, bright light shines from you in a 30-foot radius, and dim light shines 30 feet beyond that. Whenever an enemy creature starts its turn in the bright light, it takes 10 Radiant damage. You can use this feature once, regaining the ability to do so on a Long Rest.',
                key: true,
                minTier: 4,
                featureType: 'Class Feature',
                uses: { total: 1, per: 'Long Rest' },
              },
            ],
          },
        ],
      },
    ],
  },
  Ranger: {
    description:
      'A warrior who uses martial prowess and nature magic to combat threats on the edges of civilization.',
    hitDice: 10,
    hitDiceAverage: 6,
    savingThrows: ['str', 'dex'],
    skillChoices: {
      count: 3,
      from: [
        'Animal Handling',
        'Athletics',
        'Insight',
        'Investigation',
        'Nature',
        'Perception',
        'Stealth',
        'Survival',
      ],
    },
    features: [
      {
        title: 'Favored Enemy',
        desc: 'You have significant experience studying, tracking, hunting, and even talking to a certain type of enemy. Choose a type of favored enemy: beasts, fey, humanoids, monstrosities, or undead. You have advantage on Wisdom (Survival) checks to track your favored enemies, as well as on Intelligence checks to recall information about them.',
        key: false,
      },
    ],
    featureChoices: [
      {
        id: 'ranger-conclave',
        label: 'Ranger Conclave',
        description: 'You choose a Ranger Conclave that embodies your ideals and grants you features at level 3, and again at levels 7, 11, and 15.',
        count: 1,
        options: [
          {
            id: 'hunter',
            label: 'Hunter',
            description: 'Hunters seek to protect civilization from the terrors of the wilderness, specializing in fighting the most dangerous threats.',
            traits: [
              {
                title: "Hunter's Lore",
                desc: 'You can call on your knowledge of monsters to better fight them. You learn Hunter\'s Mark, and you can cast it without expending a spell slot. You can cast it this way a number of times equal to your Wisdom modifier (minimum once), regaining all expended uses on a Long Rest. Charisma is your spellcasting ability for this spell.',
                key: true,
                minTier: 1,
                featureType: 'Class Feature',
              },
              {
                title: "Hunter's Prey",
                desc: 'You gain one of the following features of your choice: Colossus Slayer (once per turn, deal +1d8 damage to a creature below its hit point maximum), Giant Killer (when a Large or larger creature within 5 feet hits or misses you, use your Reaction to attack it), or Horde Breaker (once per turn, make an additional attack against a different creature within 5 feet of the original target).',
                key: true,
                minTier: 1,
                featureType: 'Class Feature',
              },
              {
                title: 'Defensive Tactics',
                desc: 'You gain one of the following features of your choice: Escape the Horde (Opportunity Attacks against you have Disadvantage), Multiattack Defense (when hit by an attack, gain +4 AC against subsequent attacks from that creature for the rest of the turn), or Steel Will (you have Advantage on saving throws against being Frightened).',
                key: true,
                minTier: 2,
                featureType: 'Class Feature',
              },
              {
                title: "Superior Hunter's Prey",
                desc: 'You can choose a second option from the Hunter\'s Prey feature. Alternatively, all damage from your Colossus Slayer, Giant Killer, or Horde Breaker features increases by one damage die size.',
                key: true,
                minTier: 4,
                featureType: 'Class Feature',
              },
              {
                title: "Superior Hunter's Defense",
                desc: 'You gain one of the following features of your choice: Evasion (when subjected to a Dexterity saving throw for half damage, take no damage on a success and half on a failure), Stand Against the Tide (when a creature misses you with a melee attack, use your Reaction to force it to repeat the attack against another creature of your choice), or Uncanny Dodge (when an attacker you can see hits you, use your Reaction to halve the damage).',
                key: true,
                minTier: 4,
                featureType: 'Class Feature',
              },
            ],
          },
        ],
      },
    ],
  },
  Rogue: {
    description: 'A scoundrel who uses stealth and trickery to overcome obstacles and enemies.',
    hitDice: 8,
    hitDiceAverage: 5,
    savingThrows: ['dex', 'int'],
    skillChoices: {
      count: 4,
      from: [
        'Acrobatics',
        'Athletics',
        'Deception',
        'Insight',
        'Intimidation',
        'Investigation',
        'Perception',
        'Persuasion',
        'Sleight of Hand',
        'Stealth',
      ],
    },
    features: [
      {
        title: 'Sneak Attack',
        desc: 'Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll. The attack must use a finesse or a ranged weapon.',
        key: true,
      },
      {
        title: "Thieves' Cant",
        desc: 'You know the secret mix of dialect, jargon, and code that allows you to hide messages in seemingly normal conversation.',
        key: false,
      },
    ],
    featureChoices: [
      {
        id: 'rogue-subclass',
        label: 'Rogue Subclass',
        description: 'Choose a Rogue subclass. Your choice grants you features at Rogue level 3 and again at levels 9, 13, and 17.',
        count: 1,
        options: [
          {
            id: 'thief',
            label: 'Thief',
            description: 'You focus on agility and cunning. The classic rogue, quick hands and quicker wits.',
            traits: [
              { title: 'Fast Hands', desc: "You can use the bonus action granted by your Cunning Action to make a Dexterity (Sleight of Hand) check, use your thieves' tools to disarm a trap or open a lock, or take the Use an Object action.", key: true, featureType: 'Class Feature', minTier: 1 },
              { title: 'Second-Story Work', desc: 'You gain the ability to climb faster than normal; climbing no longer costs you extra movement. In addition, when you make a running jump, the distance you cover increases by a number of feet equal to your Dexterity modifier.', key: false, featureType: 'Class Feature', minTier: 1 },
              { title: 'Supreme Sneak', desc: 'You have advantage on a Dexterity (Stealth) check if you move no more than half your speed on the same turn.', key: true, featureType: 'Class Feature', minTier: 3 },
              { title: 'Use Magic Device', desc: 'You have learned enough about the workings of magic that you can improvise the use of items even when they are not intended for you. You ignore all class, race, and level requirements on the use of magic items.', key: true, featureType: 'Class Feature', minTier: 4 },
              { title: "Thief's Reflexes", desc: "You can take two turns during the first round of any combat. You take your first turn at your normal initiative and your second turn at your initiative minus 10. You can't use this feature when you are surprised.", key: true, featureType: 'Class Feature', minTier: 4 },
            ],
          },
        ],
      },
    ],
  },
  Sorcerer: {
    description: 'A spellcaster who draws on inherent magic from a gift or bloodline.',
    hitDice: 6,
    hitDiceAverage: 4,
    savingThrows: ['con', 'cha'],
    skillChoices: {
      count: 2,
      from: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'],
    },
    features: [],
    featureChoices: [
      {
        id: 'sorcerer-origin',
        label: 'Sorcerer Origin',
        description: 'Choose a sorcerer origin that describes the source of your innate magical power. Your choice grants you features at Sorcerer level 3 and again at levels 6, 14, and 18.',
        count: 1,
        options: [
          {
            id: 'draconic-sorcery',
            label: 'Draconic Sorcery',
            description: 'Your innate magic comes from draconic magic that was mingled with your blood or that of your ancestors.',
            traits: [
              { title: 'Draconic Resilience', desc: "As magic flows through your body, it causes physical traits of your dragon ancestors to manifest. Your hit point maximum increases by 1 and increases by 1 again whenever you gain a level in this class. Additionally, parts of your skin are covered by a thin sheen of dragon-like scales. When you aren't wearing armor, your AC equals 10 + your Dexterity modifier + your Charisma modifier.", key: true, featureType: 'Class Feature', minTier: 1 },
              { title: 'Draconic Spells', desc: "You learn additional spells when you reach certain levels in this class, as shown on the Draconic Spells table. Each of these spells counts as a sorcerer spell for you, but it doesn't count against the number of sorcerer spells you know.", key: true, featureType: 'Class Feature', minTier: 1 },
              { title: 'Elemental Affinity', desc: 'When you cast a spell that deals damage of the type associated with your draconic ancestry, you can add your Charisma modifier to one damage roll of that spell. At the same time, you can spend 1 sorcery point to gain resistance to that damage type for 1 hour.', key: true, featureType: 'Class Feature', minTier: 2 },
              { title: 'Dragon Wings', desc: 'You can use a bonus action to manifest a pair of spectral dragon wings from your back. While the wings exist, you have a flying speed equal to your current walking speed. The wings last until you dismiss them as a bonus action or until you are incapacitated.', key: true, featureType: 'Class Feature', minTier: 4 },
              { title: 'Dragon Companion', desc: 'You can use your action to summon a dragon spirit. It manifests in an unoccupied space that you can see within 30 feet of you. The spirit is an ally to you and your companions and obeys your commands. In combat, the spirit shares your initiative count but takes its turn immediately after yours.', key: true, featureType: 'Class Feature', minTier: 4 },
            ],
          },
        ],
      },
    ],
  },
  Warlock: {
    description: 'A wielder of magic that is derived from a bargain with an extraplanar entity.',
    hitDice: 8,
    hitDiceAverage: 5,
    savingThrows: ['wis', 'cha'],
    skillChoices: {
      count: 2,
      from: ['Arcana', 'Deception', 'History', 'Intimidation', 'Investigation', 'Nature', 'Religion'],
    },
    features: [
      {
        title: 'Magical Cunning',
        desc: "If all your Pact Magic spell slots are expended, you can perform an esoteric rite for 1 minute. At the end of the rite, you regain half of those spell slots (round up). Once you use this feature, you can't do so again until you finish a Long Rest.",
        uses: { total: 1, per: 'Long Rest' },
        key: true,
      },
      {
        title: 'Warlock Subclass',
        desc: 'You choose a Warlock subclass: Archfey, Celestial, Fiend, or Great Old One. Your choice grants you features at Warlock level 3 and again at levels 6, 10, and 14.',
        key: true,
      },
      {
        title: 'Contact Patron',
        desc: "In the past, you usually contacted your patron through intermediaries. Now you can communicate directly. You can cast Contact Other Plane at will, without expending a spell slot, to contact your patron. Once you use this feature, you can't do so again until you finish a Long Rest.",
        uses: { total: 1, per: 'Long Rest' },
        key: true,
        minTier: 2,
      },
    ],
    featureChoices: [
      {
        id: 'eldritch-invocations',
        label: 'Eldritch Invocations',
        description: "Choose from the invocations below to customize your Warlock's magical abilities. You may select the indicated number of invocations at your current tier.",
        count: 2,
        scalesPerTier: true,
        options: [
          {
            id: 'agonizing-blast',
            label: 'Agonizing Blast',
            description: 'When you cast Eldritch Blast, add your Charisma modifier to the damage it deals on a hit.',
            prerequisite: 'Warlock:level:1',
            traits: [
              { title: 'Agonizing Blast', desc: 'When you cast Eldritch Blast, add your Charisma modifier to the damage it deals on a hit.', key: false, featureType: 'Class Feature' },
            ],
          },
          {
            id: 'armor-of-shadows',
            label: 'Armor of Shadows',
            description: 'You can cast Mage Armor on yourself at will, without expending a spell slot or material components.',
            traits: [
              { title: 'Armor of Shadows', desc: 'You can cast Mage Armor on yourself at will, without expending a spell slot or material components.', key: true, featureType: 'Class Feature' },
            ],
          },
          {
            id: 'devils-sight',
            label: "Devil's Sight",
            description: 'You can see normally in darkness, both magical and nonmagical, to a distance of 120 feet.',
            traits: [
              { title: "Devil's Sight", desc: 'You can see normally in darkness, both magical and nonmagical, to a distance of 120 feet.', key: true, featureType: 'Class Feature' },
            ],
          },
          {
            id: 'repelling-blast',
            label: 'Repelling Blast',
            description: 'When you hit a creature with Eldritch Blast, you can push the creature up to 10 feet away from you in a straight line.',
            prerequisite: 'Warlock:level:1',
            traits: [
              { title: 'Repelling Blast', desc: 'When you hit a creature with Eldritch Blast, you can push the creature up to 10 feet away from you in a straight line.', key: false, featureType: 'Class Feature' },
            ],
          },
          {
            id: 'mask-of-many-faces',
            label: 'Mask of Many Faces',
            description: 'You can cast Disguise Self at will, without expending a spell slot.',
            traits: [
              { title: 'Mask of Many Faces', desc: 'You can cast Disguise Self at will, without expending a spell slot.', key: false, featureType: 'Class Feature' },
            ],
          },
          {
            id: 'eldritch-mind',
            label: 'Eldritch Mind',
            description: 'You have Advantage on Constitution saving throws that you make to maintain your Concentration on a spell.',
            traits: [
              { title: 'Eldritch Mind', desc: 'You have Advantage on Constitution saving throws that you make to maintain your Concentration on a spell.', key: true, featureType: 'Class Feature' },
            ],
          },
          {
            id: 'fiendish-vigor',
            label: 'Fiendish Vigor',
            description: 'You can cast False Life on yourself at will as a 1st-level spell, without expending a spell slot or material components.',
            traits: [
              { title: 'Fiendish Vigor', desc: 'You can cast False Life on yourself at will as a 1st-level spell, without expending a spell slot or material components.', key: false, featureType: 'Class Feature' },
            ],
          },
          {
            id: 'eldritch-sight',
            label: 'Eldritch Sight',
            description: 'You can cast Detect Magic at will, without expending a spell slot.',
            traits: [
              { title: 'Eldritch Sight', desc: 'You can cast Detect Magic at will, without expending a spell slot.', key: false, featureType: 'Class Feature' },
            ],
          },
          {
            id: 'otherworldly-leap',
            label: 'Otherworldly Leap',
            description: 'You can cast Jump on yourself at will, without expending a spell slot or material components.',
            traits: [
              { title: 'Otherworldly Leap', desc: 'You can cast Jump on yourself at will, without expending a spell slot or material components.', key: false, featureType: 'Class Feature' },
            ],
          },
          {
            id: 'lessons-of-the-first-ones',
            label: 'Lessons of the First Ones',
            description: 'You have received knowledge from an elder entity of the multiverse, allowing you to gain one Origin feat of your choice.',
            prerequisite: 'Warlock:level:1',
            traits: [
              { title: 'Lessons of the First Ones', desc: 'You have received knowledge from an elder entity of the multiverse, allowing you to gain one Origin feat of your choice.', key: true, featureType: 'Class Feature' },
            ],
          },
        ],
      },
      {
        id: 'warlock-subclass',
        label: 'Warlock Subclass',
        description: 'Choose a Warlock subclass that defines your patron. Your choice grants you features at Warlock level 3 and again at levels 6, 10, and 14.',
        count: 1,
        options: [
          {
            id: 'fiend-patron',
            label: 'Fiend Patron',
            description: 'You have made a pact with a fiend from the Lower Planes, a being whose aims are evil—even if you strive against those aims.',
            traits: [
              { title: "Dark One's Blessing", desc: 'When you reduce a hostile creature to 0 hit points, you gain temporary hit points equal to your Charisma modifier + your warlock level (minimum of 1).', key: true, featureType: 'Class Feature', minTier: 1 },
              { title: 'Fiend Spells', desc: "You learn additional spells when you reach certain levels in this class, as shown on the Fiend Spells table. Each of these spells counts as a warlock spell for you, but it doesn't count against the number of warlock spells you know.", key: true, featureType: 'Class Feature', minTier: 1 },
              { title: "Dark One's Own Luck", desc: "When you make an ability check or a saving throw, you can use this feature to add a d10 to your roll. You can do so after seeing the initial roll but before any of the roll's effects occur. Once you use this feature, you can't use it again until you finish a short or long rest.", key: true, featureType: 'Class Feature', minTier: 2 },
              { title: 'Fiendish Resilience', desc: 'You can choose one damage type when you finish a short or long rest. You gain resistance to that damage type until you choose a different one with this feature. Damage from magical weapons or silver weapons ignores this resistance.', key: true, featureType: 'Class Feature', minTier: 3 },
              { title: 'Hurl Through Hell', desc: "When you hit a creature with an attack, you can use this feature to instantly transport the target through the Lower Planes. The target disappears and is transported to a nightmarish landscape. If the target is not a fiend, it takes 10d10 psychic damage as it reels from its horrific experience. Once you use this feature, you can't use it again until you finish a long rest.", key: true, featureType: 'Class Feature', minTier: 4 },
            ],
          },
        ],
      },
    ],
  },
  Wizard: {
    description: 'A scholarly magic-user capable of manipulating the structures of reality.',
    hitDice: 6,
    hitDiceAverage: 4,
    savingThrows: ['int', 'wis'],
    skillChoices: {
      count: 2,
      from: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Religion'],
    },
    features: [
      {
        title: 'Arcane Recovery',
        desc: 'Once per day when you finish a short rest, you can choose expended spell slots to recover. The spell slots can have a combined level that is equal to or less than half your wizard level (rounded up).',
        key: false,
      },
    ],
    featureChoices: [
      {
        id: 'wizard-school',
        label: 'Arcane School',
        description: 'Choose a school of magic. Your choice grants you features at Wizard level 3 and again at levels 6, 10, and 14.',
        count: 1,
        options: [
          {
            id: 'evoker',
            label: 'Evoker',
            description: 'You focus your study on magic that creates powerful elemental effects such as bitter cold, searing flame, rolling thunder, crackling lightning, and burning acid.',
            traits: [
              { title: 'Evocation Savant', desc: 'The gold and time you must spend to copy an Evocation spell into your spellbook is halved.', key: false, featureType: 'Class Feature', minTier: 1 },
              { title: 'Potent Cantrip', desc: "Your damaging cantrips affect even creatures that avoid the brunt of the effect. When a creature succeeds on a saving throw against your cantrip, the creature takes half the cantrip's damage (if any) but suffers no additional effect from the cantrip.", key: true, featureType: 'Class Feature', minTier: 1 },
              { title: 'Sculpt Spells', desc: "You can create pockets of relative safety within the effects of your evocation spells. When you cast an evocation spell that affects other creatures that you can see, you can choose a number of them equal to 1 + the spell's level. The chosen creatures automatically succeed on their saving throws against the spell, and they take no damage if they would normally take half damage on a successful save.", key: true, featureType: 'Class Feature', minTier: 2 },
              { title: 'Empowered Evocation', desc: 'You can add your Intelligence modifier (minimum of +1) to one damage roll of any wizard evocation spell you cast.', key: true, featureType: 'Class Feature', minTier: 3 },
              { title: 'Overchannel', desc: 'When you cast a wizard spell of 5th level or lower that deals damage, you can deal maximum damage with that spell. The first time you do so, you suffer no adverse effect. If you use this feature again before you finish a long rest, you take 2d12 necrotic damage for each level of the spell, immediately after you cast it. Each time you use this feature again before finishing a long rest, the necrotic damage per spell level increases by 1d12.', key: true, featureType: 'Class Feature', minTier: 4 },
            ],
          },
        ],
      },
    ],
  },
}

export const SPECIES: Record<string, SpeciesData> = {
  Human: {
    description:
      'Resourceful and versatile, humans are the most common people in the worlds of D&D.',
    speed: '30ft',
    traits: [
      {
        title: 'Resourceful',
        desc: 'You gain Inspiration whenever you finish a Long Rest.',
        key: true,
      },
      {
        title: 'Skillful',
        desc: 'You gain proficiency in one skill of your choice.',
        key: true,
      },
      {
        title: 'Versatile',
        desc: 'You gain the Skilled feat or another 1st-level feat of your choice.',
        key: false,
      },
    ],
  },
  Elf: {
    description:
      'A magical people of otherworldly grace, living in the world but not entirely part of it.',
    speed: '30ft',
    traits: [
      {
        title: 'Darkvision',
        desc: 'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.',
        key: true,
      },
      {
        title: 'Fey Ancestry',
        desc: 'You have advantage on saving throws against being Charmed, and magic can\'t put you to sleep.',
        key: true,
      },
      {
        title: 'Trance',
        desc: 'You don\'t need to sleep. Instead, you meditate deeply, remaining semiconscious, for 4 hours a day.',
        key: false,
      },
      {
        title: 'Keen Senses',
        desc: 'You have proficiency in the Perception skill.',
        key: true,
      },
    ],
    subChoices: [
      {
        id: 'drow',
        label: 'Drow',
        description:
          'Descended from the Underdark, drow have superior darkvision and innate spellcasting.',
        traits: [
          {
            title: 'Superior Darkvision',
            desc: 'Your darkvision range increases to 120 feet.',
            key: true,
          },
          {
            title: 'Drow Magic (Dancing Lights)',
            desc: 'You know the Dancing Lights cantrip.',
            key: false,
          },
          {
            title: 'Drow Magic (Faerie Fire)',
            desc: 'You can cast Faerie Fire once per Long Rest without a spell slot. Charisma is your spellcasting ability.',
            key: true,
            minTier: 1,
            uses: { total: 1, per: 'Long Rest' },
          },
          {
            title: 'Drow Magic (Darkness)',
            desc: 'Starting at 5th level (Tier 2), you can cast Darkness once per Long Rest without a spell slot. Charisma is your spellcasting ability.',
            key: true,
            minTier: 2,
            uses: { total: 1, per: 'Long Rest' },
          },
        ],
      },
      {
        id: 'high-elf',
        label: 'High Elf',
        description:
          'Gifted with a sharper intellect and natural magical talent, high elves excel at wizardry.',
        traits: [
          {
            title: 'Elf Weapon Training',
            desc: 'You have proficiency with Longsword, Shortsword, Shortbow, and Longbow.',
            key: false,
          },
          {
            title: 'High Elf Cantrip',
            desc: 'You know one cantrip of your choice from the Wizard spell list. Intelligence is your spellcasting ability.',
            key: true,
          },
        ],
      },
      {
        id: 'wood-elf',
        label: 'Wood Elf',
        description:
          'At home in the deep forests, wood elves are swift and naturally stealthy.',
        traits: [
          {
            title: 'Fleet of Foot',
            desc: 'Your base walking speed increases by 5 feet (total 35 feet).',
            key: true,
          },
          {
            title: 'Mask of the Wild',
            desc: 'You can attempt to Hide even when you are only lightly obscured by foliage, heavy rain, falling snow, mist, and other natural phenomena.',
            key: true,
          },
        ],
      },
    ],
  },
  Dwarf: {
    description:
      'Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal.',
    speed: '30ft',
    traits: [
      {
        title: 'Darkvision',
        desc: 'You can see in dim light within 120 feet of you as if it were bright light, and in darkness as if it were dim light.',
        key: true,
      },
      {
        title: 'Dwarven Resilience',
        desc: 'You have advantage on saving throws against poison, and you have resistance against poison damage.',
        key: true,
      },
      {
        title: 'Stonecunning',
        desc: 'Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check.',
        key: false,
      },
      {
        title: 'Dwarven Toughness',
        desc: 'Your hit point maximum increases by 1, and it increases by 1 again whenever you gain a level.',
        key: true,
      },
    ],
  },
  Gnome: {
    description:
      'Small humanoids known for their eccentric sense of humor, inquisitiveness, and engineering prowess.',
    speed: '30ft',
    traits: [
      {
        title: 'Darkvision',
        desc: 'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.',
        key: true,
      },
      {
        title: 'Gnomish Cunning',
        desc: 'You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.',
        key: true,
      },
    ],
    subChoices: [
      {
        id: 'forest-gnome',
        label: 'Forest Gnome',
        description:
          'Forest gnomes have a natural affinity for small beasts and minor illusions.',
        traits: [
          {
            title: 'Speak with Small Beasts',
            desc: 'Through sounds and gestures, you can communicate simple ideas with Small or smaller beasts.',
            key: false,
          },
          {
            title: 'Forest Magic',
            desc: 'You know the Minor Illusion cantrip. Intelligence is your spellcasting ability.',
            key: true,
          },
        ],
      },
      {
        id: 'rock-gnome',
        label: 'Rock Gnome',
        description:
          'Rock gnomes are gifted inventors and have a deep knowledge of magical and technological devices.',
        traits: [
          {
            title: "Artificer's Lore",
            desc: 'Add double your Proficiency Bonus to any History check you make related to magic items, alchemical objects, or technological devices.',
            key: true,
          },
          {
            title: 'Tinker',
            desc: "You have proficiency with Tinker's Tools. Using those tools, you can create Tiny clockwork devices (see the 2024 PHB for examples).",
            key: false,
          },
        ],
      },
    ],
  },
  Halfling: {
    description:
      'A practical and resilient people, halflings prefer the comforts of home but can be surprisingly capable adventurers.',
    speed: '30ft',
    traits: [
      {
        title: 'Luck',
        desc: 'When you roll a 1 on the d20 of a D20 Test, you can reroll the die, and you must use the new roll.',
        key: true,
      },
      {
        title: 'Brave',
        desc: 'You have Advantage on saving throws to avoid or end the Frightened condition.',
        key: true,
      },
      {
        title: 'Halfling Nimbleness',
        desc: 'You can move through the space of any creature that is a size larger than you, but you can\'t stop in the same space.',
        key: false,
      },
      {
        title: 'Naturally Stealthy',
        desc: 'You have proficiency in the Stealth skill.',
        key: false,
      },
    ],
  },
  Dragonborn: {
    description:
      'A proud race that claims descent from dragons, with a knack for breathing fire, acid, or other damaging elements.',
    speed: '30ft',
    traits: [
      {
        title: 'Darkvision',
        desc: 'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.',
        key: true,
      },
      {
        title: 'Draconic Ancestry',
        desc: 'You have a draconic ancestry. Choose one type of dragon from the Draconic Ancestry table. Your breath weapon and damage resistance are determined by the dragon type.',
        key: true,
      },
      {
        title: 'Breath Weapon',
        desc: 'You can use your action to exhale destructive energy.',
        key: true,
      },
      {
        title: 'Damage Resistance',
        desc: 'You have resistance to the damage type associated with your draconic ancestry.',
        key: false,
      },
      {
        title: 'Draconic Flight',
        desc: 'Starting at 5th level (Tier 2), as a Bonus Action you can sprout spectral wings for 10 minutes. During that time you gain a Fly Speed equal to your Speed. You can use this trait a number of times equal to your Proficiency Bonus, regaining expended uses after a Long Rest.',
        key: true,
        minTier: 2,
      },
    ],
    subChoices: [
      {
        id: 'chromatic',
        label: 'Chromatic',
        description:
          'Chromatic dragons are driven by greed, pride, and a desire to dominate. Dragon types: Black (Acid), Blue (Lightning), Green (Poison), Red (Fire), White (Cold).',
        traits: [
          {
            title: 'Chromatic Ancestry',
            desc: 'Your breath weapon damage type and damage resistance are determined by your chosen chromatic dragon: Black (Acid), Blue (Lightning), Green (Poison), Red (Fire), or White (Cold).',
            key: true,
          },
        ],
      },
      {
        id: 'gem',
        label: 'Gem',
        description:
          'Gem dragons are psionically gifted neutral beings of the Inner Planes. Dragon types: Amethyst (Force), Crystal (Radiant), Emerald (Psychic), Sapphire (Thunder), Topaz (Necrotic).',
        traits: [
          {
            title: 'Gem Ancestry',
            desc: 'Your breath weapon damage type and damage resistance are determined by your chosen gem dragon: Amethyst (Force), Crystal (Radiant), Emerald (Psychic), Sapphire (Thunder), or Topaz (Necrotic).',
            key: true,
          },
        ],
      },
      {
        id: 'metallic',
        label: 'Metallic',
        description:
          'Metallic dragons are devoted defenders of the weak and champions of justice. Dragon types: Brass (Fire), Bronze (Lightning), Copper (Acid), Gold (Fire), Silver (Cold).',
        traits: [
          {
            title: 'Metallic Ancestry',
            desc: 'Your breath weapon damage type and damage resistance are determined by your chosen metallic dragon: Brass (Fire), Bronze (Lightning), Copper (Acid), Gold (Fire), or Silver (Cold).',
            key: true,
          },
        ],
      },
    ],
  },
  Goliath: {
    description:
      'Massive and powerful humanoids who live in the highest mountains, known for their strength and athleticism.',
    speed: '35ft',
    traits: [
      {
        title: 'Powerful Build',
        desc: 'You have Advantage on any ability check you make to end the Grappled condition. You also count as one size larger when determining your carrying capacity.',
        key: false,
      },
      {
        title: 'Large Form',
        desc: 'Starting at 5th level (Tier 2), as a Bonus Action you can change your size to Large for 10 minutes. While Large, you have Advantage on Strength checks and your Speed increases by 10 feet. You can use this trait a number of times equal to your Proficiency Bonus, regaining expended uses after a Long Rest.',
        key: true,
        minTier: 2,
      },
    ],
    subChoices: [
      {
        id: 'cloud',
        label: 'Cloud Giant',
        description:
          'Cloud giants are masters of stealth and trickery, dwelling high above the world.',
        traits: [
          {
            title: "Cloud's Jaunt",
            desc: 'As a Bonus Action, you can magically teleport up to 30 feet to an unoccupied space you can see. You can use this trait a number of times equal to your Proficiency Bonus, regaining expended uses after a Long Rest.',
            key: true,
          },
        ],
      },
      {
        id: 'fire',
        label: 'Fire Giant',
        description:
          'Fire giants are passionate and warlike, embodying the destructive power of flame.',
        traits: [
          {
            title: "Fire's Burn",
            desc: 'When you hit a target with an attack roll and deal damage to it, you can also deal 1d10 Fire damage to that target. You can use this trait a number of times equal to your Proficiency Bonus, regaining expended uses after a Long Rest.',
            key: true,
          },
        ],
      },
      {
        id: 'frost',
        label: 'Frost Giant',
        description:
          'Frost giants are cold and calculating, hardened by the frozen lands they call home.',
        traits: [
          {
            title: "Frost's Chill",
            desc: 'When you take damage, you can use your Reaction to reduce the damage taken by 1d8 plus your Constitution modifier. You can use this trait a number of times equal to your Proficiency Bonus, regaining expended uses after a Long Rest.',
            key: true,
          },
        ],
      },
      {
        id: 'hill',
        label: 'Hill Giant',
        description:
          'Hill giants are brutish and territorial, using their bulk to overwhelm opponents.',
        traits: [
          {
            title: "Hill's Tumble",
            desc: 'When you hit a Large or smaller creature with an attack roll and deal damage to it, you can use your Reaction to knock the target Prone. You can use this trait a number of times equal to your Proficiency Bonus, regaining expended uses after a Long Rest.',
            key: true,
          },
        ],
      },
      {
        id: 'stone',
        label: 'Stone Giant',
        description:
          'Stone giants are patient and enduring, as unyielding as the mountains themselves.',
        traits: [
          {
            title: "Stone's Endurance",
            desc: 'When you take damage, you can use your Reaction to roll a d12. Add your Constitution modifier to the number rolled, and reduce the damage by that total. You can use this trait a number of times equal to your Proficiency Bonus, regaining expended uses after a Long Rest.',
            key: true,
          },
        ],
      },
      {
        id: 'storm',
        label: 'Storm Giant',
        description:
          'Storm giants are visionaries who channel the fury of the tempest.',
        traits: [
          {
            title: "Storm's Thunder",
            desc: 'When you take damage from a creature within 60 feet of you, you can use your Reaction to deal 1d8 Thunder damage to that creature and each other creature of your choice within 5 feet of it. You can use this trait a number of times equal to your Proficiency Bonus, regaining expended uses after a Long Rest.',
            key: true,
          },
        ],
      },
    ],
  },
  Orc: {
    description:
      'Fierce warriors with a strong connection to their tribes, known for their resilience and bursts of adrenaline.',
    speed: '30ft',
    traits: [
      {
        title: 'Darkvision',
        desc: 'You can see in dim light within 120 feet of you as if it were bright light, and in darkness as if it were dim light.',
        key: true,
      },
      {
        title: 'Adrenaline Rush',
        desc: 'As a bonus action, you can move up to your Speed toward an enemy of your choice that you can see or hear. You must end this move closer to the enemy than you started.',
        key: true,
      },
      {
        title: 'Relentless Endurance',
        desc: 'When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. You can’t use this feature again until you finish a long rest.',
        key: false,
      },
    ],
  },
  Tiefling: {
    description:
      'Humanoids with an infernal bloodline, which gives them their classic horns, tails, and a resistance to fire.',
    speed: '30ft',
    traits: [
      {
        title: 'Darkvision',
        desc: 'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.',
        key: true,
      },
      {
        title: 'Otherworldly Presence',
        desc: 'You know the Thaumaturgy cantrip. When you cast it with this trait, the spell\'s range is doubled and you can target objects that aren\'t being worn or carried.',
        key: false,
      },
    ],
    subChoices: [
      {
        id: 'abyssal',
        label: 'Abyssal',
        description:
          'Your fiendish blood traces back to the chaotic evil of the Abyss, granting poison resistance and dark magic.',
        traits: [
          {
            title: 'Abyssal Resistance',
            desc: 'You have resistance to Poison damage.',
            key: true,
          },
          {
            title: 'Abyssal Legacy (Poison Spray)',
            desc: 'You know the Poison Spray cantrip.',
            key: false,
          },
          {
            title: 'Abyssal Legacy (Ray of Sickness)',
            desc: 'You can cast Ray of Sickness once per Long Rest without a spell slot. Charisma is your spellcasting ability.',
            key: true,
            minTier: 1,
            uses: { total: 1, per: 'Long Rest' },
          },
          {
            title: 'Abyssal Legacy (Hold Person)',
            desc: 'Starting at 5th level (Tier 2), you can cast Hold Person once per Long Rest without a spell slot. Charisma is your spellcasting ability.',
            key: true,
            minTier: 2,
            uses: { total: 1, per: 'Long Rest' },
          },
        ],
      },
      {
        id: 'chthonic',
        label: 'Chthonic',
        description:
          'Your bloodline is touched by the deathly energies of the Shadowfell and the Underworld.',
        traits: [
          {
            title: 'Chthonic Resistance',
            desc: 'You have resistance to Necrotic damage.',
            key: true,
          },
          {
            title: 'Chthonic Legacy (Chill Touch)',
            desc: 'You know the Chill Touch cantrip.',
            key: false,
          },
          {
            title: 'Chthonic Legacy (False Life)',
            desc: 'You can cast False Life once per Long Rest without a spell slot. Charisma is your spellcasting ability.',
            key: true,
            minTier: 1,
            uses: { total: 1, per: 'Long Rest' },
          },
          {
            title: 'Chthonic Legacy (Ray of Enfeeblement)',
            desc: 'Starting at 5th level (Tier 2), you can cast Ray of Enfeeblement once per Long Rest without a spell slot. Charisma is your spellcasting ability.',
            key: true,
            minTier: 2,
            uses: { total: 1, per: 'Long Rest' },
          },
        ],
      },
      {
        id: 'infernal',
        label: 'Infernal',
        description:
          'Your bloodline is tied to the nine hells, granting you fire resistance and fiery magic.',
        traits: [
          {
            title: 'Infernal Resistance',
            desc: 'You have resistance to Fire damage.',
            key: true,
          },
          {
            title: 'Infernal Legacy (Fire Bolt)',
            desc: 'You know the Fire Bolt cantrip.',
            key: false,
          },
          {
            title: 'Infernal Legacy (Hellish Rebuke)',
            desc: 'You can cast Hellish Rebuke once per Long Rest without a spell slot. Charisma is your spellcasting ability.',
            key: true,
            minTier: 1,
            uses: { total: 1, per: 'Long Rest' },
          },
          {
            title: 'Infernal Legacy (Darkness)',
            desc: 'Starting at 5th level (Tier 2), you can cast Darkness once per Long Rest without a spell slot. Charisma is your spellcasting ability.',
            key: true,
            minTier: 2,
            uses: { total: 1, per: 'Long Rest' },
          },
        ],
      },
    ],
  },
  Aasimar: {
    description:
      'Beings with a touch of the divine in their ancestry, often seen as guardians of good and justice.',
    speed: '30ft',
    traits: [
      {
        title: 'Darkvision',
        desc: 'You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.',
        key: true,
      },
      {
        title: 'Celestial Resistance',
        desc: 'You have resistance to necrotic damage and radiant damage.',
        key: true,
      },
      {
        title: 'Healing Hands',
        desc: 'As a Magic action, you can touch a creature and roll a number of d4s equal to your Proficiency Bonus. The creature regains a number of hit points equal to the total. You can use this trait a number of times equal to your Proficiency Bonus, regaining expended uses after a Long Rest.',
        key: true,
      },
      {
        title: 'Light Bearer',
        desc: 'You know the Light cantrip. Charisma is your spellcasting ability for it.',
        key: false,
      },
      {
        title: 'Celestial Revelation',
        desc: 'When you reach character level 3, you can transform as a Bonus Action using one of the options below (Heavenly Wings or Inner Radiance). The transformation lasts 1 minute, and you can use it once per Long Rest.',
        key: true,
        minTier: 1,
      },
    ],
    subChoices: [
      {
        id: 'heavenly-wings',
        label: 'Heavenly Wings',
        description:
          'You manifest a pair of spectral wings, granting you the power of flight.',
        traits: [
          {
            title: 'Heavenly Wings',
            desc: 'As a Bonus Action, you manifest spectral wings. For 1 minute, you gain a Fly Speed equal to your Speed. You can use this trait a number of times equal to your Proficiency Bonus, regaining expended uses after a Long Rest.',
            key: true,
            minTier: 1,
          },
        ],
      },
      {
        id: 'inner-radiance',
        label: 'Inner Radiance',
        description:
          'You channel the searing light within you, damaging foes who dare get close.',
        traits: [
          {
            title: 'Inner Radiance',
            desc: 'As a Bonus Action, you unleash a radiant glow. For 1 minute, you shed Bright Light in a 10-foot radius and Dim Light for an additional 10 feet. Once on each of your turns, you can deal Radiant damage equal to your Proficiency Bonus to one target within 10 feet of you. You can use this trait a number of times equal to your Proficiency Bonus, regaining expended uses after a Long Rest.',
            key: true,
            minTier: 1,
          },
        ],
      },
    ],
  },
}

export const BACKGROUNDS: Record<string, BackgroundData> = {
  Acolyte: {
    description:
      'You have spent your life in the service of a temple to a specific god or pantheon of gods.',
    skills: ['Insight', 'Religion'],
    abilityScoreIncrease: ['int', 'wis', 'cha'],
    feature: {
      title: 'Magic Initiate (Cleric)',
      desc: 'You learn two cantrips and one 1st-level spell from the Cleric spell list. You can cast the 1st-level spell once per long rest without a spell slot.',
      key: false,
    },
  },
  Artisan: {
    description:
      "You are a member of an artisan's guild, skilled in a particular field and closely associated with other artisans.",
    skills: ['Investigation', 'Persuasion'],
    abilityScoreIncrease: ['int', 'wis', 'cha'],
    feature: {
      title: 'Crafter',
      desc: "You gain proficiency with three different types of artisan's tools of your choice.",
      key: false,
    },
  },
  Charlatan: {
    description:
      'You have always had a way with people, knowing what makes them tick and how to manipulate their desires.',
    skills: ['Deception', 'Sleight of Hand'],
    abilityScoreIncrease: ['dex', 'int', 'cha'],
    feature: {
      title: 'Alert',
      desc: "You gain a +5 bonus to initiative and can't be surprised while you are conscious.",
      key: false,
    },
  },
  Criminal: {
    description: 'You have a history of breaking the law and surviving on the wrong side of it.',
    skills: ['Deception', 'Stealth'],
    abilityScoreIncrease: ['dex', 'int', 'cha'],
    feature: {
      title: 'Alert',
      desc: "You gain a +5 bonus to initiative and can't be surprised while you are conscious.",
      key: false,
    },
  },
  Entertainer: {
    description:
      'You thrive in front of an audience, knowing how to entrance, entertain, and inspire them.',
    skills: ['Acrobatics', 'Performance'],
    abilityScoreIncrease: ['dex', 'wis', 'cha'],
    feature: {
      title: 'Musician',
      desc: 'You gain proficiency with three musical instruments of your choice.',
      key: false,
    },
  },
  Farmer: {
    description: 'You grew up working the land, connected to the earth and the cycles of nature.',
    skills: ['Animal Handling', 'Nature'],
    abilityScoreIncrease: ['str', 'con', 'wis'],
    feature: {
      title: 'Tough',
      desc: 'Your hit point maximum increases by an amount equal to twice your level.',
      key: false,
    },
  },
  Guard: {
    description:
      'You served as a guard, keeping watch and enforcing the law in a city or stronghold.',
    skills: ['Insight', 'Perception'],
    abilityScoreIncrease: ['str', 'con', 'wis'],
    feature: {
      title: 'Alert',
      desc: "You gain a +5 bonus to initiative and can't be surprised while you are conscious.",
      key: false,
    },
  },
  Guide: {
    description:
      'You have spent your life navigating the wilds or treacherous cityscapes, leading others to safety.',
    skills: ['Stealth', 'Survival'],
    abilityScoreIncrease: ['dex', 'con', 'wis'],
    feature: {
      title: 'Magic Initiate (Druid)',
      desc: 'You learn two cantrips and one 1st-level spell from the Druid spell list. You can cast the 1st-level spell once per long rest without a spell slot.',
      key: false,
    },
  },
  Hermit: {
    description:
      'You lived in seclusion for a formative part of your life, seeking solitude and contemplation.',
    skills: ['Medicine', 'Religion'],
    abilityScoreIncrease: ['con', 'int', 'wis'],
    feature: {
      title: 'Magic Initiate (Wizard)',
      desc: 'You learn two cantrips and one 1st-level spell from the Wizard spell list. You can cast the 1st-level spell once per long rest without a spell slot.',
      key: false,
    },
  },
  Merchant: {
    description:
      'Your life has been one of hard physical work, granting you strength and endurance.',
    skills: ['Animal Handling', 'Persuasion'],
    abilityScoreIncrease: ['con', 'int', 'cha'],
    feature: {
      title: 'Lucky',
      desc: 'When you roll a 1 on a d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.',
      key: false,
    },
  },
  Noble: {
    description:
      'You were raised in a family of wealth and privilege, and you carry a noble title.',
    skills: ['History', 'Persuasion'],
    abilityScoreIncrease: ['int', 'wis', 'cha'],
    feature: {
      title: 'Skilled',
      desc: 'You gain proficiency in any combination of three skills or tools of your choice.',
      key: false,
    },
  },
  Sage: {
    description:
      'You spent years learning the lore of the multiverse, scouring manuscripts and studying scrolls.',
    skills: ['Arcana', 'History'],
    abilityScoreIncrease: ['int', 'wis', 'cha'],
    feature: {
      title: 'Magic Initiate (Wizard)',
      desc: 'You learn two cantrips and one 1st-level spell from the Wizard spell list. You can cast the 1st-level spell once per long rest without a spell slot.',
      key: false,
    },
  },
  Sailor: {
    description:
      'You have spent years on a seagoing vessel, facing mighty storms and monsters of the deep.',
    skills: ['Perception', 'Sleight of Hand'],
    abilityScoreIncrease: ['str', 'dex', 'wis'],
    feature: {
      title: 'Tough',
      desc: 'Your hit point maximum increases by an amount equal to twice your level.',
      key: false,
    },
  },
  Scribe: {
    description:
      'You have spent your life learning to read and write, copying texts and preserving knowledge.',
    skills: ['Investigation', 'Perception'],
    abilityScoreIncrease: ['dex', 'int', 'wis'],
    feature: {
      title: 'Skilled',
      desc: 'You gain proficiency in any combination of three skills or tools of your choice.',
      key: false,
    },
  },
  Soldier: {
    description:
      "War has been your life. You've trained with weapons and armor, learning to fight as part of a larger force.",
    skills: ['Athletics', 'Intimidation'],
    abilityScoreIncrease: ['str', 'con', 'cha'],
    feature: {
      title: 'Savage Attacker',
      desc: "Once per turn when you roll damage for a melee weapon attack, you can reroll the weapon's damage dice and use either total.",
      key: false,
    },
  },
  Urchin: {
    description:
      'You grew up on the streets alone, orphaned, and poor, learning to be self-sufficient and cunning.',
    skills: ['Insight', 'Stealth'],
    abilityScoreIncrease: ['dex', 'wis', 'cha'],
    feature: {
      title: 'Lucky',
      desc: 'When you roll a 1 on a d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.',
      key: false,
    },
  },
}
