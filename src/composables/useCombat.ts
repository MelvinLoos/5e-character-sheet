import { computed } from 'vue'
import { useCharacterStore } from '@/stores/character'
import { useProgressionStore } from '@/stores/progression'
import * as DND_RULES from '@/data/rules'
import { WEAPONS_CATALOG } from '@/data/equipment-items'
import type { ComputedRef, WritableComputedRef } from 'vue'
import type { Attack, EquippedGear } from '@/types/character'
import type { EquipmentItem } from '@/types/equipment'

/** Maximum number of attacks shown in the offensive overview. */
export const MAX_ATTACKS = 5

/**
 * Generate a short unique identifier for attacks that lack a stable id.
 * Pure utility — no store dependency.
 */
export function generateId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

/**
 * Resolves the attack stat for a weapon catalog entry.
 *
 * Priority:
 * 1. Catalog's explicit `weapon.atkStat` (e.g. finesse weapons → dex).
 * 2. Finesse tag → better of dex / str.
 * 3. Ranged tag → dex.
 * 4. Default: str.
 */
function resolveAtkStat(weapon: EquipmentItem, abilityMods: Record<string, number>): string {
  if (weapon.weapon?.atkStat) return weapon.weapon.atkStat
  if (weapon.tags?.includes('finesse')) {
    return (abilityMods.dex ?? 0) >= (abilityMods.str ?? 0) ? 'dex' : 'str'
  }
  if (weapon.tags?.includes('ranged')) return 'dex'
  return 'str'
}

/**
 * Converts a damage die string (e.g. "1d8", "2d6") to average damage for sorting.
 */
function avgDamage(die: string): number {
  const m = die.match(/^(\d+)d(\d+)$/)
  if (!m) return 0
  const count = Number(m[1])
  const sides = Number(m[2])
  return count * ((sides + 1) / 2)
}

/**
 * Auto-populates the character's attacks array from equipped weapons.
 *
 * Scans `equippedGear` for items with a matching `WEAPONS_CATALOG` entry,
 * resolves the correct attack/damage stats, and returns the top `MAX_ATTACKS`
 * sorted by average damage (descending).
 *
 * @param equippedGear - The character's currently equipped items.
 * @param abilityMods - The character's current ability score modifiers.
 * @returns An array of up to `MAX_ATTACKS` Attack objects.
 */
export function autoSeedAttacks(
  equippedGear: EquippedGear[],
  abilityMods: Record<string, number>,
): Attack[] {
  const weaponAttacks: Attack[] = []

  for (const gear of equippedGear) {
    if (gear.type !== 'Weapon') continue
    const catalogId = gear.catalogId ?? gear.id
    const weapon = WEAPONS_CATALOG[catalogId]
    if (!weapon?.weapon) continue

    const atkStat = resolveAtkStat(weapon, abilityMods)

    weaponAttacks.push({
      id: generateId(),
      name: gear.name,
      atkStat,
      dmgStat: atkStat,
      dmgDie: weapon.weapon.versatileDie && atkStat === 'str' ? weapon.weapon.versatileDie : weapon.weapon.damageDie,
      dmgBonus: 0,
      type: weapon.weapon.damageType,
      weaponMastery: weapon.weapon.mastery || '',
      notes: weapon.tags?.includes('versatile')
        ? `Versatile ${weapon.weapon.versatileDie} (1H: ${weapon.weapon.damageDie})`
        : '',
    })
  }

  // Sort by average damage descending, take top MAX_ATTACKS
  weaponAttacks.sort((a, b) => avgDamage(b.dmgDie) - avgDamage(a.dmgDie))
  return weaponAttacks.slice(0, MAX_ATTACKS)
}

/**
 * Composable encapsulating D&D 5.5e combat logic.
 *
 * Extracts from AttacksList.vue and CombatStats.vue:
 * - Initiative modifier (DEX-based)
 * - Hit dice display (level + class hit die size)
 * - Walking speed (with species fallback)
 * - HP clamping
 * - Attack bonus / damage bonus calculations
 * - Attack type label formatting
 * - Attack CRUD with stable IDs
 *
 * @param characterStore - Optional pre-existing character store instance.
 *   If omitted, calls useCharacterStore() internally.
 */
