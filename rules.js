// A simplified library of D&D 2024 rules for the character sheet creator.

export const ABILITIES = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

export const SKILLS = {
  Acrobatics: "dex",
  "Animal Handling": "wis",
  Arcana: "int",
  Athletics: "str",
  Deception: "cha",
  History: "int",
  Insight: "wis",
  Intimidation: "cha",
  Investigation: "int",
  Medicine: "wis",
  Nature: "int",
  Perception: "wis",
  Performance: "cha",
  Persuasion: "cha",
  Religion: "int",
  "Sleight of Hand": "dex",
  Stealth: "dex",
  Survival: "wis",
};

export const PROFICIENCY_BONUS_PROGRESSION = {
  1: 2,
  5: 3,
  9: 4,
  13: 5,
  17: 6,
};

export const SPELL_SLOT_PROGRESSION = {
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
};

export const CLASSES = {
  Barbarian: {
    description:
      "A fierce warrior of primitive background who can enter a battle rage.",
    hitDice: 12,
    hitDiceAverage: 7,
    savingThrows: ["str", "con"],
    casterType: null,
    features: [
      {
        title: "Rage",
        desc: "On your turn, you can enter a rage as a bonus action. While raging, you gain benefits if you aren't wearing heavy armor.",
        key: true,
        uses: { total: 2, per: "Long Rest" },
      },
      {
        title: "Unarmored Defense",
        desc: "While you are not wearing any armor, your Armor Class equals 10 + your Dexterity modifier + your Constitution modifier.",
        key: true,
      },
    ],
  },
  Bard: {
    description:
      "An inspiring magician whose power echoes the music of creation.",
    hitDice: 8,
    hitDiceAverage: 5,
    savingThrows: ["dex", "cha"],
    casterType: "full",
    features: [
      {
        title: "Spellcasting",
        desc: "You have learned to untangle and reshape the fabric of reality in harmony with your wishes and music.",
        key: false,
      },
      {
        title: "Bardic Inspiration",
        desc: "You can inspire others through stirring words or music. As a bonus action, a creature other than yourself within 60 feet of you that can hear you gains one Bardic Inspiration die, a d6.",
        key: true,
        uses: { total: 3, per: "Long Rest" },
      },
    ],
  },
  Cleric: {
    description:
      "A priestly champion who wields divine magic in service of a higher power.",
    hitDice: 8,
    hitDiceAverage: 5,
    savingThrows: ["wis", "cha"],
    casterType: "full",
    features: [
      {
        title: "Spellcasting",
        desc: "As a conduit for divine power, you can cast cleric spells.",
        key: false,
      },
      {
        title: "Divine Domain",
        desc: "Choose one domain related to your deity. Your choice grants you domain spells and other features when you choose it at 1st level.",
        key: true,
      },
    ],
  },
  Druid: {
    description:
      "A priest of the Old Faith, wielding the powers of nature and adopting animal forms.",
    hitDice: 8,
    hitDiceAverage: 5,
    savingThrows: ["int", "wis"],
    casterType: "full",
    features: [
      {
        title: "Druidic",
        desc: "You know Druidic, the secret language of druids. You can speak the language and use it to leave hidden messages.",
        key: false,
      },
      {
        title: "Spellcasting",
        desc: "Drawing on the divine essence of nature itself, you can cast spells to shape that essence to your will.",
        key: false,
      },
    ],
  },
  Fighter: {
    description:
      "A master of martial combat, skilled with a variety of weapons and armor.",
    hitDice: 10,
    hitDiceAverage: 6,
    savingThrows: ["str", "con"],
    casterType: null,
    features: [
      {
        title: "Fighting Style",
        desc: "You adopt a particular style of fighting as your specialty.",
        key: true,
      },
      {
        title: "Second Wind",
        desc: "You have a limited well of stamina you can draw on to protect yourself from harm. On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level.",
        key: true,
        uses: { total: 1, per: "Short Rest" },
      },
    ],
  },
  Monk: {
    description:
      "A master of martial arts, harnessing the power of the body in pursuit of physical and spiritual perfection.",
    hitDice: 8,
    hitDiceAverage: 5,
    savingThrows: ["str", "dex"],
    casterType: null,
    features: [
      {
        title: "Unarmored Defense",
        desc: "Beginning at 1st level, while you are wearing no armor and not wielding a shield, your AC equals 10 + your Dexterity modifier + your Wisdom modifier.",
        key: true,
      },
      {
        title: "Martial Arts",
        desc: "Your practice of martial arts gives you mastery of combat styles that use unarmed strikes and monk weapons.",
        key: false,
      },
    ],
  },
  Paladin: {
    description: "A holy warrior bound to a sacred oath.",
    hitDice: 10,
    hitDiceAverage: 6,
    savingThrows: ["wis", "cha"],
    casterType: "half",
    features: [
      {
        title: "Divine Sense",
        desc: "The presence of strong evil registers on your senses like a noxious odor, and powerful good rings like heavenly music in your ears.",
        key: true,
      },
      {
        title: "Lay on Hands",
        desc: "Your blessed touch can heal wounds. You have a pool of healing power that replenishes when you take a long rest.",
        key: true,
      },
    ],
  },
  Ranger: {
    description:
      "A warrior who uses martial prowess and nature magic to combat threats on the edges of civilization.",
    hitDice: 10,
    hitDiceAverage: 6,
    savingThrows: ["str", "dex"],
    casterType: "half",
    features: [
      {
        title: "Favored Enemy",
        desc: "You have significant experience studying, tracking, hunting, and even talking to a certain type of enemy.",
        key: true,
      },
      {
        title: "Natural Explorer",
        desc: "You are an adept at navigating the wilderness and are skilled at navigating the natural world.",
        key: false,
      },
    ],
  },
  Rogue: {
    description:
      "A scoundrel who uses stealth and trickery to overcome obstacles and enemies.",
    hitDice: 8,
    hitDiceAverage: 5,
    savingThrows: ["dex", "int"],
    casterType: null,
    features: [
      {
        title: "Expertise",
        desc: "Choose two of your skill proficiencies. Your proficiency bonus is doubled for any ability check you make that uses either of the chosen proficiencies.",
        key: true,
      },
      {
        title: "Sneak Attack",
        desc: "Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll.",
        key: true,
      },
      {
        title: "Thieves' Cant",
        desc: "You know the secret mix of dialect, jargon, and code that allows you to hide messages in seemingly normal conversation.",
        key: false,
      },
    ],
  },
  Sorcerer: {
    description:
      "A spellcaster who draws on inherent magic from a gift or bloodline.",
    hitDice: 6,
    hitDiceAverage: 4,
    savingThrows: ["con", "cha"],
    casterType: "full",
    features: [
      {
        title: "Spellcasting",
        desc: "An event in your past, or in the life of a parent or ancestor, left an indelible mark on you, infusing you with arcane magic.",
        key: false,
      },
      {
        title: "Sorcerous Origin",
        desc: "Choose a sorcerous origin, which describes the source of your innate magical power.",
        key: true,
      },
    ],
  },
  Warlock: {
    description:
      "A wielder of magic that is derived from a bargain with an extraplanar entity.",
    hitDice: 8,
    hitDiceAverage: 5,
    savingThrows: ["wis", "cha"],
    casterType: "pact",
    features: [
      {
        title: "Otherworldly Patron",
        desc: "You have struck a bargain with an otherworldly being of your choice.",
        key: true,
      },
      {
        title: "Pact Magic",
        desc: "Your arcane research and the magic bestowed on you by your patron have given you facility with spells.",
        key: false,
      },
    ],
  },
  Wizard: {
    description:
      "A scholarly magic-user capable of manipulating the structures of reality.",
    hitDice: 6,
    hitDiceAverage: 4,
    savingThrows: ["int", "wis"],
    casterType: "full",
    features: [
      {
        title: "Spellcasting",
        desc: "As a student of arcane magic, you have a spellbook containing spells that show the first glimmerings of your true power.",
        key: false,
      },
      {
        title: "Arcane Recovery",
        desc: "You have learned to regain some of your magical energy by studying your spellbook.",
        key: true,
      },
    ],
  },
};

