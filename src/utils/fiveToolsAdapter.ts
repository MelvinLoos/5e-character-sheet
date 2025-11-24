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

/**
 * Interface for 5e.tools spell data structure
 */
interface FiveToolsSpell {
  name: string
  level: number
  school?: string
  time?: Array<{ number: number; unit: string }> | unknown
  range?: { type: string; distance?: { type: string; amount?: number } } | unknown
  components?: { v?: boolean; s?: boolean; m?: string | boolean } | unknown
  duration?: Array<{ type: string; duration?: { type: string; amount?: number } }> | unknown
  entries?: unknown[]
  entriesHigherLevel?: Array<{ type: string; name: string; entries: unknown[] }> | unknown
  source?: string
  meta?: { ritual?: boolean }
  [key: string]: unknown
}

/**
 * Interface for our app's spell schema
 */
export interface AppSpell {
  name: string
  level: number
  desc: string
  source?: string
  school?: string
  castingTime?: string
  range?: string
  components?: string
  duration?: string
  concentration?: boolean
}

/**
 * Maps a 5e.tools spell object to our app's spell schema
 */
export function mapSpell(fiveToolsSpell: unknown): AppSpell | null {
  if (!fiveToolsSpell || typeof fiveToolsSpell !== 'object') {
    return null
  }

  const spell = fiveToolsSpell as FiveToolsSpell

  // Required fields
  if (!spell.name || typeof spell.level !== 'number') {
    return null
  }

  // Build description from entries
  let desc = ''
  if (spell.entries) {
    desc = sanitizeText(spell.entries)
  }

  // Add "At Higher Levels" section if present
  if (Array.isArray(spell.entriesHigherLevel) && spell.entriesHigherLevel.length > 0) {
    const higherLevel = spell.entriesHigherLevel[0]
    if (higherLevel && typeof higherLevel === 'object') {
      const hlObj = higherLevel as { entries?: unknown[] }
      if (hlObj.entries) {
        const hlText = sanitizeText(hlObj.entries)
        if (hlText) {
          desc += '\n\n**At Higher Levels:** ' + hlText
        }
      }
    }
  }

  if (!desc) {
    desc = 'No description available.'
  }

  return {
    name: spell.name,
    level: spell.level,
    desc,
    source: mapSource(spell.source),
    school: mapSchool(spell.school),
    castingTime: mapCastingTime(spell.time),
    range: mapRange(spell.range),
    components: mapComponents(spell.components),
    duration: mapDuration(spell.duration),
    concentration: checkConcentration(spell.duration),
  }
}

/**
 * Map school abbreviation to full name
 */
function mapSchool(school: unknown): string | undefined {
  if (typeof school !== 'string') return undefined

  const schoolMap: Record<string, string> = {
    A: 'Abjuration',
    C: 'Conjuration',
    D: 'Divination',
    E: 'Evocation',
    I: 'Illusion',
    N: 'Necromancy',
    T: 'Transmutation',
    V: 'Enchantment',
  }

  return schoolMap[school] || school
}

/**
 * Map source abbreviation to readable format
 */
function mapSource(source: unknown): string | undefined {
  if (typeof source !== 'string') return undefined

  const sourceMap: Record<string, string> = {
    PHB: "Player's Handbook",
    XGE: "Xanathar's Guide",
    TCE: "Tasha's Cauldron",
    SCAG: 'Sword Coast Guide',
    EE: 'Elemental Evil',
  }

  return sourceMap[source] || source
}

/**
 * Map casting time to readable string
 */
function mapCastingTime(time: unknown): string | undefined {
  if (!time || !Array.isArray(time) || time.length === 0) return undefined

  const timeObj = time[0]
  if (!timeObj || typeof timeObj !== 'object') return undefined

  const t = timeObj as { number?: number; unit?: string }
  const num = t.number || 1
  const unit = t.unit || 'action'

  if (num === 1) {
    return `1 ${capitalizeFirst(unit)}`
  }

  return `${num} ${capitalizeFirst(unit)}s`
}

/**
 * Map range to readable string
 */
function mapRange(range: unknown): string | undefined {
  if (!range || typeof range !== 'object') return undefined

  const r = range as { type?: string; distance?: { type?: string; amount?: number } }

  if (r.type === 'point') {
    if (r.distance?.type === 'self') return 'Self'
    if (r.distance?.type === 'touch') return 'Touch'
    if (r.distance?.amount) {
      return `${r.distance.amount} feet`
    }
  }

  if (r.type === 'cone' && r.distance?.amount) {
    return `Self (${r.distance.amount}-foot cone)`
  }

  if (r.type === 'line' && r.distance?.amount) {
    return `Self (${r.distance.amount}-foot line)`
  }

  if (r.type === 'sphere' && r.distance?.amount) {
    return `${r.distance.amount}-foot radius`
  }

  if (r.type === 'sight') return 'Sight'
  if (r.type === 'unlimited') return 'Unlimited'

  return undefined
}

/**
 * Map components to readable string
 */
function mapComponents(components: unknown): string | undefined {
  if (!components || typeof components !== 'object') return undefined

  const c = components as { v?: boolean; s?: boolean; m?: string | boolean }
  const parts: string[] = []

  if (c.v) parts.push('V')
  if (c.s) parts.push('S')
  if (c.m) {
    if (typeof c.m === 'string') {
      parts.push(`M (${c.m})`)
    } else {
      parts.push('M')
    }
  }

  return parts.length > 0 ? parts.join(', ') : undefined
}

/**
 * Map duration to readable string
 */
