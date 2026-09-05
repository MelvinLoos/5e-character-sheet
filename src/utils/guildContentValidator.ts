/**
 * Validators for guild-scoped homebrew content loaded from Supabase.
 *
 * Each row in `guild_spells`/`guild_feats` contains a JSONB `data` field
 * that must be validated before injection into the rules store.
 */

import type { CharacterSpell, CharacterFeature } from '@/types/character'
import { logger } from '@/utils/logger'
import { legacyHtmlToMarkdown } from '@/utils/markdown'

/**
 * Validate that a raw object conforms to the CharacterSpell shape.
 * Required fields: name (string), level (number), desc (string).
 */
export function isValidGuildSpell(data: unknown): data is CharacterSpell {
  if (!data || typeof data !== 'object' || data === null) {
    logger.warn('Guild spell data is null or not an object:', data)
    return false
  }

  const d = data as Record<string, unknown>

  if (typeof d.name !== 'string' || !d.name.trim()) {
    logger.warn('Guild spell missing or invalid "name":', d.name)
    return false
  }

  if (typeof d.level !== 'number') {
    logger.warn('Guild spell missing or invalid "level":', d.level)
    return false
  }

  // desc is optional — the normalizer defaults it to ""
  return true
}

/**
 * Normalize a raw guild spell into a clean CharacterSpell with safe defaults.
 * Call only after validation passes.
 */
export function normalizeGuildSpell(raw: Record<string, unknown>): CharacterSpell {
  return {
    name: String(raw.name || '').trim(),
    level: Math.max(0, Math.min(9, Number(raw.level) || 0)),
    desc: legacyHtmlToMarkdown(String(raw.desc || '')),
    school: typeof raw.school === 'string' ? (raw.school as CharacterSpell['school']) : undefined,
    castingTime: typeof raw.castingTime === 'string' ? raw.castingTime : undefined,
    range: typeof raw.range === 'string' ? raw.range : undefined,
    components: typeof raw.components === 'string' ? raw.components : undefined,
    duration: typeof raw.duration === 'string' ? raw.duration : undefined,
    concentration: typeof raw.concentration === 'boolean' ? raw.concentration : undefined,
    ritual: typeof raw.ritual === 'boolean' ? raw.ritual : undefined,
    classes: Array.isArray(raw.classes) ? (raw.classes as string[]) : undefined,
    source: typeof raw.source === 'string' ? raw.source : 'Guild',
  }
}

/**
 * Validate that a raw object conforms to the CharacterFeature shape.
 * Required fields: title (string), desc (string).
 */
export function isValidGuildFeat(data: unknown): data is CharacterFeature {
  if (!data || typeof data !== 'object' || data === null) {
    logger.warn('Guild feat data is null or not an object:', data)
    return false
  }

  const d = data as Record<string, unknown>

  if (typeof d.title !== 'string' || !d.title.trim()) {
    logger.warn('Guild feat missing or invalid "title":', d.title)
    return false
  }

  // desc is optional — the normalizer defaults it to ""
  return true
}

/**
 * Normalize a raw guild feat into a clean CharacterFeature with safe defaults.
 * Call only after validation passes.
 */
export function normalizeGuildFeat(raw: Record<string, unknown>): CharacterFeature {
  return {
    title: String(raw.title || '').trim(),
    desc: legacyHtmlToMarkdown(String(raw.desc || '')),
    key: false,
    source: typeof raw.source === 'string' ? raw.source : 'Guild',
    featureType: typeof raw.featureType === 'string' ? raw.featureType : 'Guild Feat',
    actionType: typeof raw.actionType === 'string' ? (raw.actionType as CharacterFeature['actionType']) : undefined,
    prerequisite: typeof raw.prerequisite === 'string' ? raw.prerequisite : undefined,
    grantsSpells: typeof raw.grantsSpells === 'boolean' ? raw.grantsSpells : undefined,
    grantedSpellLevels: Array.isArray(raw.grantedSpellLevels) ? raw.grantedSpellLevels as number[] : undefined,
  }
}