import { describe, it, expect } from 'vitest'
import { normalizeFeatureForSave } from '../src/utils/featureNormalizer'

describe('normalizeFeatureForSave', () => {
  it('normalizes reset strings and static values', () => {
    const form = {
      title: 'Test',
      desc: 'Desc',
      key: false,
      featureType: 'Other',
      actionType: 'None',
      resource: { resourceType: 'static', value: '3', scalingStat: null, reset: 'short rest' },
      uses: null,
      casterType: null,
      grantsSpells: false,
      grantedSpellLevels: [],
    }

    const out = normalizeFeatureForSave(form as any)
    expect(out.resource).toBeDefined()
    expect(out.resource.value).toBe(3)
    expect(out.resource.reset).toBe('Short Rest')
  })

  it('lowercases scalingStat and preserves uses', () => {
    const form = {
      title: 'Scale',
      desc: 'Desc',
      key: true,
      featureType: 'Class Feature',
      actionType: 'Action',
      resource: { resourceType: 'scaling', scalingStat: 'PB', reset: 'long rest' },
      uses: { total: 2, per: 'short rest' },
      casterType: null,
      grantsSpells: true,
      grantedSpellLevels: [1, 2],
    }

    const out = normalizeFeatureForSave(form as any)
    expect(out.resource.scalingStat).toBe('pb')
    expect(out.uses).toBeDefined()
    expect(out.grantsSpells).toBe(true)
  })
})
