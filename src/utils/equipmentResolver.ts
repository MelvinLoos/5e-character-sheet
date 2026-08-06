/**
 * Starting Equipment Resolution Engine
 *
 * Pure functions that resolve a player's class + background equipment
 * selections into concrete CharacterData mutations. No Pinia, no Vue
 * reactivity, no side effects — just data transformation.
 */

import { EQUIPMENT_CATALOG } from '@/data/equipment-items'
import { CLASS_BUNDLES, BACKGROUND_EQUIPMENT, CLASS_FOCUS_MAP } from '@/data/equipment-bundles'
import type {
  ClassEquipmentBundle,
  BackgroundEquipment,
  StartingEquipmentState,
  GoldBreakdown,
  EquipmentResolutionResult,
  BundleGrant,
} from '@/types/equipment'
import type { AbilityKey, DamageType } from '@/types/enums'

// ---------------------------------------------------------------------------
// Gold Calculation
// ---------------------------------------------------------------------------

/**
 * Calculates the total gold from class and background equipment selections.
 */
export function calculateTotalGold(
  classOption: 'A' | 'B' | 'C',
  className: string,
  bgOption: 'A' | 'B',
  bgEquipment: BackgroundEquipment | null,
): GoldBreakdown {
  let classGold = 0
  let bgGold = 0

  if (classOption === 'C') {
    const classBundles = CLASS_BUNDLES[className]
    if (classBundles?.optionC?.goldBuyout) {
      classGold = classBundles.optionC.goldBuyout.flatAmount
    }
  }

  if (bgEquipment) {
    if (bgOption === 'A') {
      bgGold += bgEquipment.optionA.currency.gp
      if (bgEquipment.optionA.currency.sp) {
        bgGold += bgEquipment.optionA.currency.sp / 10
      }
    } else {
      bgGold += bgEquipment.optionB.flatGold
    }
  }

  const totalGold = Math.floor(classGold + bgGold)
  return { classGold, backgroundGold: bgGold, totalGold }
}

// ---------------------------------------------------------------------------
// Focus Resolution
// ---------------------------------------------------------------------------

export function resolveFocusGrants(className: string): BundleGrant[] {
  const focusType = CLASS_FOCUS_MAP[className]
  if (focusType) {
    return [{ type: 'focus', target: focusType }]
  }
  return []
}

// ---------------------------------------------------------------------------
// Item Resolution
// ---------------------------------------------------------------------------

/**
 * Resolves a list of EquipmentOption entries into flat inventory items.
 * Packs are expanded into their contents recursively.
 */
