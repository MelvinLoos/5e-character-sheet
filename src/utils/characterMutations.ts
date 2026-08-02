/**
 * Pure, stateless character data transformation functions.
 *
 * Every function takes a CharacterData (or partial input for migration)
 * and returns a new CharacterData. No Pinia, no Vue reactivity, no side effects.
 *
 * These replace the inline mutation logic in src/stores/character.ts.
 */

import * as DND_RULES from '@/data/rules'
import { migrateUsesToResource, migrateLevelToRenown } from './migrations'
import { getMod } from '@/domain'
import type { CharacterData, CharacterFeature } from '@/types/character'
import { resolveStartingEquipment } from './equipmentResolver'
import type { StartingEquipmentState } from '@/types/equipment'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Shallow clone of a character object to maintain immutability contract. */
function cloneChar<T extends CharacterData>(char: T): T {
  return { ...char }
}

// ---------------------------------------------------------------------------
// migrateCharacterData
// ---------------------------------------------------------------------------

/**
 * Migrate and fill any legacy or incomplete character data into a valid
 * CharacterData shape. Replaces the store's _migrateLegacyCharacter.
 */
export function migrateCharacterData(data: unknown): CharacterData {
  // Start with a shallow copy of the incoming object
  let migrated: Record<string, unknown> = { ...(data as Record<string, unknown>) }

  // Apply migrations
  migrated = migrateUsesToResource(migrated) as Record<string, unknown>
  migrated = migrateLevelToRenown(migrated) as Record<string, unknown>

  // Ensure jobInParty exists
  migrated.jobInParty = (migrated.jobInParty as string) ?? ''

  // Ensure backgroundBonusSelections
  if (!migrated.backgroundBonusSelections) {
    migrated.backgroundBonusSelections = { plusTwo: null, plusOne: null }
  }

  // Ensure pointBuyBaseScores
  if (!migrated.pointBuyBaseScores) {
    if (migrated.abilityScores) {
      migrated.pointBuyBaseScores = { ...(migrated.abilityScores as Record<string, number>) }
    } else {
      migrated.pointBuyBaseScores = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }
    }
  }

  // Ensure abilityScores
  if (!migrated.abilityScores) {
    migrated.abilityScores = { ...(migrated.pointBuyBaseScores as Record<string, number>) }
  }

  // Ensure proficiencies structure
  if (!migrated.proficiencies) {
    migrated.proficiencies = {
      skills: (migrated.skills as string[]) || [],
      savingThrows: (migrated.savingThrows as string[]) || [],
    }
  }

  // Ensure features array
  if (!migrated.features) {
    migrated.features = []
  }

  // Auto-add missing spellcasting feature
  if (migrated.class && migrated.spellcasting) {
    const features = migrated.features as unknown[]
    const hasSpellcastingFeature = features.some((f: unknown) => {
      const ff = f as Record<string, unknown>
      return (
        typeof ff.title === 'string' &&
        ff.title.toLowerCase().includes('spellcasting') &&
        !!ff.casterType
      )
    })

    if (!hasSpellcastingFeature) {
      let casterType = 'full'
      const className = ((migrated.class as string) || '').replace(/\s*\(.*\)/, '')

      if (['Ranger', 'Paladin'].includes(className)) {
        casterType = 'half'
      } else if (['Eldritch Knight', 'Arcane Trickster'].includes(className)) {
        casterType = 'third'
      } else if (className === 'Warlock') {
        casterType = 'pact'
      }

      ;(migrated.features as unknown[]).push({
        title: `Spellcasting (${className})`,
        desc: `You can cast ${className.toLowerCase()} spells. ${(migrated.spellcasting as Record<string, unknown>).ability} is your spellcasting ability.`,
        casterType: casterType,
        key: true,
      })
    }
  }

  // Ensure spells
  if (!migrated.spells) {
    migrated.spells = []
  }

  // Ensure combat
  if (!migrated.combat) {
    migrated.combat = { ac: 10, hp_max: 1, hp_current: 1, speed: '30ft' }
  } else {
    const combat = migrated.combat as Record<string, unknown>
    if (combat.hp_current === undefined) {
      combat.hp_current = combat.hp_max || 1
    }
  }

  // Ensure attacks
  if (!migrated.attacks) {
    migrated.attacks = []
  }

  // Ensure personality
  if (!migrated.personality) {
    migrated.personality = { traits: '', ideal: '', bond: '', flaw: '', notes: '' }
  }

  // Ensure gold/supply/influence/inventory fields
  if (migrated.gold === undefined) migrated.gold = 0
  if (migrated.supply === undefined) migrated.supply = 0
  if (migrated.influence === undefined) migrated.influence = 0
  if (migrated.inventorySlots === undefined) {
    migrated.inventorySlots = Math.max(15, (migrated.abilityScores as Record<string, number>)?.str || 10)
  }
  if (!migrated.equippedGear) migrated.equippedGear = []
  if (!migrated.consumables) migrated.consumables = []

  return migrated as unknown as CharacterData
}

