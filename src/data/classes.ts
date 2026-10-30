// Class definitions.
import type { ClassData } from '@/types/rules'

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
    featureChoices: [
      {
        id: 'barbarian-subclass',
        label: 'Primal Path',
        description: 'You choose a Primal Path that shapes the nature of your rage. Your choice grants you features at level 3, and again at levels 6, 10, and 14.',
        count: 1,
        minTier: 1,
        options: [
          {
            id: 'path-of-the-berserker',
            label: 'Path of the Berserker',
            description: 'The Path of the Berserker is a path of untrammeled fury, slick with blood.',
            traits: [
              {
                title: 'Frenzy',
                desc: 'If you use Reckless Attack while your Rage is active, you deal extra damage to the first target you hit on each of your turns with a Strength-based attack. The extra damage is 1d6 at level 3, increasing as you gain Barbarian levels.',
                key: true,
                minTier: 1,
                featureType: 'Class Feature',
              },
              {
                title: 'Mindless Rage',
                desc: 'You have immunity to the Charmed and Frightened conditions while your Rage is active. If you enter a Rage while Charmed or Frightened, those conditions end.',
                key: true,
                minTier: 2,
                featureType: 'Class Feature',
              },
              {
                title: 'Retaliation',
                desc: 'When you take damage from a creature that is within 5 feet of you, you can use your Reaction to make one melee weapon attack against that creature.',
                key: true,
                minTier: 3,
                featureType: 'Class Feature',
              },
              {
                title: 'Intimidating Presence',
                desc: "As a Bonus Action, you can frighten chosen creatures in a 30-foot Emanation originating from you. Each creature must make a Wisdom saving throw or be Frightened for 1 minute. You can use this feature once per Long Rest, or expend a use of Rage to restore it.",
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
    featureChoices: [
      {
        id: 'bard-college',
        label: 'Bardic College',
        description: 'You choose a Bardic College that determines your area of expertise. Your choice grants you features at level 3, and again at levels 6 and 14.',
        count: 1,
        minTier: 1,
        options: [
          {
            id: 'college-of-lore',
            label: 'College of Lore',
            description: 'Bards of the College of Lore know something about most things, collecting bits of knowledge from sources as diverse as scholarly tomes and peasant tales.',
            traits: [
              {
                title: 'Bonus Proficiencies',
                desc: 'You gain proficiency with three skills of your choice.',
                key: true,
                minTier: 1,
                featureType: 'Class Feature',
              },
              {
                title: 'Cutting Words',
                desc: "When a creature that you can see within 60 feet of you makes a damage roll, an ability check, or an attack roll, you can use your Reaction to expend one use of Bardic Inspiration, roll the die, and subtract the number rolled from the creature's roll.",
                key: true,
                minTier: 1,
                featureType: 'Class Feature',
              },
              {
                title: 'Magical Discoveries',
                desc: "You learn two spells of your choice from the Cleric, Druid, or Wizard spell lists. The spells you choose must be of a level you can cast. The chosen spells count as Bard spells for you and are always prepared.",
                key: true,
                minTier: 2,
                featureType: 'Class Feature',
              },
              {
                title: 'Peerless Skill',
                desc: 'When you fail an ability check or an attack roll, you can expend one use of Bardic Inspiration, roll the die, and add the number rolled to the d20. If the check or attack still fails, the use of Bardic Inspiration is not expended.',
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
    featureChoices: [
      {
        id: 'divine-domain',
        label: 'Divine Domain',
        description: 'You choose a Divine Domain that shapes the nature of your divine magic. Your choice grants you features at level 3, and again at levels 6 and 17.',
        count: 1,
        minTier: 1,
        options: [
          {
            id: 'life-domain',
            label: 'Life Domain',
            description: 'The Life domain focuses on the vibrant positive energy that sustains all life.',
            traits: [
              {
                title: 'Disciple of Life',
                desc: "When a spell you cast with a spell slot restores Hit Points to a creature, that creature regains additional Hit Points equal to 2 plus the spell slot's level.",
                key: true,
                minTier: 1,
                featureType: 'Class Feature',
              },
              {
                title: 'Preserve Life',
                desc: "You can use your Channel Divinity to restore Hit Points equal to 5 times your Cleric level, divided among Bloodied creatures within 30 feet of you, up to a maximum of half of each creature's Hit Point maximum.",
                key: true,
                minTier: 1,
                featureType: 'Class Feature',
              },
              {
                title: 'Life Domain Spells',
                desc: 'You always have certain spells prepared: Aid, Bless, Cure Wounds, and Lesser Restoration (level 3); Mass Healing Word and Revivify (level 5); Aura of Life and Death Ward (level 7); Greater Restoration and Mass Cure Wounds (level 9).',
                key: true,
                minTier: 1,
                featureType: 'Class Feature',
              },
              {
                title: 'Blessed Healer',
                desc: 'When you cast a spell with a spell slot that restores Hit Points to a creature other than you, you regain Hit Points equal to 2 plus the spell slot\'s level.',
                key: true,
                minTier: 2,
                featureType: 'Class Feature',
              },
              {
                title: 'Supreme Healing',
                desc: 'When you would normally roll one or more dice to restore Hit Points with a spell or Channel Divinity, you instead use the highest number possible for each die.',
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
    featureChoices: [
      {
        id: 'druid-circle',
        label: 'Druid Circle',
        description: 'You choose a Druid Circle that grants you access to circle-specific magic. Your choice grants you features at level 3, and again at levels 6, 10, and 14.',
        count: 1,
        minTier: 1,
        options: [
          {
            id: 'circle-of-the-land',
            label: 'Circle of the Land',
            description: 'The Circle of the Land is made up of mystics and sages who safeguard ancient knowledge and rites.',
            traits: [
              {
                title: 'Circle Spells',
                desc: "After each Long Rest, choose a land type: Arid, Polar, Temperate, or Tropical. You have the listed spells prepared for your Druid level.",
                key: true,
                minTier: 1,
                featureType: 'Class Feature',
              },
              {
                title: "Land's Aid",
                desc: 'As a Magic action, expend a use of Wild Shape to cause spectral plants to rise in a 10-foot-radius Sphere within 60 feet. Each chosen creature makes a Constitution saving throw, taking 2d6 Necrotic damage on a failure (half on success). One chosen creature regains 2d6 Hit Points. Damage and healing increase to 3d6 at level 10 and 4d6 at level 14.',
                key: true,
                minTier: 1,
                featureType: 'Class Feature',
              },
              {
                title: 'Natural Recovery',
                desc: 'You can cast one level 1+ spell from your Circle Spells without a spell slot, once per Long Rest. You also recover expended spell slots when you finish a Short Rest (combined level equal to or less than half your Druid level, no slot higher than level 5).',
                key: true,
                minTier: 2,
                featureType: 'Class Feature',
              },
              {
                title: "Nature's Ward",
                desc: 'As a Magic action, expend a use of Wild Shape to create spectral trees in a 15-foot Cube within 120 feet, lasting 1 minute. You and your allies have Half Cover while in the area.',
                key: true,
                minTier: 3,
                featureType: 'Class Feature',
              },
              {
                title: "Nature's Sanctuary",
                desc: 'You can cast one Circle Spell without a spell slot and recover spell slots on a Short Rest, as with Natural Recovery.',
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
        minTier: 3,
      },
    ],
    featureChoices: [
      {
        id: 'eldritch-invocations',
        label: 'Eldritch Invocations',
        description: "Choose from the invocations below to customize your Warlock's magical abilities. You may select the indicated number of invocations at your current tier.",
        count: { 3: 3, 6: 5, 10: 7 },
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
