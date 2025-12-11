/**
 * Adapter utilities for importing 5e.tools JSON data.
 * Converts 5e.tools specific formats (tags, nested entries) into clean Markdown strings.
 */

/**
 * Recursively processes 5e.tools entries arrays and converts them to Markdown strings.
 * Handles nested arrays, objects, and inline tags like {@spell ...}, {@damage ...}, etc.
 *
 * @param entries - The entries array/object from 5e.tools data
 * @returns Clean Markdown string
 */
export function sanitizeText(entries: unknown): string {
  // Handle null/undefined
  if (entries === null || entries === undefined) {
    return ''
  }

  // Handle string input
  if (typeof entries === 'string') {
    return processInlineTags(entries)
  }

  // Handle array of entries
  if (Array.isArray(entries)) {
    const processed = entries
      .map((entry) => sanitizeText(entry))
      .filter((text) => text.trim().length > 0)
    return processed.join('\n\n')
  }

  // Handle object entries (like {type: "entries", name: "...", entries: [...]})
  if (typeof entries === 'object') {
    const obj = entries as Record<string, unknown>

    // Handle table structures
    if (obj.type === 'table') {
      return processTable(obj)
    }

    // Handle list structures
    if (obj.type === 'list') {
      return processList(obj)
    }

    // Handle nested entries
    if (obj.type === 'entries' && Array.isArray(obj.entries)) {
      let result = ''
      if (obj.name && typeof obj.name === 'string') {
        result = `**${processInlineTags(obj.name)}**\n\n`
      }
      result += sanitizeText(obj.entries)
      return result
    }

    // Handle inline entries (bold/italic/etc.)
    if (obj.type === 'inline' && typeof obj.entries === 'string') {
      return processInlineTags(obj.entries)
    }

    // If it has a 'entries' property, recurse into it
    if (obj.entries) {
      return sanitizeText(obj.entries)
    }

    // Otherwise, try to stringify it
    return String(obj)
  }

  return String(entries)
}

/**
 * Process inline 5e.tools tags and convert them to Markdown
 */
function processInlineTags(text: string): string {
  let result = text

  // {@spell SpellName} -> *SpellName*
  result = result.replace(/\{@spell ([^}]+)\}/gi, '*$1*')

  // {@item ItemName} -> *ItemName*
  result = result.replace(/\{@item ([^}]+)\}/gi, '*$1*')

  // {@creature CreatureName} -> **CreatureName**
  result = result.replace(/\{@creature ([^}]+)\}/gi, '**$1**')

  // {@condition ConditionName} -> *ConditionName*
  result = result.replace(/\{@condition ([^}]+)\}/gi, '*$1*')

  // {@damage 1d6} -> 1d6
  result = result.replace(/\{@damage ([^}]+)\}/gi, '$1')

  // {@dice 1d20} -> 1d20
  result = result.replace(/\{@dice ([^}]+)\}/gi, '$1')

  // {@dc 15} -> DC 15
  result = result.replace(/\{@dc (\d+)\}/gi, 'DC $1')

  // {@hit +5} -> +5
  result = result.replace(/\{@hit ([^}]+)\}/gi, '$1')

  // {@atk mw} -> melee weapon attack
  result = result.replace(/\{@atk mw\}/gi, 'melee weapon attack')
  result = result.replace(/\{@atk rw\}/gi, 'ranged weapon attack')
  result = result.replace(/\{@atk ms\}/gi, 'melee spell attack')
  result = result.replace(/\{@atk rs\}/gi, 'ranged spell attack')

  // {@skill SkillName} -> SkillName
  result = result.replace(/\{@skill ([^}]+)\}/gi, '$1')

  // {@ability str} -> Strength
  const abilityMap: Record<string, string> = {
    str: 'Strength',
    dex: 'Dexterity',
    con: 'Constitution',
    int: 'Intelligence',
    wis: 'Wisdom',
    cha: 'Charisma',
  }
  result = result.replace(/\{@ability ([^}]+)\}/gi, (match, ability) => {
    return abilityMap[ability.toLowerCase()] || ability
  })

  // Clean up any remaining unprocessed tags (generic fallback)
  result = result.replace(/\{@\w+ ([^}]+)\}/gi, '$1')

  return result
}

/**
 * Process table structures (simplified - can be expanded)
 */
function processTable(obj: Record<string, unknown>): string {
  // For now, just extract the caption if available
  if (obj.caption && typeof obj.caption === 'string') {
    return `**Table: ${processInlineTags(obj.caption)}**`
  }
  return '[Table]'
}

/**
 * Process list structures
 */
function processList(obj: Record<string, unknown>): string {
  if (!Array.isArray(obj.items)) {
    return ''
  }

  return obj.items
    .map((item) => {
      const text = sanitizeText(item)
      return text ? `- ${text}` : ''
    })
    .filter((line) => line.length > 0)
    .join('\n')
}