// ---------------------------------------------------------------------------
// applyBackgroundSkills
// ---------------------------------------------------------------------------

/**
 * Merge the current background's skill proficiencies into the character's
 * proficiency list. Skills are normalized (lowercase, no spaces) and
 * deduplicated.
 */
export function applyBackgroundSkills(char: CharacterData): CharacterData {
  if (!char.background) return { ...char }

  const bgData = DND_RULES.BACKGROUNDS[char.background]
  if (!bgData?.skills) return { ...char }

  const currentSkills = new Set(char.proficiencies.skills)
  for (const skill of bgData.skills) {
    currentSkills.add(skill.toLowerCase().replace(/ /g, ''))
  }

  return {
    ...char,
    proficiencies: {
      ...char.proficiencies,
      skills: Array.from(currentSkills),
    },
  }
}

// ---------------------------------------------------------------------------
// applyClassSkills
// ---------------------------------------------------------------------------

/**
 * Merge the current class's fixed skill proficiencies into the character's
 * proficiency list. Skills are normalized (lowercase, no spaces) and
 * deduplicated. This NEVER overwrites manual user choices — it only adds
 * fixed skills granted by the class.
 */
export function applyClassSkills(char: CharacterData): CharacterData {
  if (!char.class) return { ...char }

  const classData = DND_RULES.CLASSES[char.class]
  if (!classData?.fixedSkills) return { ...char }

  const currentSkills = new Set(char.proficiencies.skills)
  for (const skill of classData.fixedSkills) {
    currentSkills.add(skill.toLowerCase().replace(/ /g, ''))
  }

  return {
    ...char,
    proficiencies: {
      ...char.proficiencies,
      skills: Array.from(currentSkills),
    },
  }
}

// ---------------------------------------------------------------------------
// cleanupInvalidSkills
// ---------------------------------------------------------------------------

/**
 * Remove skills from the character's proficiency list that are no longer
 * valid given the current class and background. A skill is considered valid
 * if it is:
 *  - a fixed skill granted by the current background
 *  - a fixed skill granted by the current class
 *  - in the current class's skillChoices.from list (or 'any')
 *  - in the current background's skillChoices.from list (or 'any')
 *
 * This prevents stale skills from a previously selected class/background
 * from lingering after the player changes their selection.
 */
