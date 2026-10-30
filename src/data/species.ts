// Species definitions.
import type { SpeciesData } from '@/types/rules'

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
