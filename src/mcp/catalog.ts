/**
 * Compact, read-only views over the bundled rules data for MCP clients.
 */
import * as DND_RULES from '@/data/rules'
import { classFeatureChoices } from '@/domain/customSubclasses'
import { getClassBundle, getBackgroundEquipment, getTrinketList } from '@/utils/equipmentResolver'

export const CATEGORIES = ['classes', 'species', 'backgrounds', 'feats', 'invocations'] as const
export type Category = (typeof CATEGORIES)[number]

const short = (s: string | undefined, n = 140) =>
  !s ? '' : s.length > n ? `${s.slice(0, n - 1)}…` : s

export function listOptions(category: Category): Array<Record<string, unknown>> {
  switch (category) {
    case 'classes':
      return Object.entries(DND_RULES.CLASSES).map(([id, c]) => ({
        id,
        hitDie: `d${c.hitDice}`,
        summary: short(c.description),
      }))
    case 'species':
      return Object.entries(DND_RULES.SPECIES).map(([id, s]) => ({
        id,
        speed: s.speed,
        subChoices: s.subChoices?.map((sc) => sc.id) ?? [],
        summary: short(s.description),
      }))
    case 'backgrounds':
      return Object.entries(DND_RULES.BACKGROUNDS).map(([id, b]) => ({
        id,
        abilityScoreIncrease: b.abilityScoreIncrease,
        skills: b.skills,
        summary: short(b.description),
      }))
    case 'feats':
      return DND_RULES.FEATS.map((f) => ({ id: f.title, summary: short(f.desc) }))
    case 'invocations':
      return DND_RULES.INVOCATIONS.map((o) => ({
        id: o.id,
        label: o.label,
        summary: short(o.description),
      }))
  }
}

const features = (list: Array<{ title: string; desc: string; minTier?: number }>) =>
  list.map((f) => ({ title: f.title, minTier: f.minTier ?? 1, desc: short(f.desc, 300) }))

export function getOptionDetails(category: Category, id: string): Record<string, unknown> | null {
  switch (category) {
    case 'classes': {
      const c = DND_RULES.CLASSES[id]
      if (!c) return null
      return {
        id,
        hitDie: `d${c.hitDice}`,
        savingThrows: c.savingThrows,
        fixedSkills: c.fixedSkills ?? [],
        skillChoices: c.skillChoices ?? null,
        features: features(c.features),
        featureChoices: classFeatureChoices(id).map((fc) => ({
          id: fc.id,
          label: fc.label,
          count: fc.count,
          scalesPerTier: fc.scalesPerTier ?? false,
          minTier: fc.minTier ?? 1,
          catalog: fc.catalogId ?? null,
          options: fc.options?.map((o) => ({
            id: o.id,
            label: o.label,
            prerequisite: o.prerequisite,
          })),
        })),
        startingEquipment: (['A', 'B', 'C'] as const).map((opt) => {
          const b = getClassBundle(id, opt)
          return (
            b && {
              option: opt,
              description: b.description,
              items: b.items,
              choices: b.choices,
              grants: b.grants,
              goldBuyout: b.goldBuyout,
            }
          )
        }),
      }
    }
    case 'species': {
      const s = DND_RULES.SPECIES[id]
      if (!s) return null
      return {
        id,
        speed: s.speed,
        traits: features(s.traits),
        subChoices: s.subChoices ?? [],
      }
    }
    case 'backgrounds': {
      const b = DND_RULES.BACKGROUNDS[id]
      if (!b) return null
      const eq = getBackgroundEquipment(id)
      return {
        id,
        abilityScoreIncrease: b.abilityScoreIncrease,
        fixedSkills: b.skills,
        skillChoices: b.skillChoices ?? null,
        feature: features([b.feature])[0],
        startingEquipment: eq,
        trinkets: eq?.trinket ? getTrinketList() : [],
      }
    }
    case 'feats': {
      const f = DND_RULES.FEATS.find((x) => x.title === id)
      return f ? { id, desc: f.desc } : null
    }
    case 'invocations': {
      const o = DND_RULES.INVOCATIONS.find((x) => x.id === id)
      return o
        ? { id, label: o.label, description: o.description, prerequisite: o.prerequisite }
        : null
    }
  }
}