export function cleanupInvalidSkills(char: CharacterData): CharacterData {
  const validSkills = new Set<string>()

  // Background fixed skills + skill choices
  if (char.background) {
    const bgData = DND_RULES.BACKGROUNDS[char.background]
    for (const skill of bgData?.skills || []) {
      validSkills.add(skill.toLowerCase().replace(/ /g, ''))
    }
    const bgChoices = bgData?.skillChoices
    if (bgChoices) {
      if (bgChoices.from === 'any') {
        for (const skill of Object.keys(DND_RULES.SKILLS)) {
          validSkills.add(skill.toLowerCase().replace(/ /g, ''))
        }
      } else {
        for (const skill of bgChoices.from) {
          validSkills.add(skill.toLowerCase().replace(/ /g, ''))
        }
      }
    }
  }

  // Class fixed skills + skill choices
  if (char.class) {
    const classData = DND_RULES.CLASSES[char.class]
    for (const skill of classData?.fixedSkills || []) {
      validSkills.add(skill.toLowerCase().replace(/ /g, ''))
    }
    const classChoices = classData?.skillChoices
    if (classChoices) {
      if (classChoices.from === 'any') {
        for (const skill of Object.keys(DND_RULES.SKILLS)) {
          validSkills.add(skill.toLowerCase().replace(/ /g, ''))
        }
      } else {
        for (const skill of classChoices.from) {
          validSkills.add(skill.toLowerCase().replace(/ /g, ''))
        }
      }
    }
  }

  const filteredSkills = (char.proficiencies.skills || []).filter((skill) =>
    validSkills.has(skill),
  )

  return {
    ...char,
    proficiencies: {
      ...char.proficiencies,
      skills: filteredSkills,
    },
  }
}

// ---------------------------------------------------------------------------
// applyBackgroundFeature
// ---------------------------------------------------------------------------

/**
 * Replace the background-granted feature in the character's feature list.
 * Identifies background features by matching titles against all known
 * background feature titles in the rules compendium.
 */
export function applyBackgroundFeature(char: CharacterData): CharacterData {
  if (!char.background) return { ...char }

  const bgData = DND_RULES.BACKGROUNDS[char.background]
  if (!bgData?.feature) return { ...char }

  // Collect all background feature titles for removal
  const allBgFeatureTitles = new Set<string>()
  for (const bg of Object.values(DND_RULES.BACKGROUNDS)) {
    if (bg.feature?.title) {
      allBgFeatureTitles.add(bg.feature.title)
    }
  }

  const filteredFeatures = (char.features || []).filter(
    (f) => !allBgFeatureTitles.has(f.title),
  )

  const newFeature: CharacterFeature = {
    title: bgData.feature.title,
    desc: bgData.feature.desc,
    key: (bgData.feature as { key?: boolean }).key || false,
  }

  return {
    ...char,
    features: [...filteredFeatures, newFeature],
  }
}

// ---------------------------------------------------------------------------
// applyClassFeatures
// ---------------------------------------------------------------------------

/**
 * Replace the class-granted features in the character's feature list and
 * update saving throw proficiencies.
 */
export function applyClassFeatures(char: CharacterData): CharacterData {
  if (!char.class) return { ...char }

  const classData = DND_RULES.CLASSES[char.class]
  if (!classData) return { ...char }

  // Collect all class feature titles for removal
  const allClassFeatureTitles = new Set<string>()
  for (const cls of Object.values(DND_RULES.CLASSES)) {
    for (const feat of cls.features || []) {
      if (feat.title) allClassFeatureTitles.add(feat.title)
    }
  }

  const filteredFeatures = (char.features || []).filter(
    (f) => !allClassFeatureTitles.has(f.title),
  )

  // Build new features from rules data
  const newFeatures: CharacterFeature[] = (classData.features || []).map((feat) => {
    const f = feat as { title: string; desc: string; key?: boolean; casterType?: string | null; uses?: { total: number; per: string } }
    return {
      title: f.title || '',
      desc: f.desc || '',
      key: !!f.key,
      casterType: (f.casterType as string) || null,
      uses: f.uses ? { total: f.uses.total, per: f.uses.per } : undefined,
    }
  })

  return {
    ...char,
    features: [...filteredFeatures, ...newFeatures],
    proficiencies: {
      ...char.proficiencies,
      savingThrows: [...(classData.savingThrows || [])],
    },
  }
}

// ---------------------------------------------------------------------------
// applySpeciesTraits
// ---------------------------------------------------------------------------

/**
 * Replace species-granted traits in the character's feature list and update
 * movement speed if the species defines one.
 */
