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
    description: "A fierce warrior who can enter a battle rage.",
    hitDice: 12,
    hitDiceAverage: 7,
    savingThrows: ["str", "con"],
    features: [
      {
        title: "Rage",
        desc: "As a bonus action, you can enter a rage. You gain advantage on Strength checks and saves, +2 damage on melee Strength attacks, and resistance to bludgeoning, piercing, and slashing damage. Your rage lasts for 1 minute.",
        uses: { total: 2, per: "Long Rest" },
        key: true,
      },
      {
        title: "Unarmored Defense (Barbarian)",
        desc: "While you are not wearing any armor, your Armor Class equals 10 + your Dexterity modifier + your Constitution modifier.",
        key: false,
      },
    ],
  },
  Bard: {
    description:
      "An inspiring magician whose power echoes the music of creation.",
    hitDice: 8,
    hitDiceAverage: 5,
    savingThrows: ["dex", "cha"],
    features: [
      {
        title: "Spellcasting (Bard)",
        desc: "You can cast bard spells you know. Charisma is your spellcasting ability.",
        casterType: "full",
        key: true,
      },
      {
        title: "Bardic Inspiration",
        desc: "As a bonus action, you can give one creature a d6 inspiration die. Once within 10 minutes, the creature can roll the die and add the number to one ability check, attack roll, or saving throw.",
        uses: { total: 3, per: "Long Rest" },
        key: true,
      },
    ],
  },
  Cleric: {
    description:
      "A priestly champion who wields divine magic in service of a higher power.",
    hitDice: 8,
    hitDiceAverage: 5,
    savingThrows: ["wis", "cha"],
    features: [
      {
        title: "Spellcasting (Cleric)",
        desc: "You can cast cleric spells you have prepared. Wisdom is your spellcasting ability.",
        casterType: "full",
        key: true,
      },
      {
        title: "Channel Divinity",
        desc: "You can channel divine energy to fuel magical effects. You start with one effect: Turn Undead.",
        uses: { total: 1, per: "Short Rest" },
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
    features: [
      {
        title: "Spellcasting (Druid)",
        desc: "You can cast druid spells you have prepared. Wisdom is your spellcasting ability.",
        casterType: "full",
        key: true,
      },
      {
        title: "Wild Shape",
        desc: "As an action, you can magically assume the shape of a beast you have seen before. You can use this feature twice.",
        uses: { total: 2, per: "Short Rest" },
        key: true,
      },
    ],
  },
  Fighter: {
    description:
      "A master of martial combat, skilled with a variety of weapons and armor.",
    hitDice: 10,
    hitDiceAverage: 6,
    savingThrows: ["str", "con"],
    features: [
      {
        title: "Second Wind",
        desc: "On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level.",
        uses: { total: 1, per: "Short Rest" },
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
    features: [
      {
        title: "Spellcasting (Ranger)",
        desc: "You can cast ranger spells you know. Wisdom is your spellcasting ability.",
        casterType: "half",
        key: true,
      },
      {
        title: "Favored Enemy",
        desc: "You have significant experience studying, tracking, hunting, and even talking to a certain type of enemy. Choose a type of favored enemy: beasts, fey, humanoids, monstrosities, or undead. You have advantage on Wisdom (Survival) checks to track your favored enemies, as well as on Intelligence checks to recall information about them.",
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
    features: [
      {
        title: "Sneak Attack",
        desc: "Once per turn, you can deal an extra 1d6 damage to one creature you hit with an attack if you have advantage on the attack roll. The attack must use a finesse or a ranged weapon.",
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
    features: [
      {
        title: "Spellcasting (Sorcerer)",
        desc: "You can cast sorcerer spells you know. Charisma is your spellcasting ability.",
        casterType: "full",
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
    features: [
      {
        title: "Pact Magic (Warlock)",
        desc: "You can cast warlock spells you know. Charisma is your spellcasting ability. You regain all expended spell slots when you finish a short or long rest.",
        casterType: "pact",
        key: true,
      },
    ],
  },
  Wizard: {
    description:
      "A scholarly magic-user capable of manipulating the structures of reality.",
    hitDice: 6,
    hitDiceAverage: 4,
    savingThrows: ["int", "wis"],
    features: [
      {
        title: "Spellcasting (Wizard)",
        desc: "You can cast wizard spells you have prepared. Intelligence is your spellcasting ability.",
        casterType: "full",
        key: true,
      },
      {
        title: "Arcane Recovery",
        desc: "Once per day when you finish a short rest, you can choose expended spell slots to recover. The spell slots can have a combined level that is equal to or less than half your wizard level (rounded up).",
        key: false,
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
      "You have spent your life in the service of a temple to a specific god or pantheon of gods.",
    skills: ["Insight", "Religion"],
    abilityScoreIncrease: ["int", "wis", "cha"],
    feature: {
      title: "Magic Initiate (Cleric)",
      desc: "You learn two cantrips and one 1st-level spell from the Cleric spell list. You can cast the 1st-level spell once per long rest without a spell slot.",
      key: false,
    },
  },
  Artisan: {
    description:
      "You are a member of an artisan's guild, skilled in a particular field and closely associated with other artisans.",
    skills: ["Investigation", "Persuasion"],
    abilityScoreIncrease: ["int", "wis", "cha"],
    feature: {
      title: "Crafter",
      desc: "You gain proficiency with three different types of artisan's tools of your choice.",
      key: false,
    },
  },
  Charlatan: {
    description:
      "You have always had a way with people, knowing what makes them tick and how to manipulate their desires.",
    skills: ["Deception", "Sleight of Hand"],
    abilityScoreIncrease: ["dex", "int", "cha"],
    feature: {
      title: "Alert",
      desc: "You gain a +5 bonus to initiative and can't be surprised while you are conscious.",
      key: false,
    },
  },
  Criminal: {
    description:
      "You have a history of breaking the law and surviving on the wrong side of it.",
    skills: ["Deception", "Stealth"],
    abilityScoreIncrease: ["dex", "int", "cha"],
    feature: {
      title: "Alert",
      desc: "You gain a +5 bonus to initiative and can't be surprised while you are conscious.",
      key: false,
    },
  },
  Entertainer: {
    description:
      "You thrive in front of an audience, knowing how to entrance, entertain, and inspire them.",
    skills: ["Acrobatics", "Performance"],
    abilityScoreIncrease: ["dex", "wis", "cha"],
    feature: {
      title: "Musician",
      desc: "You gain proficiency with three musical instruments of your choice.",
      key: false,
    },
  },
  Farmer: {
    description:
      "You grew up working the land, connected to the earth and the cycles of nature.",
    skills: ["Animal Handling", "Nature"],
    abilityScoreIncrease: ["str", "con", "wis"],
    feature: {
      title: "Tough",
      desc: "Your hit point maximum increases by an amount equal to twice your level.",
      key: false,
    },
  },
  Guard: {
    description:
      "You served as a guard, keeping watch and enforcing the law in a city or stronghold.",
    skills: ["Insight", "Perception"],
    abilityScoreIncrease: ["str", "con", "wis"],
    feature: {
      title: "Alert",
      desc: "You gain a +5 bonus to initiative and can't be surprised while you are conscious.",
      key: false,
    },
  },
  Guide: {
    description:
      "You have spent your life navigating the wilds or treacherous cityscapes, leading others to safety.",
    skills: ["Stealth", "Survival"],
    abilityScoreIncrease: ["dex", "con", "wis"],
    feature: {
      title: "Magic Initiate (Druid)",
      desc: "You learn two cantrips and one 1st-level spell from the Druid spell list. You can cast the 1st-level spell once per long rest without a spell slot.",
      key: false,
    },
  },
  Hermit: {
    description:
      "You lived in seclusion for a formative part of your life, seeking solitude and contemplation.",
    skills: ["Medicine", "Religion"],
    abilityScoreIncrease: ["con", "int", "wis"],
    feature: {
      title: "Magic Initiate (Wizard)",
      desc: "You learn two cantrips and one 1st-level spell from the Wizard spell list. You can cast the 1st-level spell once per long rest without a spell slot.",
      key: false,
    },
  },
  Merchant: {
    description:
      "Your life has been one of hard physical work, granting you strength and endurance.",
    skills: ["Animal Handling", "Persuasion"],
    abilityScoreIncrease: ["con", "int", "cha"],
    feature: {
      title: "Lucky",
      desc: "When you roll a 1 on a d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.",
      key: false,
    },
  },
  Noble: {
    description:
      "You were raised in a family of wealth and privilege, and you carry a noble title.",
    skills: ["History", "Persuasion"],
    abilityScoreIncrease: ["int", "wis", "cha"],
    feature: {
      title: "Skilled",
      desc: "You gain proficiency in any combination of three skills or tools of your choice.",
      key: false,
    },
  },
  Sage: {
    description:
      "You spent years learning the lore of the multiverse, scouring manuscripts and studying scrolls.",
    skills: ["Arcana", "History"],
    abilityScoreIncrease: ["int", "wis", "cha"],
    feature: {
      title: "Magic Initiate (Wizard)",
      desc: "You learn two cantrips and one 1st-level spell from the Wizard spell list. You can cast the 1st-level spell once per long rest without a spell slot.",
      key: false,
    },
  },
  Sailor: {
    description:
      "You have spent years on a seagoing vessel, facing mighty storms and monsters of the deep.",
    skills: ["Perception", "Sleight of Hand"],
    abilityScoreIncrease: ["str", "dex", "wis"],
    feature: {
      title: "Tough",
      desc: "Your hit point maximum increases by an amount equal to twice your level.",
      key: false,
    },
  },
  Scribe: {
    description:
      "You have spent your life learning to read and write, copying texts and preserving knowledge.",
    skills: ["Investigation", "Perception"],
    abilityScoreIncrease: ["dex", "int", "wis"],
    feature: {
      title: "Skilled",
      desc: "You gain proficiency in any combination of three skills or tools of your choice.",
      key: false,
    },
  },
  Soldier: {
    description:
      "War has been your life. You've trained with weapons and armor, learning to fight as part of a larger force.",
    skills: ["Athletics", "Intimidation"],
    abilityScoreIncrease: ["str", "con", "cha"],
    feature: {
      title: "Savage Attacker",
      desc: "Once per turn when you roll damage for a melee weapon attack, you can reroll the weapon's damage dice and use either total.",
      key: false,
    },
  },
  Urchin: {
    description:
      "You grew up on the streets alone, orphaned, and poor, learning to be self-sufficient and cunning.",
    skills: ["Insight", "Stealth"],
    abilityScoreIncrease: ["dex", "wis", "cha"],
    feature: {
      title: "Lucky",
      desc: "When you roll a 1 on a d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.",
      key: false,
    },
  },
};
