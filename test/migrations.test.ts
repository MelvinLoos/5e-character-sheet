import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  migrateUsesToResource,
  migrateEquippedGearCatalogIds,
  migrateDescriptionHtmlToMarkdown,
} from '../src/utils/migrations'
import { createBlankCharacter, getLibrary, saveLibrary } from '@/domain'

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



describe('jobInParty fallbacks & defaults', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('createBlankCharacter defaults jobInParty to an empty string', () => {
    const char = createBlankCharacter()
    expect(char.jobInParty).toBe('')
  })

  it('getLibrary migrates old library saves by defaulting jobInParty to an empty string', () => {
    const legacyLibrary = {
      'Default Session': [
        {
          name: 'Hero without jobInParty',
          title: 'The Great',
          class: 'Fighter',
          renownTier: 1,
          renownMilestones: 0,
          species: 'Human',
          background: 'Soldier',
          abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
          pointBuyBaseScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
          backgroundBonusSelections: { plusTwo: 'str', plusOne: 'con' },
          profBonus: 2,
          proficiencies: { savingThrows: [], skills: [] },
          combat: { ac: 10, speed: '30ft' },
          personality: { traits: '', ideal: '', bond: '', flaw: '' },
          attacks: [],
          features: [],
          gold: 10,
          supply: 5,
          influence: 1,
          inventorySlots: 10,
          equippedGear: [],
          consumables: [],
          spells: []
        }
      ]
    }

    // We save under the library key
    saveLibrary(legacyLibrary as any)

    const loadedLibrary = getLibrary()
    expect(loadedLibrary['Default Session'][0].jobInParty).toBe('')
  })
})

describe('migrateEquippedGearCatalogIds', () => {
  it('uses existing id as catalogId when id matches a catalog key', () => {
    const char = {
      equippedGear: [{ id: 'scale-mail', name: 'Scale Mail', type: 'Armor', description: '', slotCost: 1 }],
    }
    const migrated = migrateEquippedGearCatalogIds(char)
    expect(migrated.equippedGear[0].catalogId).toBe('scale-mail')
  })

  it('matches catalog id by name when id is a random UUID', () => {
    const char = {
      equippedGear: [
        { id: 'uuid-123', name: 'Scale Mail', type: 'Armor', description: '', slotCost: 1 },
        { id: 'uuid-456', name: 'Shield', type: 'Shield', description: '', slotCost: 1 },
      ],
    }
    const migrated = migrateEquippedGearCatalogIds(char)
    expect(migrated.equippedGear[0].catalogId).toBe('scale-mail')
    expect(migrated.equippedGear[1].catalogId).toBe('shield')
  })

  it('ignores quantity suffix when matching by name', () => {
    const char = {
      equippedGear: [{ id: 'uuid-789', name: 'Javelin (×5)', type: 'Weapon', description: '', slotCost: 1 }],
    }
    const migrated = migrateEquippedGearCatalogIds(char)
    expect(migrated.equippedGear[0].catalogId).toBe('javelin')
  })

  it('leaves catalogId empty when no match is found', () => {
    const char = {
      equippedGear: [{ id: 'uuid-000', name: 'Mystery Item', type: 'Gear', description: '', slotCost: 1 }],
    }
    const migrated = migrateEquippedGearCatalogIds(char)
    expect(migrated.equippedGear[0].catalogId).toBeUndefined()
  })

  it('does not overwrite an existing catalogId', () => {
    const char = {
      equippedGear: [{ id: 'uuid-123', catalogId: 'shield', name: 'Scale Mail', type: 'Armor', description: '', slotCost: 1 }],
    }
    const migrated = migrateEquippedGearCatalogIds(char)
    expect(migrated.equippedGear[0].catalogId).toBe('shield')
  })
})

describe('migrateDescriptionHtmlToMarkdown', () => {
  it('converts legacy HTML lists in spell and feature descriptions to Markdown', () => {
    const char = {
      spells: [
        {
          name: 'Burning Hands',
          level: 1,
          desc: 'Damage:<ul><li>3d6 fire</li><li>ignites objects</li></ul>',
        },
      ],
      features: [{ title: 'Alert', desc: '<p>You cannot be surprised.</p>' }],
      equippedGear: [
        { name: 'Torch', type: 'Gear', description: 'Burns <strong>brightly</strong>' },
      ],
    }

    const migrated = migrateDescriptionHtmlToMarkdown(char) as typeof char

    expect(migrated.spells[0].desc).toBe('Damage:\n- 3d6 fire\n- ignites objects\n')
    expect(migrated.features[0].desc).toBe('You cannot be surprised.\n\n')
    expect(migrated.equippedGear[0].description).toBe('Burns **brightly**')
  })

  it('leaves already-Markdown descriptions unchanged', () => {
    const char = { spells: [{ name: 'Fireball', level: 3, desc: '**Boom** and *burn*' }] }

    const migrated = migrateDescriptionHtmlToMarkdown(char) as typeof char

    expect(migrated.spells[0].desc).toBe('**Boom** and *burn*')
  })

  it('handles characters without description arrays', () => {
    const migrated = migrateDescriptionHtmlToMarkdown({ name: 'No arrays' })

    expect(migrated).toEqual({ name: 'No arrays' })
  })
})