export function applySpeciesTraits(char: CharacterData): CharacterData {
  if (!char.species) return { ...char }

  const speciesData = DND_RULES.SPECIES[char.species]
  if (!speciesData) return { ...char }

  // Collect all species trait titles for removal
  const allSpeciesTraitTitles = new Set<string>()
  for (const sp of Object.values(DND_RULES.SPECIES)) {
    for (const trait of sp.traits || []) {
      if (trait.title) allSpeciesTraitTitles.add(trait.title)
    }
  }

  const filteredFeatures = (char.features || []).filter(
    (f) => !allSpeciesTraitTitles.has(f.title),
  )

  // Build new traits
  const newTraits: CharacterFeature[] = (speciesData.traits || []).map((trait) => {
    const t = trait as { title: string; desc: string; key?: boolean; uses?: { total: number; per: string } }
    return {
      title: t.title || '',
      desc: t.desc || '',
      key: !!t.key,
      casterType: null,
      uses: t.uses ? { total: t.uses.total, per: t.uses.per } : undefined,
    }
  })

  const speed = speciesData.speed || char.combat.speed

  return {
    ...char,
    features: [...filteredFeatures, ...newTraits],
    combat: {
      ...char.combat,
      speed,
    },
  }
}

// ---------------------------------------------------------------------------
// applyBackgroundBonuses
// ---------------------------------------------------------------------------

/**
 * Rebuild abilityScores from pointBuyBaseScores + background bonus selections
 * + feature-granted ability modifiers.
 */
export function applyBackgroundBonuses(char: CharacterData): CharacterData {
  const baseScores = char.pointBuyBaseScores || { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 }
  const finalScores: Record<string, number> = { ...baseScores }

  // Apply +2 bonus
  if (char.backgroundBonusSelections?.plusTwo) {
    const key = char.backgroundBonusSelections.plusTwo
    if (finalScores[key] !== undefined) {
      finalScores[key] += 2
    }
  }

  // Apply +1 bonus
  if (char.backgroundBonusSelections?.plusOne) {
    const key = char.backgroundBonusSelections.plusOne
    if (finalScores[key] !== undefined) {
      finalScores[key] += 1
    }
  }

  // Apply feature ability modifiers
  for (const feature of char.features || []) {
    if (feature.abilityModifiers) {
      for (const [stat, bonus] of Object.entries(feature.abilityModifiers)) {
        const normalizedStat = stat.toLowerCase()
        if (finalScores[normalizedStat] !== undefined && typeof bonus === 'number') {
          finalScores[normalizedStat] += bonus
        }
      }
    }
  }

  return {
    ...char,
    abilityScores: finalScores,
  }
}

// ---------------------------------------------------------------------------
// calculateDerivedStats
// ---------------------------------------------------------------------------

/**
 * Recalculate all derived stats: profBonus, maxHp, hp_current sync, and
 * spellcasting state.
 */
export function calculateDerivedStats(char: CharacterData): CharacterData {
  const level = DND_RULES.getEffectiveLevel(char.renownTier || 1)

  // Proficiency bonus
  let prof = 2
  for (const threshold of Object.keys(DND_RULES.PROFICIENCY_BONUS_PROGRESSION).map(Number)) {
    if (level >= threshold) {
      prof = DND_RULES.PROFICIENCY_BONUS_PROGRESSION[threshold] ?? prof
    }
  }

  // Ability mods
  const abilityMods: Record<string, number> = {}
  for (const [key, value] of Object.entries(char.abilityScores)) {
    abilityMods[key] = getMod(value)
  }

  // Max HP
  let maxHp = 1
  const classData = char.class ? DND_RULES.CLASSES[char.class] : undefined
  if (classData) {
    const conMod = abilityMods['con'] ?? 0
    maxHp = classData.hitDice + conMod
    if (level > 1) {
      const hpGain = classData.hitDiceAverage + conMod
      maxHp += (level - 1) * Math.max(1, hpGain)
    }
  }

  // HP sync: if current was at old max (or undefined/new), reset to calculated max
  const oldMax = char.combat.hp_max
  let hpCurrent = char.combat.hp_current
  if (hpCurrent === oldMax || hpCurrent === undefined) {
    hpCurrent = maxHp
  }
  // Clamp if somehow exceeds
  if ((hpCurrent ?? 0) > maxHp) {
    hpCurrent = maxHp
  }

  // Spellcasting setup
  const features = char.features || []
  const spellcastingFeature = features.find(
    (f) => f.casterType && f.casterType !== 'none',
  )
  let spellcasting = char.spellcasting
  if (spellcastingFeature && !spellcasting) {
    spellcasting = { ability: 'int' }
  } else if (!spellcastingFeature) {
    spellcasting = null
  }

  return {
    ...char,
    profBonus: prof,
    combat: {
      ...char.combat,
      hp_max: maxHp,
      hp_current: hpCurrent ?? maxHp,
    },
    spellcasting,
  }
}

