import { describe, it, expect } from 'vitest'
import { parseSubclass, parseSubclassImport } from '../src/utils/subclassParser'

describe('parseSubclassImport', () => {
  it('parses an object with a subclasses array', () => {
    const data = {
      subclasses: [
        {
          name: 'Blade Dancer',
          parentClass: 'Fighter',
          description: 'A master of raw physical power.',
          features: [
            { name: 'Opening Flourish', level: 3, description: 'Strikes first.' },
            { name: 'Whirl', level: 7, description: 'Add half proficiency.' },
          ],
        },
      ],
    }

    const result = parseSubclassImport(data)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Blade Dancer')
    expect(result[0].parentClass).toBe('Fighter')
    expect(result[0].description).toBe('A master of raw physical power.')
    expect(result[0].features).toHaveLength(2)
    expect(result[0].features[0]).toEqual({
      name: 'Opening Flourish',
      level: 3,
      description: 'Strikes first.',
    })
  })

  it('parses a top-level array of subclasses', () => {
    const data = [
      {
        name: 'Circle of Embers',
        parentClass: 'Druid',
        features: [{ name: 'Ember Step', level: 3, description: 'Bonus action wild shape.' }],
      },
    ]

    const result = parseSubclassImport(data)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Circle of Embers')
    expect(result[0].description).toBeUndefined()
  })

  it('trims whitespace from required string fields', () => {
    const data = {
      subclasses: [
        {
          name: '  Blade Dancer  ',
          parentClass: ' Fighter ',
          features: [{ name: ' Opening Flourish ', level: 3, description: ' Crit on 19-20. ' }],
        },
      ],
    }

    const result = parseSubclassImport(data)

    expect(result[0].name).toBe('Blade Dancer')
    expect(result[0].parentClass).toBe('Fighter')
    expect(result[0].features[0].name).toBe('Opening Flourish')
    expect(result[0].features[0].description).toBe('Crit on 19-20.')
  })

  it('throws when data is not an object or array', () => {
    expect(() => parseSubclassImport(null)).toThrow('must contain a "subclasses" array')
    expect(() => parseSubclassImport('not valid')).toThrow('must contain a "subclasses" array')
    expect(() => parseSubclassImport(42)).toThrow('must contain a "subclasses" array')
    expect(() => parseSubclassImport({})).toThrow('must contain a "subclasses" array')
  })

  it('throws when subclasses array is empty', () => {
    expect(() => parseSubclassImport({ subclasses: [] })).toThrow('No valid subclasses found in file')
  })

  it('throws when a subclass is missing name', () => {
    const data = {
      subclasses: [{ parentClass: 'Fighter', features: [{ name: 'X', level: 3, description: 'Y' }] }],
    }
    expect(() => parseSubclassImport(data)).toThrow('must have a non-empty "name" string')
  })

  it('throws when a subclass is missing parentClass', () => {
    const data = {
      subclasses: [{ name: 'Blade Dancer', features: [{ name: 'X', level: 3, description: 'Y' }] }],
    }
    expect(() => parseSubclassImport(data)).toThrow('must have a non-empty "parentClass" string')
  })

  it('throws when a subclass has no features', () => {
    const data = {
      subclasses: [{ name: 'Blade Dancer', parentClass: 'Fighter' }],
    }
    expect(() => parseSubclassImport(data)).toThrow('must have a non-empty "features" array')
  })

  it('throws when a feature has an invalid level', () => {
    const data = {
      subclasses: [
        {
          name: 'Blade Dancer',
          parentClass: 'Fighter',
          features: [{ name: 'Opening Flourish', level: 0, description: 'Y' }],
        },
      ],
    }
    expect(() => parseSubclassImport(data)).toThrow('integer "level" between 1 and 20')
  })

  it('throws when a feature has a non-integer level', () => {
    const data = {
      subclasses: [
        {
          name: 'Blade Dancer',
          parentClass: 'Fighter',
          features: [{ name: 'Opening Flourish', level: 3.5, description: 'Y' }],
        },
      ],
    }
    expect(() => parseSubclassImport(data)).toThrow('integer "level" between 1 and 20')
  })

  it('throws when a feature is missing a description', () => {
    const data = {
      subclasses: [
        {
          name: 'Blade Dancer',
          parentClass: 'Fighter',
          features: [{ name: 'Opening Flourish', level: 3 }],
        },
      ],
    }
    expect(() => parseSubclassImport(data)).toThrow('must have a non-empty "description" string')
  })

  it('canonicalises parentClass case-insensitively', () => {
    const [s] = parseSubclassImport([
      { name: 'Blade Dancer', parentClass: ' fighter ', features: [{ name: 'Whirl', level: 3, description: 'Y' }] },
    ])
    expect(s!.parentClass).toBe('Fighter')
  })

  it('rejects an unknown parentClass', () => {
    const data = [{ name: 'X', parentClass: 'Artificer', features: [{ name: 'F', level: 3, description: 'Y' }] }]
    expect(() => parseSubclassImport(data)).toThrow('unknown parentClass "Artificer"')
  })

  it('rejects a name that matches a built-in subclass', () => {
    const data = [{ name: 'champion', parentClass: 'Fighter', features: [{ name: 'F', level: 3, description: 'Y' }] }]
    expect(() => parseSubclassImport(data)).toThrow('already exists for Fighter')
  })

  it('rejects a feature that reuses a built-in feature name', () => {
    for (const reserved of ['Rage', 'Improved Critical']) {
      const data = [{ name: 'Blade Dancer', parentClass: 'Fighter', features: [{ name: reserved, level: 3, description: 'Y' }] }]
      expect(() => parseSubclassImport(data)).toThrow('reuses the name of a built-in feature')
    }
  })

  it('rejects duplicate subclasses in one file', () => {
    const one = { name: 'Blade Dancer', parentClass: 'Fighter', features: [{ name: 'Whirl', level: 3, description: 'Y' }] }
    expect(() => parseSubclassImport([one, { ...one, parentClass: 'fighter' }])).toThrow('Duplicate subclass')
  })

  it('parseSubclass validates a single entry', () => {
    expect(parseSubclass({ name: 'A', parentClass: 'Wizard', features: [{ name: 'Z', level: 2, description: 'Y' }] }).parentClass).toBe('Wizard')
    expect(() => parseSubclass('nope')).toThrow('must be an object')
  })
})
