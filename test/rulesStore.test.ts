import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRulesStore } from '../src/stores/rulesStore'
import 'fake-indexeddb/auto'

describe('rulesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('initializes with default rules from rules.js', () => {
    const store = useRulesStore()

    expect(store.abilities).toBeDefined()
    expect(store.abilities.str).toBe('Strength')
    expect(store.skills).toBeDefined()
    expect(store.classes).toBeDefined()
    expect(store.species).toBeDefined()
    expect(store.backgrounds).toBeDefined()
    expect(store.spells).toEqual([])
    expect(store.feats).toEqual([])
  })

  it('exposes getters for rules data', () => {
    const store = useRulesStore()

    expect(store.allClasses).toBeDefined()
    expect(store.allSpecies).toBeDefined()
    expect(store.allBackgrounds).toBeDefined()
    expect(store.allSpells).toEqual([])
    expect(store.allFeats).toEqual([])
  })

  describe('importData', () => {
    it('imports spells array correctly', () => {
      const store = useRulesStore()
      const testSpells = [
        { name: 'Fireball', level: 3, desc: 'A burst of flame' },
        { name: 'Magic Missile', level: 1, desc: 'Magical darts' },
      ]

      store.importData('spells', testSpells)

      expect(store.spells).toHaveLength(2)
      expect(store.spells[0]).toEqual(testSpells[0])
      expect(store.spells[1]).toEqual(testSpells[1])
    })

    it('imports feats array correctly', () => {
      const store = useRulesStore()
      const testFeats = [
        { name: 'Alert', desc: 'Always on the lookout' },
        { name: 'Lucky', desc: 'Fortune favors you' },
      ]

      store.importData('feats', testFeats)

      expect(store.feats).toHaveLength(2)
      expect(store.feats[0]).toEqual(testFeats[0])
    })

    it('replaces existing data when importing', () => {
      const store = useRulesStore()
      const firstBatch = [{ name: 'Spell1', level: 1 }]
      const secondBatch = [
        { name: 'Spell2', level: 2 },
        { name: 'Spell3', level: 3 },
      ]

      store.importData('spells', firstBatch)
      expect(store.spells).toHaveLength(1)

      store.importData('spells', secondBatch)
      expect(store.spells).toHaveLength(2)
      expect(store.spells[0]).toEqual(secondBatch[0])
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
  })

  describe('resetCategory', () => {
    it('resets spells to empty array', () => {
      const store = useRulesStore()
      store.importData('spells', [{ name: 'Fireball' }])
      expect(store.spells).toHaveLength(1)

      store.resetCategory('spells')
      expect(store.spells).toEqual([])
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
})