// ---------------------------------------------------------------------------
// applyStartingEquipment
// ---------------------------------------------------------------------------

/**
 * Apply starting equipment to a character based on their class, background,
 * and the player's equipment selection state.
 *
 * This resolves the Class Option (A/B/C) and Background Option (A/B)
 * into concrete inventory items, attack entries, and gold.
 *
 * @param char  - The character to apply equipment to
 * @param state - The transient equipment selection state from the creation wizard
 * @returns A new CharacterData with equipment, attacks, and gold applied
 */
export function applyStartingEquipment(
  char: CharacterData,
  state: StartingEquipmentState,
): CharacterData {
  if (!char.class || !char.background) {
    // Can't resolve equipment without class and background
    return { ...char }
  }

  // Resolve all equipment from selections
  const resolution = resolveStartingEquipment(
    state,
    char.class,
    char.background,
  )

  // Clone existing arrays to maintain immutability
  const existingGear = [...(char.equippedGear || [])]
  const existingConsumables = [...(char.consumables || [])]
  const existingAttacks = [...(char.attacks || [])]
  const existingFeatures = [...(char.features || [])]

  // Append resolved gear (don't replace — player may have manually added items)
  for (const gear of resolution.equippedGear) {
    existingGear.push(gear)
  }

  // Append resolved consumables
  for (const consumable of resolution.consumables) {
    existingConsumables.push(consumable)
  }

  // Append generated attack entries
  for (const attack of resolution.attacks) {
    existingAttacks.push({
      name: attack.name,
      dmgDie: attack.dmgDie,
      type: attack.type,
      weaponMastery: attack.weaponMastery,
      atkStat: attack.atkStat,
      dmgStat: attack.dmgStat,
      dmgBonus: attack.dmgBonus || 0,
      notes: attack.notes,
    })
  }

  // Add spellcasting focus feature if applicable
  for (const grant of resolution.focusGrants) {
    if (grant.type === 'focus') {
      const focusFeature: CharacterFeature = {
        title: 'Spellcasting Focus',
        desc: `You possess a ${grant.target} focus, allowing you to use Magic Actions for your spells. This focus is required for casting spells with material components.`,
        source: 'Starting Equipment',
        featureType: 'Class Feature',
        actionType: 'Magic Action' as CharacterFeature['actionType'],
      }

      // Avoid duplicates
      if (!existingFeatures.some((f) => f.title === 'Spellcasting Focus')) {
        existingFeatures.push(focusFeature)
      }
    }
  }

  return {
    ...char,
    equippedGear: existingGear,
    consumables: existingConsumables,
    attacks: existingAttacks,
    features: existingFeatures,
    gold: (char.gold || 0) + resolution.gold.totalGold,
  }
}

// ---------------------------------------------------------------------------
// applyAllChanges (convenience pipeline)
// ---------------------------------------------------------------------------

/**
 * Full recalculate pipeline. Applies all mutation functions in the correct
 * order: bonuses → skills → background feature → class features →
 * species traits → derived stats.
 */
export function applyAllChanges(char: CharacterData): CharacterData {
  let result = cloneChar(char)
  result = applyBackgroundBonuses(result)
  // Clean up stale skills before re-applying current class/background grants
  result = cleanupInvalidSkills(result)
  result = applyBackgroundSkills(result)
  result = applyClassSkills(result)
  result = applyBackgroundFeature(result)
  result = applyClassFeatures(result)
  result = applySpeciesTraits(result)
  result = calculateDerivedStats(result)
  return result
}