function expandOptions(
  options: Array<{ itemId: string; quantity: number }>,
): Array<{ itemId: string; quantity: number }> {
  const result: Array<{ itemId: string; quantity: number }> = []

  for (const opt of options) {
    const item = EQUIPMENT_CATALOG[opt.itemId]
    if (!item) continue

    if (item.category === 'pack' && item.packContents) {
      const expandedContents = expandOptions(
        item.packContents.map((cid) => ({ itemId: cid, quantity: 1 })),
      )
      for (const content of expandedContents) {
        result.push({ itemId: content.itemId, quantity: content.quantity * opt.quantity })
      }
    } else {
      const existing = result.find((r) => r.itemId === opt.itemId)
      if (existing) {
        existing.quantity += opt.quantity
      } else {
        result.push({ ...opt })
      }
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Attack Generation
// ---------------------------------------------------------------------------

interface GeneratedAttack {
  name: string
  dmgDie: string
  type: DamageType | string
  weaponMastery?: string
  atkStat?: AbilityKey | string | null
  dmgStat?: AbilityKey | string | null
  dmgBonus: number
  notes?: string
}

function generateAttacksFromItems(
  items: Array<{ itemId: string; quantity: number }>,
): GeneratedAttack[] {
  const attacks: GeneratedAttack[] = []
  const seenWeapons = new Set<string>()

  for (const { itemId } of items) {
    if (seenWeapons.has(itemId)) continue

    const item = EQUIPMENT_CATALOG[itemId]
    if (!item || item.category !== 'weapon' || !item.weapon) continue

    seenWeapons.add(itemId)

    let atkStat: AbilityKey = 'str'
    if (item.tags) {
      if (item.tags.includes('finesse') || item.tags.includes('ranged')) {
        atkStat = 'dex'
      }
    }
    if (item.weapon.atkStat) {
      atkStat = item.weapon.atkStat
    }

    const attack: GeneratedAttack = {
      name: item.name,
      dmgDie: item.weapon.damageDie,
      type: item.weapon.damageType,
      weaponMastery: item.weapon.mastery,
      atkStat,
      dmgStat: atkStat,
      dmgBonus: 0,
    }

    if (item.weapon.range) {
      attack.notes = `Range ${item.weapon.range.normal}/${item.weapon.range.long ?? '-'} ft.`
    }
    if (item.weapon.versatileDie) {
      const vNote = `Versatile (${item.weapon.versatileDie})`
      attack.notes = attack.notes ? `${attack.notes}. ${vNote}` : vNote
    }

    attacks.push(attack)
  }

  return attacks
}

// ---------------------------------------------------------------------------
// Inventory Item Generation
// ---------------------------------------------------------------------------

interface ResolvedGearEntry {
  itemId: string
  name: string
  type: string
  description: string
  slotCost: number
  isConsumable: boolean
}

function getDefaultDescription(item: import('@/types/equipment').EquipmentItem): string {
  if (item.weapon) {
    const parts = [`${item.weapon.damageDie} ${item.weapon.damageType}`]
    parts.push(`Mastery: ${item.weapon.mastery}`)
    if (item.weapon.versatileDie) parts.push(`Versatile: ${item.weapon.versatileDie}`)
    return parts.join('. ')
  }
  if (item.armor) {
    let desc = `AC ${item.armor.baseAc}`
    if (item.armor.dexCap !== undefined && item.armor.dexCap !== 0) desc += ` + DEX (max ${item.armor.dexCap})`
    if (item.armor.stealthDisadvantage) desc += '. Stealth Disadvantage'
    return desc
  }
  if (item.focusType) {
    return `Spellcasting Focus (${item.focusType})`
  }
  return 'Adventuring gear.'
}

function calculateSlotCost(
  item: import('@/types/equipment').EquipmentItem,
  quantity: number,
): number {
  if (item.category === 'ammunition') {
    return Math.ceil(quantity / 20)
  }
  if (item.category === 'weapon' && item.tags?.includes('light')) {
    return Math.ceil(quantity / 2)
  }
  if (
    item.category === 'armor' ||
    item.category === 'shield' ||
    (item.category === 'weapon' && item.tags?.includes('heavy'))
  ) {
    return quantity
  }
  // All small items (gear, trinkets, foci, tools): 5 per slot
  return quantity / 5
}

/**
 * Maps quantity of supply items to a starting usage die.
 * Lower quantity = lower usage die (fewer resources to deplete).
 *
 *   1–4   → d4
 *   5–9   → d6
 *   10–14 → d8
 *   15–19 → d10
 *   20+   → d12
 */
function getSupplyUsageDie(quantity: number): string {
  if (quantity <= 4) return 'd4'
  if (quantity <= 9) return 'd6'
  if (quantity <= 14) return 'd8'
  if (quantity <= 19) return 'd10'
  return 'd12'
}

/**
 * Converts resolved item IDs into gear/consumable entries.
 * Supply items with the same itemId are merged into a single consumable
 * with a quantity-based usage die (e.g. 10 torches → Ud8).
 */
function generateInventoryEntries(
  items: Array<{ itemId: string; quantity: number }>,
): { gearEntries: ResolvedGearEntry[]; consumableEntries: ResolvedGearEntry[] } {
  const gearEntries: ResolvedGearEntry[] = []
  const consumableEntries: ResolvedGearEntry[] = []

  // First pass: build gear entries and collect supply quantities for merging
  const supplyQuantities = new Map<string, number>()

  for (const { itemId, quantity } of items) {
    const catalogItem = EQUIPMENT_CATALOG[itemId]
    if (!catalogItem) continue

    const isSupply = catalogItem.supply === true
    const isAmmo = catalogItem.category === 'ammunition'

    if (isSupply) {
      // Accumulate supply quantities for later merging
      const existing = supplyQuantities.get(itemId)
      supplyQuantities.set(itemId, (existing ?? 0) + quantity)
      // Don't emit individual supply entries — they get merged below
    } else if (isAmmo) {
      consumableEntries.push({
        itemId,
        name: quantity > 1 ? `${catalogItem.name} (×${quantity})` : catalogItem.name,
        type: 'Ammunition',
        description: catalogItem.description || 'Ammunition',
        slotCost: calculateSlotCost(catalogItem, quantity),
        isConsumable: true,
      })
    } else {
      gearEntries.push({
        itemId,
        name: quantity > 1 ? `${catalogItem.name} (×${quantity})` : catalogItem.name,
        type: catalogItem.category === 'weapon' ? 'Weapon'
          : catalogItem.category === 'armor' ? 'Armor'
          : catalogItem.category === 'shield' ? 'Shield'
          : catalogItem.category === 'focus' ? 'Spellcasting Focus'
          : catalogItem.category === 'pack' ? 'Equipment Pack'
          : catalogItem.category === 'tool' ? 'Tool'
          : catalogItem.category === 'gear' ? 'Adventuring Gear'
          : catalogItem.category === 'trinket' ? 'Trinket'
          : catalogItem.category === 'currency' ? 'Currency'
          : 'Adventuring Gear',
        description: catalogItem.description || getDefaultDescription(catalogItem),
        slotCost: calculateSlotCost(catalogItem, quantity),
        isConsumable: false,
      })
    }
  }

  // Second pass: emit merged supply consumables
  for (const [itemId, totalQty] of supplyQuantities) {
    const catalogItem = EQUIPMENT_CATALOG[itemId]
    if (!catalogItem) continue

    consumableEntries.push({
      itemId,
      name: catalogItem.name, // Clean name — no "(×N)" suffix
      type: 'Supply',
      description: catalogItem.description || 'Consumable supply item',
      slotCost: calculateSlotCost(catalogItem, totalQty),
      isConsumable: true,
    })
  }

  return { gearEntries, consumableEntries }
}

// ---------------------------------------------------------------------------
// Main Resolution Function
// ---------------------------------------------------------------------------

/**
 * Resolves the complete starting equipment setup for a character.
 */
export function resolveStartingEquipment(
  state: StartingEquipmentState,
  className: string,
  background: string,
): EquipmentResolutionResult {
  const classBundles = CLASS_BUNDLES[className]
  const bgEquipment = BACKGROUND_EQUIPMENT[background] ?? null
  const result: EquipmentResolutionResult = {
    equippedGear: [],
    consumables: [],
    attacks: [],
    gold: { classGold: 0, backgroundGold: 0, totalGold: 0 },
    focusGrants: [],
  }

  if (!classBundles) {
    console.warn(`No class bundles found for class: ${className}`)
    return result
  }

  // 1. Collect class items
  const classItems: Array<{ itemId: string; quantity: number }> = []
  const classOption = state.classOption
  const bgOption = state.backgroundOption

  if (classOption === 'A' || classOption === 'B') {
    const bundle = classBundles[classOption === 'A' ? 'optionA' : 'optionB']
    if (bundle.items) classItems.push(...bundle.items)

    if (bundle.choices && state.resolvedClassChoices) {
      for (let i = 0; i < bundle.choices.length; i++) {
        const choice = bundle.choices[i]!
        if (!choice.options?.length) continue
        const firstOption = choice.options[0]!
        const resolved = state.resolvedClassChoices.find((rc) => rc.choiceIndex === i)
        if (resolved) {
          classItems.push({ itemId: resolved.selectedItemId, quantity: resolved.selectedQuantity })
        } else {
          classItems.push({ itemId: firstOption.itemId, quantity: firstOption.quantity })
        }
      }
    }

    if (bundle.grants) result.focusGrants.push(...bundle.grants)
  }

  // Also collect focus grants from the class focus map
  const focusGrants = resolveFocusGrants(className)
  for (const grant of focusGrants) {
    if (!result.focusGrants.some((g) => g.type === grant.type && g.target === grant.target)) {
      result.focusGrants.push(grant)
    }
  }

  // 2. Collect background items
  const bgItems: Array<{ itemId: string; quantity: number }> = []
  if (bgEquipment && bgOption === 'A') {
    bgItems.push(...bgEquipment.optionA.items)
  }

  // 3. Collect trinket
  const trinketItems: Array<{ itemId: string; quantity: number }> = []
  if (state.selectedTrinket) {
    trinketItems.push({ itemId: state.selectedTrinket, quantity: 1 })
  }

  // 4. Expand all items (including pack contents)
  const allExpandedItems = expandOptions([...classItems, ...bgItems, ...trinketItems])

  // 5. Generate inventory entries (supply items merged)
  const { gearEntries, consumableEntries } = generateInventoryEntries(allExpandedItems)

  // 6. Generate attacks
  const attacks = generateAttacksFromItems(allExpandedItems)

  // 7. Calculate gold
  const gold = calculateTotalGold(classOption ?? 'A', className, bgOption ?? 'A', bgEquipment)

  // 8. Build final result
  result.gold = gold

  for (const entry of gearEntries) {
    result.equippedGear.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${entry.itemId}-${Date.now()}-${Math.random()}`,
      catalogId: entry.itemId,
      name: entry.name,
      type: entry.type,
      description: entry.description,
      slotCost: entry.slotCost,
      theme: 'default',
    })
  }

  for (const entry of consumableEntries) {
    const catalogItem = EQUIPMENT_CATALOG[entry.itemId]
    const isSupply = catalogItem?.supply === true
    result.consumables.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${entry.itemId}-${Date.now()}-${Math.random()}`,
      name: entry.name,
      type: isSupply ? 'Supply' : 'Ammunition',
      slotCost: entry.slotCost,
      usageDie: isSupply ? getSupplyUsageDie(Math.round(entry.slotCost * 5)) : 'd8',
    })
  }

  for (const atk of attacks) {
    result.attacks.push({
      name: atk.name,
      dmgDie: atk.dmgDie,
      type: atk.type,
      weaponMastery: atk.weaponMastery,
      atkStat: atk.atkStat,
      dmgStat: atk.dmgStat,
      dmgBonus: atk.dmgBonus,
      notes: atk.notes,
    })
  }

  return result
}

// ---------------------------------------------------------------------------
// Utility: Get Bundle for Display
// ---------------------------------------------------------------------------

export function getClassBundle(
  className: string,
  option: 'A' | 'B' | 'C',
): ClassEquipmentBundle | null {
  const bundles = CLASS_BUNDLES[className]
  if (!bundles) return null
  return bundles[`option${option}`] ?? null
}

export function getBackgroundEquipment(background: string): BackgroundEquipment | null {
  return BACKGROUND_EQUIPMENT[background] ?? null
}

export function getTrinketList(): Array<{ id: string; name: string }> {
  return Object.values(EQUIPMENT_CATALOG)
    .filter((item) => item.category === 'trinket')
    .map((item) => ({ id: item.id, name: item.name }))
}