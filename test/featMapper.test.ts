import { describe, it, expect } from 'vitest'
import { mapFeat, mapFeats, mapClassFeature, mapClassFeatures } from '../src/utils/fiveToolsAdapter'

describe('Feat/Feature Mapping (5e.tools to App Schema)', () => {
  describe('mapFeat', () => {
    it('returns null for invalid input', () => {
      expect(mapFeat(null)).toBeNull()
      expect(mapFeat(undefined)).toBeNull()
      expect(mapFeat('not an object')).toBeNull()
      expect(mapFeat({})).toBeNull() // missing required name
    })

    it('maps a simple feat correctly', () => {
      const fiveToolsFeat = {
        name: 'Alert',
        source: 'PHB',
        entries: [
          'You gain the following benefits:',
          "You can't be surprised while you are conscious.",
          'You gain a +5 bonus to initiative.',
        ],
      }

      const result = mapFeat(fiveToolsFeat)

      expect(result).toBeDefined()
      expect(result?.title).toBe('Alert')
      expect(result?.source).toBe("Player's Handbook")
      expect(result?.featureType).toBe('General Feat')
      expect(result?.desc).toContain('gain the following benefits')
      expect(result?.desc).toContain('bonus to initiative')
    })

    it('detects feats that grant spells', () => {
      const magicInitiateFeat = {
        name: 'Magic Initiate',
        source: 'PHB',
        entries: [
          'You learn two cantrips of your choice from the wizard spell list.',
          "You also learn one 1st-level spell from that class's spell list.",
        ],
      }

      const result = mapFeat(magicInitiateFeat)

      expect(result?.grantsSpells).toBe(true)
      expect(result?.desc).toContain('cantrips')
      expect(result?.desc).toContain('spell list')
    })

    it('handles feats with complex entries and inline tags', () => {
      const feat = {
        name: 'Elemental Adept',
        source: 'PHB',
        entries: [
          'When you gain this feat, choose one of the following {@damage fire} types.',
          'Spells you cast ignore {@condition resistance} to damage of the chosen type.',
        ],
      }

      const result = mapFeat(feat)

      expect(result?.desc).toContain('fire')
      expect(result?.desc).toContain('*resistance*')
    })

    it('handles feats from different sources', () => {
      const sources = [
        { abbr: 'PHB', full: "Player's Handbook" },
        { abbr: 'XGE', full: "Xanathar's Guide" },
        { abbr: 'TCE', full: "Tasha's Cauldron" },
      ]

      sources.forEach(({ abbr, full }) => {
        const feat = {
          name: 'Test Feat',
          source: abbr,
          entries: ['Test description'],
        }
        expect(mapFeat(feat)?.source).toBe(full)
      })
    })

    it('handles feats with missing optional fields', () => {
      const minimalFeat = {
        name: 'Simple Feat',
        entries: ['Basic description.'],
      }

      const result = mapFeat(minimalFeat)

      expect(result).toBeDefined()
      expect(result?.title).toBe('Simple Feat')
      expect(result?.desc).toBe('Basic description.')
      expect(result?.featureType).toBe('General Feat')
      expect(result?.source).toBeUndefined()
    })

    it('provides fallback description if entries missing', () => {
      const noEntriesFeat = {
        name: 'Empty Feat',
      }

      const result = mapFeat(noEntriesFeat)

      expect(result?.desc).toBe('No description available.')
    })

    it('does not set grantsSpells for non-magical feats', () => {
      const athleteFeat = {
        name: 'Athlete',
        source: 'PHB',
        entries: [
          'You gain the following benefits:',
          'Increase your Strength or Dexterity by 1.',
          'When you are prone, standing up uses only 5 feet of movement.',
        ],
      }

      const result = mapFeat(athleteFeat)

      expect(result?.grantsSpells).toBeUndefined()
    })
  })

  describe('mapClassFeature', () => {
    it('returns null for invalid input', () => {
      expect(mapClassFeature(null, 'Class Feature')).toBeNull()
      expect(mapClassFeature(undefined, 'Class Feature')).toBeNull()
      expect(mapClassFeature('not an object', 'Class Feature')).toBeNull()
      expect(mapClassFeature({}, 'Class Feature')).toBeNull()
    })

    it('maps a class feature correctly', () => {
      const classFeature = {
        name: 'Rage',
        entries: [
          'In battle, you fight with primal ferocity.',
          'On your turn, you can enter a rage as a bonus action.',
        ],
        source: 'PHB',
      }

      const result = mapClassFeature(classFeature, 'Class Feature')

      expect(result?.title).toBe('Rage')
      expect(result?.featureType).toBe('Class Feature')
      expect(result?.source).toBe("Player's Handbook")
      expect(result?.desc).toContain('primal ferocity')
    })

    it('detects bonus action from description', () => {
      const feature = {
        name: 'Cunning Action',
        entries: [
          'Your quick thinking allows you to move and act quickly.',
          'You can take a bonus action on each of your turns.',
        ],
      }

      const result = mapClassFeature(feature, 'Class Feature')

      expect(result?.actionType).toBe('Bonus Action')
    })

    it('detects reaction from description', () => {
      const feature = {
        name: 'Shield Master',
        entries: ['If you take the Attack action, you can use a reaction to...'],
      }

      const result = mapClassFeature(feature, 'Class Feature')

      expect(result?.actionType).toBe('Reaction')
    })

    it('detects action from description', () => {
      const feature = {
        name: 'Second Wind',
        entries: ['You can use your action to regain hit points.'],
      }

      const result = mapClassFeature(feature, 'Class Feature')

      expect(result?.actionType).toBe('Action')
    })

    it('maps species traits correctly', () => {
      const speciesTrait = {
        name: 'Darkvision',
        entries: ['You can see in dim light within 60 feet as if it were bright light.'],
      }

      const result = mapClassFeature(speciesTrait, 'Species Trait')

      expect(result?.featureType).toBe('Species Trait')
      expect(result?.title).toBe('Darkvision')
    })

    it('maps background features correctly', () => {
      const backgroundFeature = {
        name: 'Researcher',
        entries: ['When you attempt to learn or recall a piece of lore, you know where to look.'],
      }

      const result = mapClassFeature(backgroundFeature, 'Background Feature')

      expect(result?.featureType).toBe('Background Feature')
    })

    it('detects spell-granting features', () => {
      const spellcastingFeature = {
        name: 'Spellcasting',
        entries: [
          'You have learned to cast spells.',
          'You know two cantrips from the wizard spell list.',
        ],
      }

      const result = mapClassFeature(spellcastingFeature, 'Class Feature')

      expect(result?.grantsSpells).toBe(true)
    })

    it('handles complex entries with inline tags', () => {
      const feature = {
        name: 'Divine Smite',
        entries: [
          'When you hit with a melee weapon attack, you can expend a spell slot to deal {@damage 2d8} radiant damage.',
        ],
      }

      const result = mapClassFeature(feature, 'Class Feature')

      expect(result?.desc).toContain('2d8 radiant')
    })
  })

  describe('mapFeats (batch mapping)', () => {
    it('maps multiple feats in one call', () => {
      const feats = [
        { name: 'Alert', entries: ['Always alert.'] },
        { name: 'Athlete', entries: ['Athletic.'] },
        { name: 'Actor', entries: ['Good actor.'] },
      ]

      const results = mapFeats(feats)

      expect(results).toHaveLength(3)
      expect(results[0].title).toBe('Alert')
      expect(results[1].title).toBe('Athlete')
      expect(results[2].title).toBe('Actor')
    })

    it('filters out invalid feats during batch mapping', () => {
      const feats = [
        { name: 'Valid Feat', entries: ['Valid'] },
        null,
        { entries: ['Missing name'] }, // invalid
        { name: 'Another Valid', entries: ['Valid'] },
        undefined,
      ]

      const results = mapFeats(feats as unknown[])

      expect(results).toHaveLength(2)
      expect(results[0].title).toBe('Valid Feat')
      expect(results[1].title).toBe('Another Valid')
    })

    it('returns empty array for empty input', () => {
      expect(mapFeats([])).toEqual([])
    })
  })

  describe('mapClassFeatures (batch mapping)', () => {
    it('maps multiple class features correctly', () => {
      const features = [
        { name: 'Fighting Style', entries: ['Choose a style.'] },
        { name: 'Second Wind', entries: ['Regain HP.'] },
        { name: 'Action Surge', entries: ['Take extra action.'] },
      ]

      const results = mapClassFeatures(features, 'Class Feature')

      expect(results).toHaveLength(3)
      expect(results[0].featureType).toBe('Class Feature')
      expect(results[1].featureType).toBe('Class Feature')
      expect(results[2].featureType).toBe('Class Feature')
    })

    it('maps species traits correctly', () => {
      const traits = [
        { name: 'Darkvision', entries: ['See in dark.'] },
        { name: 'Fey Ancestry', entries: ['Advantage vs charm.'] },
      ]

      const results = mapClassFeatures(traits, 'Species Trait')

      expect(results).toHaveLength(2)
      expect(results.every((r) => r.featureType === 'Species Trait')).toBe(true)
    })

    it('filters out invalid features', () => {
      const features = [
        { name: 'Valid', entries: ['Valid'] },
        null,
        { name: 'Also Valid', entries: ['Valid'] },
      ]

      const results = mapClassFeatures(features as unknown[], 'Background Feature')

      expect(results).toHaveLength(2)
      expect(results[0].featureType).toBe('Background Feature')
      expect(results[1].featureType).toBe('Background Feature')
    })
  })
})
