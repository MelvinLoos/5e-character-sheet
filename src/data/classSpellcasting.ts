// Spellcasting feats and abilities granted by spellcasting classes.
import type { CharacterFeature } from '@/types/character'
import type { AbilityKey, CasterType } from '@/types/enums'

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
