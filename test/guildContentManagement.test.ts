import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../src/stores/authStore'

// Mock Supabase client chain
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockSelect = vi.fn()

const mockSupabaseClient = {
  from: vi.fn(() => ({
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    select: mockSelect,
  })),
}

vi.mock('../src/infra/sharingService', () => ({
  getSupabaseClient: vi.fn(() => mockSupabaseClient),
}))

import {
  createGuildSpell,
  updateGuildSpell,
  deleteGuildSpell,
  createGuildFeat,
  updateGuildFeat,
  deleteGuildFeat,
} from '../src/utils/guildContentManagement'

function createMockAuthStore(userId = 'user-uuid-test') {
  const store = useAuthStore()
  store.$patch({
    userId,
    status: 'authenticated',
  })
  return store
}

// =============================================================================
// Bulk Create Tests (RED — implementation not written yet)
// =============================================================================

describe('guildContentManagement - bulkCreateGuildSpells', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
    mockSelect.mockResolvedValue({ data: null, error: null })
  })

  it('bulkCreateGuildSpells inserts multiple spells and returns the created rows', async () => {
    createMockAuthStore('user-uuid-123')

    const createdRows = [
      { id: 's1', guild_id: 'g1', data: { name: 'Spell A', level: 1 }, created_by: 'user-uuid-123' },
      { id: 's2', guild_id: 'g1', data: { name: 'Spell B', level: 2 }, created_by: 'user-uuid-123' },
    ]

    mockInsert.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: createdRows, error: null }),
    })

    const { bulkCreateGuildSpells } = await import('../src/utils/guildContentManagement')
    const result = await bulkCreateGuildSpells({
      guild_id: 'g1',
      spells: [
        { name: 'Spell A', level: 1 },
        { name: 'Spell B', level: 2 },
      ],
    })

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('guild_spells')
    expect(mockInsert).toHaveBeenCalledWith([
      { guild_id: 'g1', data: { name: 'Spell A', level: 1 }, created_by: 'user-uuid-123' },
      { guild_id: 'g1', data: { name: 'Spell B', level: 2 }, created_by: 'user-uuid-123' },
    ])
    expect(result).toEqual(createdRows)
  })

  it('bulkCreateGuildSpells chunks arrays larger than 50 items', async () => {
    createMockAuthStore('user-uuid-123')

    const spells = Array.from({ length: 120 }, (_, i) => ({ name: `Spell ${i}`, level: i % 10 }))
    const createdChunk = spells.slice(0, 50).map((s) => ({
      id: 'id-' + s.name,
      guild_id: 'g1',
      data: s,
      created_by: 'user-uuid-123',
    }))

    mockInsert.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: createdChunk, error: null }),
    })

    const { bulkCreateGuildSpells } = await import('../src/utils/guildContentManagement')
    const result = await bulkCreateGuildSpells({
      guild_id: 'g1',
      spells,
    })

    // Should have been called 3 times: 50 + 50 + 20
    expect(mockInsert).toHaveBeenCalledTimes(3)
    expect(result.length).toBe(150) // 3 chunks × 50
  })

  it('bulkCreateGuildSpells throws when Supabase returns an error on any chunk', async () => {
    createMockAuthStore('user-uuid-123')

    const spells = Array.from({ length: 10 }, (_, i) => ({ name: `Spell ${i}`, level: 0 }))

    mockInsert.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: new Error('Bulk insert failed') }),
    })

    const { bulkCreateGuildSpells } = await import('../src/utils/guildContentManagement')

    await expect(
      bulkCreateGuildSpells({
        guild_id: 'g1',
        spells,
      }),
    ).rejects.toThrow('Bulk insert failed')
  })

  it('bulkCreateGuildSpells returns empty array when spells array is empty', async () => {
    createMockAuthStore('user-uuid-123')

    const { bulkCreateGuildSpells } = await import('../src/utils/guildContentManagement')
    const result = await bulkCreateGuildSpells({
      guild_id: 'g1',
      spells: [],
    })

    expect(result).toEqual([])
    expect(mockInsert).not.toHaveBeenCalled()
  })
})

