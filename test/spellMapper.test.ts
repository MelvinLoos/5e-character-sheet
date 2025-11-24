import { describe, it, expect } from 'vitest'
import { mapSpell, mapSpells } from '../src/utils/fiveToolsAdapter'

describe('Spell Mapping (5e.tools to App Schema)', () => {
  describe('mapSpell', () => {
    it('returns null for invalid input', () => {
      expect(mapSpell(null)).toBeNull()
      expect(mapSpell(undefined)).toBeNull()
      expect(mapSpell('not an object')).toBeNull()
      expect(mapSpell({})).toBeNull() // missing required fields
    })

    it('maps a simple cantrip correctly', () => {
      const fiveToolsSpell = {
        name: 'Fire Bolt',
        level: 0,
        school: 'E',
        time: [{ number: 1, unit: 'action' }],
        range: { type: 'point', distance: { type: 'feet', amount: 120 } },
        components: { v: true, s: true },
        duration: [{ type: 'instant' }],
        entries: ['A streak of fire shoots toward a creature.'],
        source: 'PHB',
      }

      const result = mapSpell(fiveToolsSpell)

      expect(result).toBeDefined()
      expect(result?.name).toBe('Fire Bolt')
      expect(result?.level).toBe(0)
      expect(result?.school).toBe('Evocation')
      expect(result?.castingTime).toBe('1 Action')
      expect(result?.range).toBe('120 feet')
      expect(result?.components).toBe('V, S')
      expect(result?.duration).toBe('Instantaneous')
      expect(result?.concentration).toBe(false)
      expect(result?.source).toBe("Player's Handbook")
      expect(result?.desc).toContain('A streak of fire')
    })

    it('maps a leveled spell with concentration', () => {
      const fiveToolsSpell = {
        name: 'Mage Armor',
        level: 1,
        school: 'A',
        time: [{ number: 1, unit: 'action' }],
        range: { type: 'point', distance: { type: 'touch' } },
        components: { v: true, s: true, m: 'a piece of cured leather' },
        duration: [
          {
            type: 'timed',
            duration: { type: 'hour', amount: 8 },
            concentration: false,
          },
        ],
        entries: ["You touch a willing creature who isn't wearing armor."],
        source: 'PHB',
      }

      const result = mapSpell(fiveToolsSpell)

      expect(result?.name).toBe('Mage Armor')
      expect(result?.level).toBe(1)
      expect(result?.school).toBe('Abjuration')
      expect(result?.range).toBe('Touch')
      expect(result?.components).toBe('V, S, M (a piece of cured leather)')
      expect(result?.duration).toBe('8 Hours')
      expect(result?.concentration).toBe(false)
    })

    it('maps concentration spells correctly', () => {
      const fiveToolsSpell = {
        name: 'Bless',
        level: 1,
        time: [{ number: 1, unit: 'action' }],
        range: { type: 'point', distance: { type: 'feet', amount: 30 } },
        components: { v: true, s: true, m: true },
        duration: [
          {
            type: 'timed',
            duration: { type: 'minute', amount: 1 },
            concentration: true,
          },
        ],
        entries: ['You bless up to three creatures.'],
      }

      const result = mapSpell(fiveToolsSpell)

      expect(result?.concentration).toBe(true)
      expect(result?.duration).toBe('Concentration, up to 1 Minute')
    })

    it('maps area effect ranges correctly', () => {
      const coneSpell = {
        name: 'Burning Hands',
        level: 1,
        range: { type: 'cone', distance: { type: 'feet', amount: 15 } },
        entries: ['A cone of fire.'],
      }

      const lineSpell = {
        name: 'Lightning Bolt',
        level: 3,
        range: { type: 'line', distance: { type: 'feet', amount: 100 } },
        entries: ['A line of lightning.'],
      }

      const sphereSpell = {
        name: 'Fireball',
        level: 3,
        range: { type: 'sphere', distance: { type: 'feet', amount: 20 } },
        entries: ['An explosion.'],
      }

      expect(mapSpell(coneSpell)?.range).toBe('Self (15-foot cone)')
      expect(mapSpell(lineSpell)?.range).toBe('Self (100-foot line)')
      expect(mapSpell(sphereSpell)?.range).toBe('20-foot radius')
    })

    it('handles Self and Touch ranges', () => {
      const selfSpell = {
        name: 'Shield',
        level: 1,
        range: { type: 'point', distance: { type: 'self' } },
        entries: ['You create a shield.'],
      }

      const touchSpell = {
        name: 'Cure Wounds',
        level: 1,
        range: { type: 'point', distance: { type: 'touch' } },
        entries: ['You touch a creature.'],
      }

      expect(mapSpell(selfSpell)?.range).toBe('Self')
      expect(mapSpell(touchSpell)?.range).toBe('Touch')
    })

    it('processes complex entries with inline tags', () => {
      const fiveToolsSpell = {
        name: 'Magic Missile',
        level: 1,
        entries: [
          'You create three {@damage 1d4 + 1} force darts.',
          'Each dart hits a {@creature goblin} of your choice.',
          'Make a {@dc 15} saving throw.',
        ],
      }

      const result = mapSpell(fiveToolsSpell)

      expect(result?.desc).toContain('1d4 + 1 force darts')
      expect(result?.desc).toContain('**goblin**')
      expect(result?.desc).toContain('DC 15')
    })

    it('includes "At Higher Levels" section when present', () => {
      const fiveToolsSpell = {
        name: 'Cure Wounds',
        level: 1,
        entries: ['A creature you touch regains {@dice 1d8} hit points.'],
        entriesHigherLevel: [
          {
            type: 'entries',
            name: 'At Higher Levels',
            entries: ['The healing increases by {@dice 1d8} for each slot level above 1st.'],
          },
        ],
      }

      const result = mapSpell(fiveToolsSpell)

      expect(result?.desc).toContain('**At Higher Levels:**')
      expect(result?.desc).toContain('increases by 1d8')
    })

    it('handles missing optional fields gracefully', () => {
      const minimalSpell = {
        name: 'Test Spell',
        level: 2,
        entries: ['Minimal spell description.'],
      }

      const result = mapSpell(minimalSpell)

      expect(result).toBeDefined()
      expect(result?.name).toBe('Test Spell')
      expect(result?.level).toBe(2)
      expect(result?.desc).toBe('Minimal spell description.')
      expect(result?.school).toBeUndefined()
      expect(result?.castingTime).toBeUndefined()
      expect(result?.range).toBeUndefined()
      expect(result?.components).toBeUndefined()
      expect(result?.duration).toBeUndefined()
      expect(result?.concentration).toBe(false)
    })

    it('maps all school abbreviations correctly', () => {
      const schools = [
        { abbr: 'A', full: 'Abjuration' },
        { abbr: 'C', full: 'Conjuration' },
        { abbr: 'D', full: 'Divination' },
        { abbr: 'E', full: 'Evocation' },
        { abbr: 'I', full: 'Illusion' },
        { abbr: 'N', full: 'Necromancy' },
        { abbr: 'T', full: 'Transmutation' },
        { abbr: 'V', full: 'Enchantment' },
      ]

      schools.forEach(({ abbr, full }) => {
        const spell = {
          name: 'Test',
          level: 1,
          school: abbr,
          entries: ['Test'],
        }
        expect(mapSpell(spell)?.school).toBe(full)
      })
    })

    it('maps common source abbreviations', () => {
      const sources = [
        { abbr: 'PHB', full: "Player's Handbook" },
        { abbr: 'XGE', full: "Xanathar's Guide" },
        { abbr: 'TCE', full: "Tasha's Cauldron" },
      ]

      sources.forEach(({ abbr, full }) => {
        const spell = {
          name: 'Test',
          level: 1,
          source: abbr,
          entries: ['Test'],
        }
        expect(mapSpell(spell)?.source).toBe(full)
      })
    })

    it('handles ritual spells', () => {
      const ritualSpell = {
        name: 'Detect Magic',
        level: 1,
        meta: { ritual: true },
        entries: ['You detect magical auras.'],
      }

      const result = mapSpell(ritualSpell)
      expect(result).toBeDefined()
      // Note: We don't currently store ritual info in app schema
      // but the spell maps successfully
    })

    it('provides fallback description if entries missing', () => {
      const noEntriesSpell = {
        name: 'Empty Spell',
        level: 1,
      }

      const result = mapSpell(noEntriesSpell)
      expect(result?.desc).toBe('No description available.')
    })
  })

  describe('mapSpells (batch mapping)', () => {
    it('maps multiple spells in one call', () => {
      const spells = [
        {
          name: 'Fireball',
          level: 3,
          school: 'E',
          entries: ['A ball of fire.'],
        },
        {
          name: 'Magic Missile',
          level: 1,
          school: 'E',
          entries: ['Force darts.'],
        },
        {
          name: 'Shield',
          level: 1,
          school: 'A',
          entries: ['A protective barrier.'],
        },
      ]

      const results = mapSpells(spells)

      expect(results).toHaveLength(3)
      expect(results[0].name).toBe('Fireball')
      expect(results[1].name).toBe('Magic Missile')
      expect(results[2].name).toBe('Shield')
    })

    it('filters out invalid spells during batch mapping', () => {
      const spells = [
        { name: 'Valid Spell', level: 1, entries: ['Valid'] },
        null, // invalid
        { name: 'Missing level' }, // invalid
        { name: 'Another Valid', level: 2, entries: ['Valid'] },
        undefined, // invalid
      ]

      const results = mapSpells(spells as unknown[])

      expect(results).toHaveLength(2)
      expect(results[0].name).toBe('Valid Spell')
      expect(results[1].name).toBe('Another Valid')
    })

    it('returns empty array for empty input', () => {
      expect(mapSpells([])).toEqual([])
    })
  })
})
