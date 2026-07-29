export type GlossaryTopic =
  | 'point-buy'
  | 'renown-system'
  | 'inventory-slots'
  | 'supply-currency'
  | 'influence-currency'
  | 'usage-dice'
  | 'great-work-progression';

export interface RuleExplanation {
  title: string;
  content: string;
}

export const RULE_GLOSSARY: Record<GlossaryTopic, RuleExplanation> = {
  'point-buy': {
    title: 'Point-Buy & ASI',
    content:
      'Our campaign uses a 27-point buy system (scores 8–15). Additionally, Ability Score Increases (ASI) are tied to your Background (+2 / +1) rather than your Species or standard Class progression.',
  },
  'renown-system': {
    title: 'Renown Progression',
    content:
      'Renown is a custom progression system representing your reputation. Earning Renown unlocks special faction perks, downtime activities, and unique crafting recipes.',
  },
  'inventory-slots': {
    title: 'Inventory Slots',
    content:
      'Instead of tracking weight in pounds, your carrying capacity uses a slot-based system. Each point of Strength grants 1 inventory slot. Most standard items occupy 1 slot; larger items (heavy armor, two-handed weapons) require 2–3 slots.',
  },
  'supply-currency': {
    title: 'Supply Currency',
    content:
      'Supply is an abstract survival resource covering food, water, ammunition, and mundane consumables. 1 inventory slot holds 5 Supply. Supply can be purchased with Gold (1 GP = 1 Supply) and is consumed during rests and downtime.',
  },
  'influence-currency': {
    title: 'Influence Currency',
    content:
      'Influence represents your political capital, favors owed, and social standing. It functions as a meta-currency that can be spent to call in favors, gain audiences with powerful NPCs, or sway political decisions.',
  },
  'usage-dice': {
    title: 'Usage Dice',
    content:
      'Consumable items with limited uses (torches, rations, magical charges) use a Usage Die mechanic. After each use, roll the Usage Die (starting at d8). On a 1–2, it degrades (d8 → d6 → d4). A 1–2 on a d4 means the item is fully expended.',
  },
  'great-work-progression': {
    title: 'Great Work Progression',
    content:
      'Character advancement uses Tier-based milestones instead of standard XP. To reach the next Tier, you must complete "Great Works" — major story accomplishments, faction quests, or significant personal achievements. Each Tier unlocks new class features, spell levels, and capabilities.',
  },
};