export function useCombat(characterStore?: ReturnType<typeof useCharacterStore>) {
  const store = characterStore ?? useCharacterStore()
  const progression = useProgressionStore()

  // ---------------------------------------------------------------------------
  // Combat Vitals (from CombatStats.vue)
  // ---------------------------------------------------------------------------

  /**
   * Initiative modifier: Dexterity modifier, defaulting to 0.
   */
  const initiativeMod: ComputedRef<number> = computed(() => {
    return progression.abilityMods.dex ?? 0
  })

  /**
   * Hit dice display string for the character (e.g. "3d8").
   * Falls back to "1d8" if class data or derived level is unavailable.
   */
  const hitDiceDisplay: ComputedRef<string> = computed(() => {
    const level = progression.derivedLevel || 1
    const className = store.currentCharacterData.class
    const classData = className ? DND_RULES.CLASSES[className] : undefined
    const die = classData?.hitDice ?? 8
    return `${level}d${die}`
  })

  /**
   * Walking speed from the character's combat stats.
   */
  const walkingSpeed: ComputedRef<string> = computed(() => {
    return store.currentCharacterData.combat.speed || '30ft'
  })

  /**
   * Clamps current HP so it never exceeds max HP.
   * Typically called after tier changes or ability score recalculations.
   */
  function clampCurrentHp(): void {
    const combat = store.currentCharacterData.combat
    if ((combat.hp_current ?? 0) > progression.maxHp) {
      combat.hp_current = progression.maxHp
    }
  }

  // ---------------------------------------------------------------------------
  // Attacks (from AttacksList.vue)
  // ---------------------------------------------------------------------------

  /**
   * Writable computed for draggable attacks.
   * - Get: ensures every attack has a stable id for vuedraggable keying
   * - Set: writes the entire array back to the store
   */
  const editableAttacks: WritableComputedRef<Attack[]> = computed({
    get(): Attack[] {
      const arr = store.currentCharacterData.attacks || []
      for (const a of arr) {
        if (!a.id) {
          a.id = generateId()
        }
      }
      return arr
    },
    set(value: Attack[]): void {
      store.currentCharacterData.attacks = value
    },
  })

  /**
   * Calculates the total attack bonus for a given attack.
   *
   * - If `customAtkValue` is present (and the stat is 'custom'), returns it directly.
   * - Otherwise: ability modifier + proficiency bonus + any custom value.
   */
  function getAttackBonus(attack: Attack): number {
    // Custom override: return the manual value directly
    if (attack.atkStat === 'custom' && attack.customAtkValue !== undefined) {
      return Number(attack.customAtkValue)
    }

    const stat = attack.atkStat || 'str'
    const abilityMod = progression.abilityMods[stat] ?? 0
    const prof = progression.profBonus
    return abilityMod + prof
  }

  /**
   * Calculates the total damage bonus for a given attack.
   *
   * - If `customDmgValue` is present (and the stat is 'custom'), returns it directly.
   * - Otherwise: ability modifier + the attack's dmgBonus field.
   */
  function getDamageBonus(attack: Attack): number {
    // Custom override: return the manual value directly
    if (attack.dmgStat === 'custom' && attack.customDmgValue !== undefined) {
      return Number(attack.customDmgValue)
    }

    const stat = attack.dmgStat || 'str'
    const abilityMod = progression.abilityMods[stat] ?? 0
    return abilityMod + (attack.dmgBonus || 0)
  }

  /**
   * Formats a damage die and type into a human-readable label.
   * Pure utility — no store dependency.
   *
   * @example getAttackTypeLabel('1d8', 'slashing') // '1d8 slashing'
   */
  function getAttackTypeLabel(die: string, type: string): string {
    return `${die} ${type}`
  }

  // ---------------------------------------------------------------------------
  // Attack CRUD
  // ---------------------------------------------------------------------------

  /**
   * Adds a new blank attack to the store and returns its generated id.
   */
  function addAttack(): string {
    const id = generateId()
    const newAttack: Attack = {
      id,
      name: 'New Attack',
      atkStat: '',
      customAtkValue: 0,
      dmgStat: '',
      customDmgValue: 0,
      dmgDie: '1d8',
      dmgBonus: 0,
      type: 'slashing',
      weaponMastery: '',
      notes: '',
    }

    store.currentCharacterData.attacks = store.currentCharacterData.attacks || []
    store.currentCharacterData.attacks.push(newAttack)
    return id
  }

  /**
   * Removes an attack at the given index.
   */
  function removeAttack(idx: number): void {
    store.currentCharacterData.attacks.splice(idx, 1)
  }

  return {
    // Vitals
    initiativeMod,
    hitDiceDisplay,
    walkingSpeed,
    clampCurrentHp,
    // Attacks
    editableAttacks,
    getAttackBonus,
    getDamageBonus,
    getAttackTypeLabel,
    addAttack,
    removeAttack,
    generateId,
  }
}