export const SPECIES = {
  Human: {
    description:
      "Resourceful and versatile, humans are the most common people in the worlds of D&D.",
    speed: "30ft",
    traits: [
      {
        title: "Resourceful",
        desc: "You gain Inspiration whenever you finish a Long Rest.",
        key: true,
      },
      {
        title: "Skillful",
        desc: "You gain proficiency in one skill of your choice.",
        key: true,
      },
      {
        title: "Versatile",
        desc: "You gain the Skilled feat or another 1st-level feat of your choice.",
        key: false,
      },
    ],
  },
  Elf: {
    description:
      "A magical people of otherworldly grace, living in the world but not entirely part of it.",
    speed: "30ft",
    traits: [
      {
        title: "Darkvision",
        desc: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.",
        key: true,
      },
      {
        title: "Fey Ancestry",
        desc: "You have advantage on saving throws against being Charmed, and magic can’t put you to sleep.",
        key: true,
      },
      {
        title: "Trance",
        desc: "You don’t need to sleep. Instead, you meditate deeply, remaining semiconscious, for 4 hours a day.",
        key: false,
      },
    ],
  },
  Dwarf: {
    description:
      "Bold and hardy, dwarves are known as skilled warriors, miners, and workers of stone and metal.",
    speed: "25ft",
    traits: [
      {
        title: "Darkvision",
        desc: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.",
        key: true,
      },
      {
        title: "Dwarven Resilience",
        desc: "You have advantage on saving throws against poison, and you have resistance against poison damage.",
        key: true,
      },
      {
        title: "Stonecunning",
        desc: "Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check.",
        key: false,
      },
    ],
  },
  Gnome: {
    description:
      "Small humanoids known for their eccentric sense of humor, inquisitiveness, and engineering prowess.",
    speed: "25ft",
    traits: [
      {
        title: "Darkvision",
        desc: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.",
        key: true,
      },
      {
        title: "Gnome Cunning",
        desc: "You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.",
        key: true,
      },
    ],
  },
  Halfling: {
    description:
      "A practical and resilient people, halflings prefer the comforts of home but can be surprisingly capable adventurers.",
    speed: "25ft",
    traits: [
      {
        title: "Lucky",
        desc: "When you roll a 1 on a d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.",
        key: true,
      },
      {
        title: "Brave",
        desc: "You have advantage on saving throws against being Frightened.",
        key: true,
      },
      {
        title: "Halfling Nimbleness",
        desc: "You can move through the space of any creature that is of a size larger than yours.",
        key: false,
      },
    ],
  },
  Dragonborn: {
    description:
      "A proud race that claims descent from dragons, with a knack for breathing fire, acid, or other damaging elements.",
    speed: "30ft",
    traits: [
      {
        title: "Draconic Ancestry",
        desc: "You have a draconic ancestry. Choose one type of dragon from the Draconic Ancestry table. Your breath weapon and damage resistance are determined by the dragon type.",
        key: true,
      },
      {
        title: "Breath Weapon",
        desc: "You can use your action to exhale destructive energy.",
        key: true,
      },
      {
        title: "Damage Resistance",
        desc: "You have resistance to the damage type associated with your draconic ancestry.",
        key: false,
      },
    ],
  },
  Goliath: {
    description:
      "Massive and powerful humanoids who live in the highest mountains, known for their strength and athleticism.",
    speed: "30ft",
    traits: [
      {
        title: "Little Giant",
        desc: "You have proficiency in the Athletics skill. In addition, you count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift.",
        key: true,
      },
      {
        title: "Stone's Endurance",
        desc: "When you take damage, you can use your reaction to roll a d12. Add your Constitution modifier to the number rolled, and reduce the damage by that total.",
        key: true,
      },
    ],
  },
  Orc: {
    description:
      "Fierce warriors with a strong connection to their tribes, known for their resilience and bursts of adrenaline.",
    speed: "30ft",
    traits: [
      {
        title: "Darkvision",
        desc: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.",
        key: true,
      },
      {
        title: "Adrenaline Rush",
        desc: "As a bonus action, you can move up to your Speed toward an enemy of your choice that you can see or hear. You must end this move closer to the enemy than you started.",
        key: true,
      },
      {
        title: "Relentless Endurance",
        desc: "When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. You can’t use this feature again until you finish a long rest.",
        key: false,
      },
    ],
  },
  Tiefling: {
    description:
      "Humanoids with an infernal bloodline, which gives them their classic horns, tails, and a resistance to fire.",
    speed: "30ft",
    traits: [
      {
        title: "Darkvision",
        desc: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.",
        key: true,
      },
      {
        title: "Hellish Resistance",
        desc: "You have resistance to fire damage.",
        key: true,
      },
      {
        title: "Infernal Legacy",
        desc: "You know the Thaumaturgy cantrip.",
        key: false,
      },
    ],
  },
  Aasimar: {
    description:
      "Beings with a touch of the divine in their ancestry, often seen as guardians of good and justice.",
    speed: "30ft",
    traits: [
      {
        title: "Darkvision",
        desc: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.",
        key: true,
      },
      {
        title: "Celestial Resistance",
        desc: "You have resistance to necrotic damage and radiant damage.",
        key: true,
      },
      {
        title: "Healing Hands",
        desc: "As an action, you can touch a creature and cause it to regain a number of hit points equal to your level.",
        key: false,
      },
    ],
  },
};

