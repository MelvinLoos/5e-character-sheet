import { EQUIPMENT_CATALOG } from '@/data/equipment-items'
import type { EquippedGear } from '@/types/character'
import type { EquipmentItem } from '@/types/equipment'

/**
 * Calculate a character's Armor Class based on equipped armor, shields,
 * and Dexterity modifier.
 *
 * Rules implemented:
 * - Unarmored: 10 + DEX modifier
 * - Light Armor: armor base AC + full DEX modifier
 * - Medium Armor: armor base AC + DEX modifier (up to a max of +2)
 * - Heavy Armor: armor base AC only; DEX modifier ignored entirely
 * - Shield: +2 AC bonus
 * - Multiple armors: the highest resulting AC is used
 */
export function calculateArmorClass(
  equippedGear: EquippedGear[],
  dexMod: number,
): number {
  let bestArmorAc: number | null = null
  let hasShield = false

  for (const gear of equippedGear) {
    const item: EquipmentItem | undefined = EQUIPMENT_CATALOG[gear.id]
    if (!item) continue

    if (item.category === 'armor' && item.armor) {
      const { baseAc, dexCap } = item.armor
      const tags = item.tags ?? []

      let effectiveDex: number
      if (tags.includes('heavy')) {
        effectiveDex = 0
      } else if (dexCap !== undefined) {
        effectiveDex = Math.min(dexMod, dexCap)
      } else {
        effectiveDex = dexMod
      }

      const armorAc = baseAc + effectiveDex
      if (bestArmorAc === null || armorAc > bestArmorAc) {
        bestArmorAc = armorAc
      }
    }

    if (item.category === 'shield') {
      hasShield = true
    }
  }

  const base = bestArmorAc ?? (10 + dexMod)
  return hasShield ? base + 2 : base
}