describe('guildContentManagement - bulkCreateGuildFeats', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
    mockSelect.mockResolvedValue({ data: null, error: null })
  })

  it('bulkCreateGuildFeats inserts multiple feats and returns the created rows', async () => {
    createMockAuthStore('user-uuid-456')

    const createdRows = [
      { id: 'f1', guild_id: 'g2', data: { name: 'Feat A' }, created_by: 'user-uuid-456' },
      { id: 'f2', guild_id: 'g2', data: { name: 'Feat B' }, created_by: 'user-uuid-456' },
    ]

    mockInsert.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: createdRows, error: null }),
    })

    const { bulkCreateGuildFeats } = await import('../src/utils/guildContentManagement')
    const result = await bulkCreateGuildFeats({
      guild_id: 'g2',
      feats: [
        { name: 'Feat A' },
        { name: 'Feat B' },
      ],
    })

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('guild_feats')
    expect(mockInsert).toHaveBeenCalledWith([
      { guild_id: 'g2', data: { name: 'Feat A' }, created_by: 'user-uuid-456' },
      { guild_id: 'g2', data: { name: 'Feat B' }, created_by: 'user-uuid-456' },
    ])
    expect(result).toEqual(createdRows)
  })

  it('bulkCreateGuildFeats chunks arrays larger than 50 items', async () => {
    createMockAuthStore('user-uuid-456')

    const feats = Array.from({ length: 75 }, (_, i) => ({ name: `Feat ${i}` }))
    const createdChunk = feats.slice(0, 50).map((f) => ({
      id: 'id-' + f.name,
      guild_id: 'g2',
      data: f,
      created_by: 'user-uuid-456',
    }))

    mockInsert.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: createdChunk, error: null }),
    })

    const { bulkCreateGuildFeats } = await import('../src/utils/guildContentManagement')
    const result = await bulkCreateGuildFeats({
      guild_id: 'g2',
      feats,
    })

    // Should have been called 2 times: 50 + 25
    expect(mockInsert).toHaveBeenCalledTimes(2)
    expect(result.length).toBe(100) // 2 chunks × 50
  })

  it('bulkCreateGuildFeats throws when Supabase returns an error on any chunk', async () => {
    createMockAuthStore('user-uuid-456')

    mockInsert.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: new Error('Bulk insert failed') }),
    })

    const { bulkCreateGuildFeats } = await import('../src/utils/guildContentManagement')

    await expect(
      bulkCreateGuildFeats({
        guild_id: 'g2',
        feats: [{ name: 'Fail' }],
      }),
    ).rejects.toThrow('Bulk insert failed')
  })

  it('bulkCreateGuildFeats returns empty array when feats array is empty', async () => {
    createMockAuthStore('user-uuid-456')

    const { bulkCreateGuildFeats } = await import('../src/utils/guildContentManagement')
    const result = await bulkCreateGuildFeats({
      guild_id: 'g2',
      feats: [],
    })

    expect(result).toEqual([])
    expect(mockInsert).not.toHaveBeenCalled()
  })
})

describe('guildContentManagement - Spells', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
    mockUpdate.mockResolvedValue({ error: null })
    mockDelete.mockResolvedValue({ error: null })
    mockSelect.mockResolvedValue({ data: null, error: null })
  })

  // ---------------------------------------------------------------------------
  // createGuildSpell
  // ---------------------------------------------------------------------------

  it('createGuildSpell inserts into guild_spells and returns the created row', async () => {
    createMockAuthStore('user-uuid-123')

    const createdRow = {
      id: 'spell-uuid-1',
      guild_id: 'guild-1',
      data: { name: 'Test Spell', level: 1 },
      created_by: 'user-uuid-123',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: createdRow, error: null }),
      }),
    })

    const result = await createGuildSpell({
      guild_id: 'guild-1',
      data: { name: 'Test Spell', level: 1 },
    })

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('guild_spells')
    expect(mockInsert).toHaveBeenCalledWith({
      guild_id: 'guild-1',
      data: { name: 'Test Spell', level: 1 },
      created_by: 'user-uuid-123',
    })
    expect(result).toEqual(createdRow)
  })

  it('createGuildSpell throws when Supabase returns an error', async () => {
    createMockAuthStore('user-uuid-123')

    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
      }),
    })

    await expect(
      createGuildSpell({
        guild_id: 'guild-1',
        data: { name: 'Test Spell' },
      }),
    ).rejects.toThrow('Insert failed')
  })

  // ---------------------------------------------------------------------------
  // updateGuildSpell
  // ---------------------------------------------------------------------------

  it('updateGuildSpell updates the spell data and returns the updated row', async () => {
    createMockAuthStore('user-uuid-123')

    const updatedRow = {
      id: 'spell-uuid-1',
      guild_id: 'guild-1',
      data: { name: 'Updated Spell', level: 2 },
      created_by: 'user-uuid-123',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    }

    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: updatedRow, error: null }),
        }),
      }),
    })

    const result = await updateGuildSpell('spell-uuid-1', { name: 'Updated Spell', level: 2 })

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('guild_spells')
    expect(mockUpdate).toHaveBeenCalledWith({
      data: { name: 'Updated Spell', level: 2 },
      updated_at: expect.any(String),
    })
    expect(result).toEqual(updatedRow)
  })

  it('updateGuildSpell throws when Supabase returns an error', async () => {
    createMockAuthStore('user-uuid-123')

    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: new Error('Update failed') }),
        }),
      }),
    })

    await expect(updateGuildSpell('spell-uuid-1', { name: 'Fail' })).rejects.toThrow('Update failed')
  })

  // ---------------------------------------------------------------------------
  // deleteGuildSpell
  // ---------------------------------------------------------------------------

  it('deleteGuildSpell deletes the spell from guild_spells', async () => {
    createMockAuthStore('user-uuid-123')

    mockDelete.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    await deleteGuildSpell('spell-uuid-1')

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('guild_spells')
    expect(mockDelete).toHaveBeenCalled()
  })

  it('deleteGuildSpell throws when Supabase returns an error', async () => {
    createMockAuthStore('user-uuid-123')

    mockDelete.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') }),
    })

    await expect(deleteGuildSpell('spell-uuid-1')).rejects.toThrow('Delete failed')
  })
})

