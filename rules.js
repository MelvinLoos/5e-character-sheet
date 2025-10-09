// A simplified library of D&D 2024 rules for the character sheet creator.

export const ABILITIES = {
    str: "Strength",
    dex: "Dexterity",
    con: "Constitution",
    int: "Intelligence",
    wis: "Wisdom",
    cha: "Charisma"
};

export const SKILLS = {
    "Acrobatics": "dex", "Animal Handling": "wis", "Arcana": "int", 
    "Athletics": "str", "Deception": "cha", "History": "int", 
    "Insight": "wis", "Intimidation": "cha", "Investigation": "int", 
    "Medicine": "wis", "Nature": "int", "Perception": "wis", 
    "Performance": "cha", "Persuasion": "cha", "Religion": "int", 
    "Sleight of Hand": "dex", "Stealth": "dex", "Survival": "wis"
};

export const PROFICIENCY_BONUS_PROGRESSION = {
    1: 2, 5: 3, 9: 4, 13: 5, 17: 6
};

export const SPELL_SLOT_PROGRESSION = {
    "full": {
        1: { "level1": 2 },
        2: { "level1": 3 },
        3: { "level1": 4, "level2": 2 },
        4: { "level1": 4, "level2": 3 },
        5: { "level1": 4, "level2": 3, "level3": 2 }
    }
    // Other caster types (half, third) can be added here
};

export const CLASSES = {
    "Barbarian": { hitDice: 12, hitDiceAverage: 7, savingThrows: ["str", "con"], skillChoices: 2, casterType: null },
    "Bard": { hitDice: 8, hitDiceAverage: 5, savingThrows: ["dex", "cha"], skillChoices: 3, casterType: "full" },
    "Cleric": { hitDice: 8, hitDiceAverage: 5, savingThrows: ["wis", "cha"], skillChoices: 2, casterType: "full" },
    "Druid": { hitDice: 8, hitDiceAverage: 5, savingThrows: ["int", "wis"], skillChoices: 2, casterType: "full" },
    "Fighter": { hitDice: 10, hitDiceAverage: 6, savingThrows: ["str", "con"], skillChoices: 2, casterType: null },
    "Monk": { hitDice: 8, hitDiceAverage: 5, savingThrows: ["str", "dex"], skillChoices: 2, casterType: null },
    "Paladin": { hitDice: 10, hitDiceAverage: 6, savingThrows: ["wis", "cha"], skillChoices: 2, casterType: "half" },
    "Ranger": { hitDice: 10, hitDiceAverage: 6, savingThrows: ["str", "dex"], skillChoices: 3, casterType: "half" },
    "Rogue": { hitDice: 8, hitDiceAverage: 5, savingThrows: ["dex", "int"], skillChoices: 4, casterType: null },
    "Sorcerer": { hitDice: 6, hitDiceAverage: 4, savingThrows: ["con", "cha"], skillChoices: 2, casterType: "full" },
    "Warlock": { hitDice: 8, hitDiceAverage: 5, savingThrows: ["wis", "cha"], skillChoices: 2, casterType: "pact" },
    "Wizard": { hitDice: 6, hitDiceAverage: 4, savingThrows: ["int", "wis"], skillChoices: 2, casterType: "full" }
};

export const SPECIES = {
    "Human": {
        speed: "30ft",
        traits: [
            { title: "Resourceful", desc: "You gain one Skill Proficiency of your choice.", key: true },
            { title: "Skillful", desc: "You gain Inspiration whenever you finish a Long Rest.", key: true },
            { title: "Versatile", desc: "You gain the Skilled feat or another 1st-level feat of your choice.", key: false }
        ]
    },
    "Elf": {
        speed: "30ft",
        traits: [
            { title: "Darkvision", desc: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.", key: true },
            { title: "Fey Ancestry", desc: "You have advantage on saving throws against being Charmed, and magic can’t put you to sleep.", key: true },
            { title: "Trance", desc: "You don’t need to sleep. Instead, you meditate deeply, remaining semiconscious, for 4 hours a day.", key: false }
        ]
    },
    "Dwarf": {
        speed: "25ft",
        traits: [
            { title: "Darkvision", desc: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.", key: true },
            { title: "Dwarven Resilience", desc: "You have advantage on saving throws against poison, and you have resistance against poison damage.", key: true },
            { title: "Stonecunning", desc: "Whenever you make an Intelligence (History) check related to the origin of stonework, you are considered proficient in the History skill and add double your proficiency bonus to the check.", key: false }
        ]
    },
     "Gnome": {
        speed: "25ft",
        traits: [
            { title: "Darkvision", desc: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.", key: true },
            { title: "Gnome Cunning", desc: "You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.", key: true }
        ]
    },
    "Halfling": {
        speed: "25ft",
        traits: [
            { title: "Lucky", desc: "When you roll a 1 on a d20 for an attack roll, ability check, or saving throw, you can reroll the die and must use the new roll.", key: true },
            { title: "Brave", desc: "You have advantage on saving throws against being Frightened.", key: true },
            { title: "Halfling Nimbleness", desc: "You can move through the space of any creature that is of a size larger than yours.", key: false }
        ]
    },
    "Dragonborn": {
        speed: "30ft",
        traits: [
            { title: "Draconic Ancestry", desc: "You have a draconic ancestry. Choose one type of dragon from the Draconic Ancestry table. Your breath weapon and damage resistance are determined by the dragon type.", key: true },
            { title: "Breath Weapon", desc: "You can use your action to exhale destructive energy.", key: true },
            { title: "Damage Resistance", desc: "You have resistance to the damage type associated with your draconic ancestry.", key: false }
        ]
    },
    "Goliath": {
        speed: "30ft",
        traits: [
            { title: "Little Giant", desc: "You have proficiency in the Athletics skill. In addition, you count as one size larger when determining your carrying capacity and the weight you can push, drag, or lift.", key: true },
            { title: "Stone's Endurance", desc: "When you take damage, you can use your reaction to roll a d12. Add your Constitution modifier to the number rolled, and reduce the damage by that total.", key: true }
        ]
    },
    "Orc": {
        speed: "30ft",
        traits: [
            { title: "Darkvision", desc: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.", key: true },
            { title: "Adrenaline Rush", desc: "As a bonus action, you can move up to your Speed toward an enemy of your choice that you can see or hear. You must end this move closer to the enemy than you started.", key: true },
            { title: "Relentless Endurance", desc: "When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead. You can’t use this feature again until you finish a long rest.", key: false }
        ]
    },
    "Tiefling": {
        speed: "30ft",
        traits: [
            { title: "Darkvision", desc: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.", key: true },
            { title: "Hellish Resistance", desc: "You have resistance to fire damage.", key: true },
            { title: "Infernal Legacy", desc: "You know the Thaumaturgy cantrip.", key: false }
        ]
    },
    "Aasimar": {
        speed: "30ft",
        traits: [
            { title: "Darkvision", desc: "You can see in dim light within 60 feet of you as if it were bright light, and in darkness as if it were dim light.", key: true },
            { title: "Celestial Resistance", desc: "You have resistance to necrotic damage and radiant damage.", key: true },
            { title: "Healing Hands", desc: "As an action, you can touch a creature and cause it to regain a number of hit points equal to your level.", key: false }
        ]
    }
};

