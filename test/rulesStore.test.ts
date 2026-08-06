import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRulesStore } from '../src/stores/rulesStore'
import 'fake-indexeddb/auto'
import { get, set } from 'idb-keyval'

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
}))

describe('rulesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with default rules from rules.js', () => {
    const store = useRulesStore()

    expect(store.abilities).toBeDefined()
    expect(store.abilities.str).toBe('Strength')
    expect(store.skills).toBeDefined()
    expect(store.classes).toBeDefined()
    expect(store.species).toBeDefined()
    expect(store.backgrounds).toBeDefined()
    expect(store.baseSpells).toEqual([])
    expect(store.baseFeats).toEqual([])
    expect(store.guildSpells).toEqual([])
    expect(store.guildFeats).toEqual([])
  })

  it('exposes getters for rules data', () => {
    const store = useRulesStore()

    expect(store.allClasses).toBeDefined()
    expect(store.allSpecies).toBeDefined()
    expect(store.allBackgrounds).toBeDefined()
    expect(store.allSpells).toEqual([])
    expect(store.allFeats).toEqual([])
  })

  describe('dual-state getters', () => {
    it('allSpells merges base and guild spells', () => {
      const store = useRulesStore()
      store.baseSpells = [{ name: 'Fireball', level: 3 }]
      store.guildSpells = [{ name: 'Guild Bolt', level: 1 }]

      const merged = store.allSpells
      expect(merged).toHaveLength(2)
      expect(merged[0]).toEqual({ name: 'Fireball', level: 3 })
      expect(merged[1]).toEqual({ name: 'Guild Bolt', level: 1 })
    })

    it('allFeats merges base and guild feats', () => {
      const store = useRulesStore()
      store.baseFeats = [{ title: 'Alert', desc: 'Watchful' }]
      store.guildFeats = [{ title: 'Guild Training', desc: 'Trained' }]

      const merged = store.allFeats
      expect(merged).toHaveLength(2)
      expect(merged[0]).toEqual({ title: 'Alert', desc: 'Watchful' })
      expect(merged[1]).toEqual({ title: 'Guild Training', desc: 'Trained' })
    })

    it('allSpells returns only base spells when guild is empty', () => {
      const store = useRulesStore()
      store.baseSpells = [{ name: 'Fireball', level: 3 }]
      store.guildSpells = []

      expect(store.allSpells).toHaveLength(1)
      expect(store.allSpells[0]).toEqual({ name: 'Fireball', level: 3 })
    })

    it('allSpells returns only guild spells when base is empty', () => {
      const store = useRulesStore()
      store.baseSpells = []
      store.guildSpells = [{ name: 'Guild Bolt', level: 1 }]

      expect(store.allSpells).toHaveLength(1)
      expect(store.allSpells[0]).toEqual({ name: 'Guild Bolt', level: 1 })
    })
  })

  describe('importData', () => {
    it('imports spells array to baseSpells', () => {
      const store = useRulesStore()
      const testSpells = [
        { name: 'Fireball', level: 3, desc: 'A burst of flame' },
        { name: 'Magic Missile', level: 1, desc: 'Magical darts' },
      ]

      store.importData('spells', testSpells)

      expect(store.baseSpells).toHaveLength(2)
      expect(store.baseSpells[0]).toEqual(testSpells[0])
      expect(store.baseSpells[1]).toEqual(testSpells[1])
      // guild overlay should be unaffected
      expect(store.guildSpells).toEqual([])
    })

    it('imports feats array to baseFeats', () => {
      const store = useRulesStore()
      const testFeats = [
        { name: 'Alert', desc: 'Always on the lookout' },
        { name: 'Lucky', desc: 'Fortune favors you' },
      ]

      store.importData('feats', testFeats)

      expect(store.baseFeats).toHaveLength(2)
      expect(store.baseFeats[0]).toEqual(testFeats[0])
      // guild overlay should be unaffected
      expect(store.guildFeats).toEqual([])
    })

    it('replaces existing data when importing', () => {
      const store = useRulesStore()
      const firstBatch = [{ name: 'Spell1', level: 1 }]
      const secondBatch = [
        { name: 'Spell2', level: 2 },
        { name: 'Spell3', level: 3 },
      ]

      store.importData('spells', firstBatch)
      expect(store.baseSpells).toHaveLength(1)

      store.importData('spells', secondBatch)
      expect(store.baseSpells).toHaveLength(2)
      expect(store.baseSpells[0]).toEqual(secondBatch[0])
    })

    it('converts array to object for classes/species/backgrounds', () => {
      const store = useRulesStore()
      const testClasses = [
        { name: 'Wizard', hitDie: 'd6' },
        { name: 'Fighter', hitDie: 'd10' },
      ]

      store.importData('classes', testClasses)

      expect(typeof store.classes).toBe('object')
      expect((store.classes as any).Wizard).toBeDefined()
      expect((store.classes as any).Wizard.hitDie).toBe('d6')
      expect((store.classes as any).Fighter).toBeDefined()
    })

    it('warns and ignores invalid categories', () => {
      const store = useRulesStore()
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      store.importData('invalidCategory', [{ foo: 'bar' }])

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid category'),
        expect.any(Array),
      )
      consoleSpy.mockRestore()
    })

    it('importData does not affect guild overlay', () => {
      const store = useRulesStore()
      store.guildSpells = [{ name: 'Guild Bolt', level: 1 }]
      store.guildFeats = [{ title: 'Guild Training', desc: 'Trained' }]

      store.importData('spells', [{ name: 'Fireball', level: 3 }])
      store.importData('feats', [{ title: 'Alert', desc: 'Watchful' }])

      // Guild data survives importData calls
      expect(store.guildSpells).toHaveLength(1)
      expect(store.guildFeats).toHaveLength(1)
      expect(store.baseSpells).toHaveLength(1)
      expect(store.baseFeats).toHaveLength(1)
    })
  })

  describe('guild injection and stripping', () => {
    it('injectGuildSpells populates guildSpells', () => {
      const store = useRulesStore()
      const guildSpells = [{ name: 'Guild Bolt', level: 1 }]

      store.injectGuildSpells(guildSpells)

      expect(store.guildSpells).toHaveLength(1)
      expect(store.guildSpells[0]).toEqual(guildSpells[0])
      // base should be unaffected
      expect(store.baseSpells).toEqual([])
    })

    it('injectGuildFeats populates guildFeats', () => {
      const store = useRulesStore()
      const guildFeats = [{ title: 'Guild Training', desc: 'Trained' }]

      store.injectGuildFeats(guildFeats)

      expect(store.guildFeats).toHaveLength(1)
      expect(store.guildFeats[0]).toEqual(guildFeats[0])
      // base should be unaffected
      expect(store.baseFeats).toEqual([])
    })

    it('injectGuildSpells replaces existing guild spells (no append)', () => {
      const store = useRulesStore()
      store.injectGuildSpells([{ name: 'Old Guild Spell', level: 1 }])
      store.injectGuildSpells([{ name: 'New Guild Spell', level: 2 }])

      expect(store.guildSpells).toHaveLength(1)
      expect(store.guildSpells[0].name).toBe('New Guild Spell')
    })

    it('stripGuildContent clears guildSpells and guildFeats', () => {
      const store = useRulesStore()
      store.injectGuildSpells([{ name: 'Guild Bolt', level: 1 }])
      store.injectGuildFeats([{ title: 'Guild Training', desc: 'Trained' }])

      store.stripGuildContent()

      expect(store.guildSpells).toEqual([])
      expect(store.guildFeats).toEqual([])
    })

    it('stripGuildContent does not affect base data', () => {
      const store = useRulesStore()
      store.baseSpells = [{ name: 'Fireball', level: 3 }]
      store.baseFeats = [{ title: 'Alert', desc: 'Watchful' }]
      store.injectGuildSpells([{ name: 'Guild Bolt', level: 1 }])
      store.injectGuildFeats([{ title: 'Guild Training', desc: 'Trained' }])

      store.stripGuildContent()

      expect(store.baseSpells).toHaveLength(1)
      expect(store.baseFeats).toHaveLength(1)
      expect(store.guildSpells).toEqual([])
      expect(store.guildFeats).toEqual([])
    })

    it('stripGuildContent is idempotent (safe to call when no guild content)', () => {
      const store = useRulesStore()
      store.baseSpells = [{ name: 'Fireball', level: 3 }]

      store.stripGuildContent()

      expect(store.baseSpells).toHaveLength(1)
      expect(store.guildSpells).toEqual([])
    })
  })

  describe('resetCategory', () => {
    it('resets baseSpells to empty array', () => {
      const store = useRulesStore()
      store.importData('spells', [{ name: 'Fireball' }])
      expect(store.baseSpells).toHaveLength(1)

      store.resetCategory('baseSpells')
      expect(store.baseSpells).toEqual([])
    })

    it('resetCategory does not affect guild overlay', () => {
      const store = useRulesStore()
      store.importData('spells', [{ name: 'Fireball' }])
      store.injectGuildSpells([{ name: 'Guild Bolt', level: 1 }])

      store.resetCategory('baseSpells')

      expect(store.baseSpells).toEqual([])
      expect(store.guildSpells).toHaveLength(1)
    })

    it('resets classes to original rules.js data', () => {
      const store = useRulesStore()
      const originalClasses = { ...store.classes }

      store.importData('classes', [{ name: 'CustomClass' }])
      expect((store.classes as any).CustomClass).toBeDefined()

      store.resetCategory('classes')
      expect(store.classes).toEqual(originalClasses)
      expect((store.classes as any).CustomClass).toBeUndefined()
    })
  })

  describe('IndexedDB state migration', () => {
    it('migrates old spells key to baseSpells on loadFromStorage', async () => {
      const mockGet = vi.mocked(get)
      const mockSet = vi.mocked(set)
      mockSet.mockResolvedValue(undefined)

      // Simulate old stored state with 'spells' and 'feats' keys
      const oldStoredState = {
        spells: [{ name: 'Fireball', level: 3 }],
        feats: [{ title: 'Alert', desc: 'Watchful' }],
      }
      mockGet.mockResolvedValue(oldStoredState)

      const store = useRulesStore()
      await store.loadFromStorage()

      // Old keys should be migrated to new keys
      expect(store.baseSpells).toHaveLength(1)
      expect(store.baseSpells[0]).toEqual({ name: 'Fireball', level: 3 })
      expect(store.baseFeats).toHaveLength(1)
      expect(store.baseFeats[0]).toEqual({ title: 'Alert', desc: 'Watchful' })

      // Old keys should not leak into new state
      expect((store.$state as any).spells).toBeUndefined()
      expect((store.$state as any).feats).toBeUndefined()
    })

    it('handles stored state with new keys directly (no migration needed)', async () => {
      const mockGet = vi.mocked(get)
      mockGet.mockResolvedValue(undefined)

      // With new-style stored state, existing state passes through unchanged
      // (mockGet returns undefined → nothing to load)
      const store = useRulesStore()
      store.baseSpells = [{ name: 'Magic Missile', level: 1 }]

      await store.loadFromStorage()

      // Should not overwrite existing baseSpells since storedState is undefined
      expect(store.baseSpells).toHaveLength(1)
      expect(store.baseSpells[0].name).toBe('Magic Missile')
    })

    it('loadFromStorage handles empty stored state gracefully', async () => {
      const mockGet = vi.mocked(get)
      mockGet.mockResolvedValue(undefined)

      const store = useRulesStore()
      await store.loadFromStorage()

      // Should maintain defaults
      expect(store.baseSpells).toEqual([])
      expect(store.baseFeats).toEqual([])
      expect(store.guildSpells).toEqual([])
      expect(store.guildFeats).toEqual([])
    })

    it('loadFromStorage handles IndexedDB errors gracefully', async () => {
      const mockGet = vi.mocked(get)
      mockGet.mockRejectedValue(new Error('IDB error'))

      const store = useRulesStore()
      store.baseSpells = [{ name: 'Fireball', level: 3 }]

      await store.loadFromStorage()

      // Existing data preserved on error
      expect(store.baseSpells).toHaveLength(1)
    })
  })
})