export const BACKGROUNDS = {
  Acolyte: {
    description:
      "You have spent your life in the service of a temple to a specific god or pantheon.",
    skills: ["Insight", "Religion"],
    abilityScoreIncrease: ["int", "wis", "cha"],
    feature: {
      title: "Shelter of the Faithful",
      desc: "You and your adventuring companions can expect to receive free healing and care at a temple, shrine, or other established presence of your faith.",
      key: false,
    },
  },
  Charlatan: {
    description:
      "You have always had a way with people. You know what makes them tick, and you can tease out their hearts' desires after a few minutes of conversation.",
    skills: ["Deception", "Sleight of Hand"],
    abilityScoreIncrease: ["dex", "int", "cha"],
    feature: {
      title: "False Identity",
      desc: "You have created a second identity that includes documentation, established acquaintances, and disguises that allow you to assume that persona.",
      key: false,
    },
  },
  Criminal: {
    description:
      "You are an experienced criminal with a history of breaking the law.",
    skills: ["Deception", "Stealth"],
    abilityScoreIncrease: ["dex", "int", "cha"],
    feature: {
      title: "Criminal Contact",
      desc: "You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals.",
      key: false,
    },
  },
  Entertainer: {
    description:
      "You thrive in front of an audience. You know how to entrance them, entertain them, and even inspire them.",
    skills: ["Acrobatics", "Performance"],
    abilityScoreIncrease: ["dex", "wis", "cha"],
    feature: {
      title: "By Popular Demand",
      desc: "You can always find a place to perform, usually in an inn or tavern but possibly with a circus, at a theater, or even in a noble’s court.",
      key: false,
    },
  },
  "Folk Hero": {
    description:
      "You come from a humble social rank, but you are destined for so much more. Already the people of your home village regard you as their champion.",
    skills: ["Animal Handling", "Survival"],
    abilityScoreIncrease: ["str", "wis", "cha"],
    feature: {
      title: "Rustic Hospitality",
      desc: "Since you come from the ranks of the common folk, you fit in among them with ease. You can find a place to hide, rest, or recuperate among other commoners.",
      key: false,
    },
  },
  Gladiator: {
    description:
      "You fought for the amusement of others, likely as a slave. You have a well-honed fighting style and a showman's flair.",
    skills: ["Acrobatics", "Performance"],
    abilityScoreIncrease: ["str", "dex", "cha"],
    feature: {
      title: "By Popular Demand",
      desc: "You can always find a place to perform, usually in an inn or tavern but possibly with a circus, at a theater, or even in a noble’s court.",
      key: false,
    },
  },
  "Guild Artisan": {
    description:
      "You are a member of an artisan's guild, skilled in a particular field and closely associated with other artisans.",
    skills: ["Insight", "Persuasion"],
    abilityScoreIncrease: ["int", "wis", "cha"],
    feature: {
      title: "Guild Membership",
      desc: "Your guild provides you with lodging and food if necessary, and pays for your funeral expenses.",
      key: false,
    },
  },
  Hermit: {
    description:
      "You lived in seclusion - either in a sheltered community such as a monastery, or entirely alone - for a formative part of your life.",
    skills: ["Medicine", "Religion"],
    abilityScoreIncrease: ["con", "int", "wis"],
    feature: {
      title: "Discovery",
      desc: "The quiet seclusion of your extended hermitage gave you access to a unique and powerful discovery.",
      key: false,
    },
  },
  Knight: {
    description:
      "You were a knight, a warrior who served a noble, a religious order, or a civic institution.",
    skills: ["History", "Persuasion"],
    abilityScoreIncrease: ["str", "con", "cha"],
    feature: {
      title: "Retainers",
      desc: "You have the service of three retainers loyal to your family.",
      key: false,
    },
  },
  Noble: {
    description:
      "You understand wealth, power, and privilege. You carry a noble title, and your family owns land, collects taxes, and wields significant political influence.",
    skills: ["History", "Persuasion"],
    abilityScoreIncrease: ["int", "wis", "cha"],
    feature: {
      title: "Position of Privilege",
      desc: "Thanks to your noble birth, people are inclined to think the best of you.",
      key: false,
    },
  },
  Outlander: {
    description:
      "You grew up in the wilds, far from civilization and the comforts of town and technology.",
    skills: ["Athletics", "Survival"],
    abilityScoreIncrease: ["str", "con", "wis"],
    feature: {
      title: "Wanderer",
      desc: "You have an excellent memory for maps and geography, and you can always recall the general layout of terrain, settlements, and other features around you.",
      key: false,
    },
  },
  Sage: {
    description:
      "You spent years learning the lore of the multiverse. You scoured manuscripts, studied scrolls, and listened to the greatest experts on the subjects that interest you.",
    skills: ["Arcana", "History"],
    abilityScoreIncrease: ["int", "wis", "cha"],
    feature: {
      title: "Researcher",
      desc: "When you attempt to learn or recall a piece of lore, if you do not know that information, you often know where and from whom you can obtain it.",
      key: false,
    },
  },
  Sailor: {
    description:
      "You sailed on a seagoing vessel for years. In that time, you faced down mighty storms, monsters of the deep, and those who wanted to sink your craft.",
    skills: ["Athletics", "Perception"],
    abilityScoreIncrease: ["str", "dex", "wis"],
    feature: {
      title: "Ship's Passage",
      desc: "When you need to, you can secure free passage on a sailing ship for yourself and your adventuring companions.",
      key: false,
    },
  },
  Soldier: {
    description:
      "War has been your life for as long as you care to remember. You trained as a youth, studied the use of weapons and armor, learned basic survival techniques, and honed them.",
    skills: ["Athletics", "Intimidation"],
    abilityScoreIncrease: ["str", "con", "cha"],
    feature: {
      title: "Military Rank",
      desc: "You have a military rank from your career as a soldier. Soldiers loyal to your former military organization still recognize your authority and influence.",
      key: false,
    },
  },
  Urchin: {
    description:
      "You grew up on the streets alone, orphaned, and poor. You had no one to watch over you or provide for you, which taught you to be self-sufficient.",
    skills: ["Sleight of Hand", "Stealth"],
    abilityScoreIncrease: ["dex", "con", "wis"],
    feature: {
      title: "City Secrets",
      desc: "You know the secret patterns and flow of cities and can find passages through the urban sprawl that others would miss.",
      key: false,
    },
  },
};
