type ResourceData = {
  resourceType: string
  value?: number | undefined
  scalingStat?: string | null
  reset?: string
}

type FeatureFormData = {
  title: string
  desc: string
  key: boolean
  featureType: string
  actionType: string
  resource: ResourceData | null
  uses: { total: number; per: string } | null
  casterType: string | null
  grantsSpells?: boolean
  grantedSpellLevels?: number[]
}

function normalizeReset(reset?: string | null) {
  if (!reset) return undefined
  const r = reset.toString().trim().toLowerCase()
  if (r.includes('short')) return 'Short Rest'
  if (r.includes('long')) return 'Long Rest'
  if (r.includes('dawn')) return 'Dawn'
  if (r.includes('initiative')) return 'Initiative'
  if (r.includes('turn')) return 'Turn'
  if (r.includes('round')) return 'Round'
  if (r.includes('encounter')) return 'Encounter'
  if (r.includes('day')) return 'Day'
  if (r.includes('week')) return 'Week'
  if (r.includes('none')) return 'None'
  if (r.includes('special')) return 'Special'
  // Fallback: capitalize each word
  return reset
    .split(' ')
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(' ')
}

export type FeatureOut = {
  title: string
  desc: string
  key: boolean
  featureType: string
  actionType: string
  casterType: string | null
  resource?: ResourceData
  uses?: { total: number; per: string }
  grantsSpells: boolean
  grantedSpellLevels: number[]
  [key: string]: unknown
}

export function normalizeFeatureForSave(formData: FeatureFormData): FeatureOut {
  const out: FeatureOut = {
    title: formData.title?.trim() || '',
    desc: formData.desc?.trim() || '',
    key: !!formData.key,
    featureType: formData.featureType,
    actionType: formData.actionType,
    casterType: formData.casterType || null,
    grantsSpells: false,
    grantedSpellLevels: [],
  }

  // Normalize resource if present
  if (formData.resource) {
    const r: ResourceData = { ...formData.resource }
    // Ensure resourceType is correct
    r.resourceType = r.resourceType === 'scaling' ? 'scaling' : 'static'

    // Normalize scalingStat (lowercase 'pb' or ability or 'level')
    if (r.scalingStat) {
      r.scalingStat = r.scalingStat.toString().toLowerCase()
    }

    // Normalize reset strings to the schema-friendly form
    if (r.reset) {
      r.reset = normalizeReset(r.reset)
    }

    // If static, ensure value is a number
    if (r.resourceType === 'static') {
      r.value = typeof r.value === 'number' ? r.value : Number(r.value) || 1
    }

    out.resource = r
  }

  // Preserve legacy uses if present
  if (formData.uses) {
    out.uses = { total: formData.uses.total, per: formData.uses.per }
  }

  // Grants spells
  if (formData.grantsSpells) {
    out.grantsSpells = true
    out.grantedSpellLevels = Array.isArray(formData.grantedSpellLevels)
      ? [...formData.grantedSpellLevels]
      : []
  } else {
    out.grantsSpells = false
    out.grantedSpellLevels = []
  }

  return out
}

export default normalizeFeatureForSave
