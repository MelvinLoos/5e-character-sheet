// Background definitions.
import type { BackgroundData } from '@/types/rules'

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
