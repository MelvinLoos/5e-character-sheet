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

export default migrateUsesToResource
