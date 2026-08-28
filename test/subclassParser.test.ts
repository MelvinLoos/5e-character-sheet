import { describe, it, expect } from 'vitest'
import { parseSubclassImport } from '../src/utils/subclassParser'

describe('parseSubclassImport', () => {
  it('parses an object with a subclasses array', () => {
    const data = {
      subclasses: [
        {
          name: 'Champion',
          parentClass: 'Fighter',
          description: 'A master of raw physical power.',
          features: [
            { name: 'Improved Critical', level: 3, description: 'Critical on 19-20.' },
            { name: 'Remarkable Athlete', level: 7, description: 'Add half proficiency.' },
          ],
        },
      ],
    }

    const result = parseSubclassImport(data)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Champion')
    expect(result[0].parentClass).toBe('Fighter')
    expect(result[0].description).toBe('A master of raw physical power.')
    expect(result[0].features).toHaveLength(2)
    expect(result[0].features[0]).toEqual({
      name: 'Improved Critical',
      level: 3,
      description: 'Critical on 19-20.',
    })
  })

  it('parses a top-level array of subclasses', () => {
    const data = [
      {
        name: 'Circle of the Moon',
        parentClass: 'Druid',
        features: [{ name: 'Combat Wild Shape', level: 3, description: 'Bonus action wild shape.' }],
      },
    ]

    const result = parseSubclassImport(data)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Circle of the Moon')
    expect(result[0].description).toBeUndefined()
  })

  it('trims whitespace from required string fields', () => {
    const data = {
      subclasses: [
        {
          name: '  Champion  ',
          parentClass: ' Fighter ',
          features: [{ name: ' Improved Critical ', level: 3, description: ' Crit on 19-20. ' }],
        },
      ],
    }

    const result = parseSubclassImport(data)

    expect(result[0].name).toBe('Champion')
    expect(result[0].parentClass).toBe('Fighter')
    expect(result[0].features[0].name).toBe('Improved Critical')
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
      subclasses: [{ name: 'Champion', features: [{ name: 'X', level: 3, description: 'Y' }] }],
    }
    expect(() => parseSubclassImport(data)).toThrow('must have a non-empty "parentClass" string')
  })

  it('throws when a subclass has no features', () => {
    const data = {
      subclasses: [{ name: 'Champion', parentClass: 'Fighter' }],
    }
    expect(() => parseSubclassImport(data)).toThrow('must have a non-empty "features" array')
  })

  it('throws when a feature has an invalid level', () => {
    const data = {
      subclasses: [
        {
          name: 'Champion',
          parentClass: 'Fighter',
          features: [{ name: 'Improved Critical', level: 0, description: 'Y' }],
        },
      ],
    }
    expect(() => parseSubclassImport(data)).toThrow('integer "level" between 1 and 20')
  })

  it('throws when a feature has a non-integer level', () => {
    const data = {
      subclasses: [
        {
          name: 'Champion',
          parentClass: 'Fighter',
          features: [{ name: 'Improved Critical', level: 3.5, description: 'Y' }],
        },
      ],
    }
    expect(() => parseSubclassImport(data)).toThrow('integer "level" between 1 and 20')
  })

  it('throws when a feature is missing a description', () => {
    const data = {
      subclasses: [
        {
          name: 'Champion',
          parentClass: 'Fighter',
          features: [{ name: 'Improved Critical', level: 3 }],
        },
      ],
    }
    expect(() => parseSubclassImport(data)).toThrow('must have a non-empty "description" string')
  })
})
