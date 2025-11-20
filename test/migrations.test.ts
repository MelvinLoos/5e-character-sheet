import { describe, it, expect } from 'vitest'
import { migrateUsesToResource } from '../src/utils/migrations'

describe('migrateUsesToResource', () => {
  it('converts legacy uses.total and uses.per (short rest) to resource', () => {
    const char = {
      features: [{ title: 'Rage', uses: { total: 2, per: 'short rest' } }],
    }

    const migrated = migrateUsesToResource(char)
    expect(migrated.features).toHaveLength(1)
    const f = migrated.features[0]
    expect(f.resource).toBeDefined()
    expect(f.resource.resourceType).toBe('static')
    expect(f.resource.value).toBe(2)
    expect(f.resource.reset).toBe('Short Rest')
    expect(f._migratedFromUses).toBe(true)
  })

  it('defaults value to 1 and maps long rest reset', () => {
    const char = {
      features: [{ title: 'Divine Intervention', uses: { per: 'long rest' } }],
    }

    const migrated = migrateUsesToResource(char)
    const f = migrated.features[0]
    expect(f.resource).toBeDefined()
    expect(f.resource.value).toBe(1)
    expect(f.resource.reset).toBe('Long Rest')
  })

  it('leaves features without uses alone', () => {
    const char = { features: [{ title: 'Passive Trait' }] }
    const migrated = migrateUsesToResource(char)
    expect(migrated.features[0].resource).toBeUndefined()
    expect(migrated.features[0]._migratedFromUses).toBeUndefined()
  })
})
