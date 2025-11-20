// Migration helpers for character data
export function migrateUsesToResource(character: any) {
  if (!character) return character

  if (!Array.isArray(character.features)) return character

  character.features = character.features.map((f: any) => {
    if (!f) return f

    // If feature already has a resource, leave it
    if (f.resource) return f

    // If legacy uses exists, convert to resource
    if (f.uses && typeof f.uses === 'object') {
      const total = typeof f.uses.total === 'number' ? f.uses.total : undefined
      const per = typeof f.uses.per === 'string' ? f.uses.per.toLowerCase() : undefined

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

      f.resource = {
        resourceType: 'static',
        value,
        scalingStat: null,
        reset,
      }

      // Keep legacy `uses` for backward compatibility but mark it as migrated
      f._migratedFromUses = true
    }

    return f
  })

  return character
}

export default migrateUsesToResource
