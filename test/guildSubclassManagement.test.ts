import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../src/stores/authStore'

type Call = [string, ...unknown[]]
let calls: Call[]
let existingRow: unknown
let inserted: unknown[]

function makeClient() {
  const chain: Record<string, unknown> = {}
  const record = (name: string) =>
    vi.fn((...args: unknown[]) => {
      calls.push([name, ...args])
      if (name === 'insert') inserted.push(...(Array.isArray(args[0]) ? args[0] : [args[0]]))
      return chain
    })
  for (const m of ['select', 'eq', 'update', 'delete', 'insert']) chain[m] = record(m)
  chain.maybeSingle = vi.fn(async () => ({ data: existingRow, error: null }))
  chain.single = vi.fn(async () => ({ data: { id: 'row-1' }, error: null }))
  // `await insert(...).select()` and `await delete().eq()` resolve here
  chain.then = (resolve: (v: unknown) => void) =>
    resolve({ data: inserted.map((d, i) => ({ id: `new-${i}`, ...(d as object) })), error: null })
  return { from: vi.fn((table: string) => (calls.push(['from', table]), chain)) }
}

let client: ReturnType<typeof makeClient>
vi.mock('../src/infra/sharingService', () => ({ getSupabaseClient: vi.fn(() => client) }))

import {
  createGuildSubclass,
  updateGuildSubclass,
  deleteGuildSubclass,
  bulkCreateGuildSubclasses,
} from '../src/utils/guildContentManagement'

const valid = (name = 'Blade Dancer', parentClass = 'Fighter') => ({
  name,
  parentClass,
  features: [{ name: `${name} Feature`, level: 3, description: 'Does a thing.' }],
})

describe('guild subclass management', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    useAuthStore().$patch({ userId: 'user-1', status: 'authenticated' })
    calls = []
    inserted = []
    existingRow = null
    client = makeClient()
  })

  it('inserts a canonicalised subclass when none exists', async () => {
    await createGuildSubclass({ guild_id: 'g1', data: valid('Blade Dancer', ' fighter ') })

    expect(calls).toContainEqual(['eq', 'data->>parentClass', 'Fighter'])
    expect(calls).toContainEqual(['eq', 'data->>name', 'Blade Dancer'])
    expect(inserted).toEqual([
      { guild_id: 'g1', data: expect.objectContaining({ parentClass: 'Fighter' }), created_by: 'user-1' },
    ])
  })

  it('updates the existing row instead of inserting', async () => {
    existingRow = { id: 'existing-1' }
    await createGuildSubclass({ guild_id: 'g1', data: valid() })

    expect(inserted).toEqual([])
    expect(calls).toContainEqual(['eq', 'id', 'existing-1'])
    expect(calls.some(([n]) => n === 'update')).toBe(true)
  })

  it('rejects an invalid subclass before touching the database', async () => {
    await expect(createGuildSubclass({ guild_id: 'g1', data: { name: 'X' } })).rejects.toThrow()
    await expect(updateGuildSubclass('id', valid('Champion'))).rejects.toThrow('already exists')
    expect(client.from).not.toHaveBeenCalled()
  })

  it('deletes by id', async () => {
    await deleteGuildSubclass('abc')
    expect(calls).toContainEqual(['from', 'guild_subclasses'])
    expect(calls).toContainEqual(['eq', 'id', 'abc'])
  })

  it('bulk inserts new subclasses in chunks of 50', async () => {
    const subclasses = Array.from({ length: 60 }, (_, i) => ({
      ...valid(`Dancer ${i}`),
      parentClass: 'Fighter',
    }))
    await bulkCreateGuildSubclasses({ guild_id: 'g1', subclasses })

    const chunkSizes = calls
      .filter(([n]) => n === 'insert')
      .map(([, chunk]) => (chunk as unknown[]).length)
    expect(chunkSizes).toEqual([50, 10])
    expect(inserted).toHaveLength(60)
  })

  it('bulk returns [] for empty input without querying', async () => {
    expect(await bulkCreateGuildSubclasses({ guild_id: 'g1', subclasses: [] })).toEqual([])
    expect(client.from).not.toHaveBeenCalled()
  })
})
