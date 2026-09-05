import { legacyHtmlToMarkdown } from './markdown'

import { EQUIPMENT_CATALOG } from '@/data/equipment-items'

// Migration helpers for character data
export function migrateUsesToResource(character: unknown) {
  if (!character || typeof character !== 'object') return character

  const ch = character as { features?: unknown[] }
  if (!Array.isArray(ch.features)) return character

  ch.features = ch.features.map((f) => {
    if (!f || typeof f !== 'object') return f

    const feat = f as Record<string, unknown>

    // If feature already has a resource, leave it
    if (feat.resource) return feat

    // If legacy uses exists, convert to resource
    if (feat.uses && typeof feat.uses === 'object') {
      const uses = feat.uses as Record<string, unknown>
      const total = typeof uses.total === 'number' ? uses.total : undefined
      const per = typeof uses.per === 'string' ? (uses.per as string).toLowerCase() : undefined

      // Determine reset mapping
      let reset = 'Special'
      if (per) {
        if (per.includes('short')) reset = 'Short Rest'
        else if (per.includes('long')) reset = 'Long Rest'
        else if (per.includes('dawn')) reset = 'Dawn'
        else if (per.includes('initiative')) reset = 'Initiative'
        else if (per.includes('turn')) reset = 'Turn'
        else if (per.includes('round')) reset = 'Round'
        else if (per.includes('encounter')) reset = 'Encounter'
        else if (per.includes('day')) reset = 'Day'
        else if (per.includes('week')) reset = 'Week'
      }

      const value = typeof total === 'number' ? total : 1

      feat.resource = {
        resourceType: 'static',
        value,
        scalingStat: null,
        reset,
      }

      // Keep legacy `uses` for backward compatibility but mark it as migrated
      feat._migratedFromUses = true
    }

    return feat
  })

  return ch
}

export function migrateLevelToRenown(character: unknown) {
  if (!character || typeof character !== 'object') return character

  const ch = character as Record<string, unknown>

  if (ch.renownTier === undefined) {
    if (typeof ch.level === 'number') {
      const level = ch.level
      let tier = 1
      if (level >= 5 && level <= 8) {
        tier = 2
      } else if (level >= 9) {
        tier = 3
      }
      ch.renownTier = tier
      ch.renownMilestones = 0
      delete ch.level
    } else {
      ch.renownTier = 1
      ch.renownMilestones = 0
    }
  }

  return ch
}

/**
 * Backfill `catalogId` on equipped gear for characters saved before the
 * dynamic AC feature. Older gear entries only stored a random runtime UUID
 * in `id`, so the AC calculator could not look them up in EQUIPMENT_CATALOG.
 *
 * This migration tries, in order:
 * 1. If `id` already matches a catalog key, use it as `catalogId`.
 * 2. Match `name` (case-insensitive, ignoring "(×N)" quantity suffixes) to a catalog item name.
 */
export function migrateEquippedGearCatalogIds(character: unknown) {
  if (!character || typeof character !== 'object') return character

  const ch = character as { equippedGear?: unknown[] }
  if (!Array.isArray(ch.equippedGear)) return character

  const catalogByName = new Map(
    Object.values(EQUIPMENT_CATALOG).map((item) => [item.name.toLowerCase(), item.id]),
  )

  ch.equippedGear = ch.equippedGear.map((g) => {
    if (!g || typeof g !== 'object') return g
    const gear = g as Record<string, unknown>
    if (typeof gear.catalogId === 'string' && gear.catalogId) return gear

    const id = typeof gear.id === 'string' ? gear.id : ''
    if (EQUIPMENT_CATALOG[id]) {
      gear.catalogId = id
      return gear
    }

    const name = typeof gear.name === 'string' ? gear.name : ''
    const normalizedName = name
      .replace(/\s*\(×\d+\)\s*$/, '')
      .trim()
      .toLowerCase()
    const catalogId = catalogByName.get(normalizedName)
    if (catalogId) {
      gear.catalogId = catalogId
    }

    return gear
  })

  return ch
}

/**
 * Normalizes legacy HTML (<ul>/<li>/<p>/<br>/<strong>/<em>) inside spell,
 * feature, and gear descriptions to Markdown (#215).
 *
 * Idempotent: descriptions that are already Markdown are unchanged, so the
 * migration is safe to re-run on already-migrated characters.
 */
export function migrateDescriptionHtmlToMarkdown(character: unknown): unknown {
  if (!character || typeof character !== 'object') return character

  const result: Record<string, unknown> = { ...(character as Record<string, unknown>) }

  const normalizeDesc = (entry: unknown): unknown => {
    if (!entry || typeof entry !== 'object') return entry
    const obj = entry as Record<string, unknown>
    if (typeof obj.desc !== 'string') return entry
    return { ...obj, desc: legacyHtmlToMarkdown(obj.desc) }
  }

  const normalizeDescription = (entry: unknown): unknown => {
    if (!entry || typeof entry !== 'object') return entry
    const obj = entry as Record<string, unknown>
    if (typeof obj.description !== 'string') return entry
    return { ...obj, description: legacyHtmlToMarkdown(obj.description) }
  }

  if (Array.isArray(result.spells)) result.spells = result.spells.map(normalizeDesc)
  if (Array.isArray(result.features)) result.features = result.features.map(normalizeDesc)
  if (Array.isArray(result.equippedGear)) {
    result.equippedGear = result.equippedGear.map(normalizeDescription)
  }
  if (Array.isArray(result.consumables)) {
    result.consumables = result.consumables.map(normalizeDescription)
  }

  return result
}

export default migrateUsesToResource