describe('guildContentManagement - Feats', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
    mockUpdate.mockResolvedValue({ error: null })
    mockDelete.mockResolvedValue({ error: null })
    mockSelect.mockResolvedValue({ data: null, error: null })
  })

  // ---------------------------------------------------------------------------
  // createGuildFeat
  // ---------------------------------------------------------------------------

  it('createGuildFeat inserts into guild_feats and returns the created row', async () => {
    createMockAuthStore('user-uuid-456')

    const createdRow = {
      id: 'feat-uuid-1',
      guild_id: 'guild-2',
      data: { name: 'Test Feat' },
      created_by: 'user-uuid-456',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: createdRow, error: null }),
      }),
    })

    const result = await createGuildFeat({
      guild_id: 'guild-2',
      data: { name: 'Test Feat' },
    })

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('guild_feats')
    expect(mockInsert).toHaveBeenCalledWith({
      guild_id: 'guild-2',
      data: { name: 'Test Feat' },
      created_by: 'user-uuid-456',
    })
    expect(result).toEqual(createdRow)
  })

  it('createGuildFeat throws when Supabase returns an error', async () => {
    createMockAuthStore('user-uuid-456')

    mockInsert.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
      }),
    })

    await expect(
      createGuildFeat({
        guild_id: 'guild-2',
        data: { name: 'Fail' },
      }),
    ).rejects.toThrow('Insert failed')
  })

  // ---------------------------------------------------------------------------
  // updateGuildFeat
  // ---------------------------------------------------------------------------

  it('updateGuildFeat updates the feat data and returns the updated row', async () => {
    createMockAuthStore('user-uuid-456')

    const updatedRow = {
      id: 'feat-uuid-1',
      guild_id: 'guild-2',
      data: { name: 'Updated Feat' },
      created_by: 'user-uuid-456',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    }

    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: updatedRow, error: null }),
        }),
      }),
    })

    const result = await updateGuildFeat('feat-uuid-1', { name: 'Updated Feat' })

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('guild_feats')
    expect(mockUpdate).toHaveBeenCalledWith({
      data: { name: 'Updated Feat' },
      updated_at: expect.any(String),
    })
    expect(result).toEqual(updatedRow)
  })

  it('updateGuildFeat throws when Supabase returns an error', async () => {
    createMockAuthStore('user-uuid-456')

    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: new Error('Update failed') }),
        }),
      }),
    })

    await expect(updateGuildFeat('feat-uuid-1', { name: 'Fail' })).rejects.toThrow('Update failed')
  })

  // ---------------------------------------------------------------------------
  // deleteGuildFeat
  // ---------------------------------------------------------------------------

  it('deleteGuildFeat deletes the feat from guild_feats', async () => {
    createMockAuthStore('user-uuid-456')

    mockDelete.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    await deleteGuildFeat('feat-uuid-1')

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('guild_feats')
    expect(mockDelete).toHaveBeenCalled()
  })

  it('deleteGuildFeat throws when Supabase returns an error', async () => {
    createMockAuthStore('user-uuid-456')

    mockDelete.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: new Error('Delete failed') }),
    })

    await expect(deleteGuildFeat('feat-uuid-1')).rejects.toThrow('Delete failed')
  })
})