function mapDuration(duration: unknown): string | undefined {
  if (!duration || !Array.isArray(duration) || duration.length === 0) return undefined

  const durObj = duration[0]
  if (!durObj || typeof durObj !== 'object') return undefined

  const d = durObj as {
    type?: string
    duration?: { type?: string; amount?: number }
    concentration?: boolean
  }

  if (d.type === 'instant') return 'Instantaneous'
  if (d.type === 'permanent') return 'Until dispelled'
  if (d.type === 'special') return 'Special'

  if (d.type === 'timed' && d.duration) {
    const amount = d.duration.amount || 1
    const unit = d.duration.type || 'round'
    const timeStr =
      amount === 1 ? `1 ${capitalizeFirst(unit)}` : `${amount} ${capitalizeFirst(unit)}s`

    if (d.concentration) {
      return `Concentration, up to ${timeStr}`
    }
    return timeStr
  }

  return undefined
}

/**
 * Check if spell requires concentration
 */
function checkConcentration(duration: unknown): boolean {
  if (!duration || !Array.isArray(duration) || duration.length === 0) return false

  const durObj = duration[0]
  if (!durObj || typeof durObj !== 'object') return false

  const d = durObj as { concentration?: boolean }
  return d.concentration === true
}

/**
 * Capitalize first letter of string
 */
function capitalizeFirst(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Batch map multiple 5e.tools spells
 */
export function mapSpells(fiveToolsSpells: unknown[]): AppSpell[] {
  return fiveToolsSpells
    .map((spell) => mapSpell(spell))
    .filter((spell): spell is AppSpell => spell !== null)
}

// ============================
// FEAT/FEATURE MAPPING
// ============================

/**
 * 5e.tools feat structure (simplified - we only map what we need)
 */
interface FiveToolsFeat {
  name: string
  source?: string
  entries?: unknown[]
  ability?: unknown[] // ASI/feat bonuses
  prerequisite?: unknown[] // Prerequisites (we skip parsing for v1)
  feats?: unknown // Related feats
}

/**
 * App feature schema (subset - matching schema.json)
 */
interface AppFeature {
  title: string
  desc: string
  source?: string
  featureType?: string
  actionType?: string
  grantsSpells?: boolean
  key?: boolean
}

/**
 * Map a single 5e.tools feat to app feature schema
 */
export function mapFeat(fiveToolsFeat: unknown): AppFeature | null {
  if (!fiveToolsFeat || typeof fiveToolsFeat !== 'object') {
    return null
  }

  const feat = fiveToolsFeat as FiveToolsFeat

  // Required: name
  if (!feat.name || typeof feat.name !== 'string') {
    return null
  }

  // Build description from entries
  const desc = feat.entries && Array.isArray(feat.entries)
    ? sanitizeText(feat.entries)
    : 'No description available.'

  // Build the feature object
  const feature: AppFeature = {
    title: feat.name,
    desc,
  }

  // Map source if available
  if (feat.source) {
    feature.source = mapSource(feat.source)
  }

  // Determine feature type
  // For feats from 5e.tools, we default to "General Feat"
  // (could be refined with more logic later)
  feature.featureType = 'General Feat'

  // Check if feat grants spells (look for spellcasting in entries)
  if (desc.toLowerCase().includes('spell') || desc.toLowerCase().includes('cantrip')) {
    feature.grantsSpells = true
  }

  return feature
}

/**
 * Map a 5e.tools class/species/background feature to app feature schema
 * These have a different structure than feats - they come from class/species JSON
 */
export function mapClassFeature(
  fiveToolsFeature: unknown,
  featureType: 'Class Feature' | 'Species Trait' | 'Background Feature'
): AppFeature | null {
  if (!fiveToolsFeature || typeof fiveToolsFeature !== 'object') {
    return null
  }

  const feat = fiveToolsFeature as { name?: string; entries?: unknown[]; source?: string }

  // Required: name
  if (!feat.name || typeof feat.name !== 'string') {
    return null
  }

  // Build description from entries
  const desc = feat.entries && Array.isArray(feat.entries)
    ? sanitizeText(feat.entries)
    : 'No description available.'

  // Build the feature object
  const feature: AppFeature = {
    title: feat.name,
    desc,
    featureType,
  }

  // Map source if available
  if (feat.source) {
    feature.source = mapSource(feat.source)
  }

  // Check if feature grants spells
  if (desc.toLowerCase().includes('spell') || desc.toLowerCase().includes('cantrip')) {
    feature.grantsSpells = true
  }

  // Detect action type from common keywords
  const lowerDesc = desc.toLowerCase()
  if (lowerDesc.includes('bonus action')) {
    feature.actionType = 'Bonus Action'
  } else if (lowerDesc.includes('reaction')) {
    feature.actionType = 'Reaction'
  } else if (lowerDesc.includes('as an action') || lowerDesc.includes('use your action')) {
    feature.actionType = 'Action'
  }

  return feature
}

/**
 * Batch map multiple 5e.tools feats
 */
export function mapFeats(fiveToolsFeats: unknown[]): AppFeature[] {
  return fiveToolsFeats
    .map((feat) => mapFeat(feat))
    .filter((feat): feat is AppFeature => feat !== null)
}

/**
 * Batch map class/species/background features
 */
export function mapClassFeatures(
  fiveToolsFeatures: unknown[],
  featureType: 'Class Feature' | 'Species Trait' | 'Background Feature'
): AppFeature[] {
  return fiveToolsFeatures
    .map((feature) => mapClassFeature(feature, featureType))
    .filter((feature): feature is AppFeature => feature !== null)
}
