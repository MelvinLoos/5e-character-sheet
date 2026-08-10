// A simplified library of D&D 2024 rules for the character sheet creator.

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
} from '@/types/rules'

// Also import for internal use
import type {
  ClassData,
  SpeciesData,
  BackgroundData,
  SpellSlotsByLevel,
} from '@/types/rules'
import type { CharacterFeature } from '@/types/character'
import type { CasterType } from '@/types/enums'

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
    1: {},
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
        'Performance',
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
    features: [],
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
      {
        title: 'Powerful Build',
        desc: 'You have Advantage on any ability check you make to end the Grappled condition. You also count as one size larger when determining your carrying capacity.',
        key: false,
      },
      {
        title: 'Large Form',
        desc: 'Starting at 5th level (Tier 2), as a Bonus Action you can change your size to Large for 10 minutes. While Large, you have Advantage on Strength checks and your Speed increases by 10 feet. You can use this trait a number of times equal to your Proficiency Bonus, regaining expended uses after a Long Rest.',
        key: true,
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
