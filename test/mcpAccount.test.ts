import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { handleMcpRequest } from '@/mcp/handler'
import { accountApi, parseGuildIds, type AccountApi } from '@/mcp/account'

const api: AccountApi = {
  listGuilds: async () => [{ id: '1', name: 'Heroes Guild' }],
  searchSpells: vi.fn(async () => [{ name: 'Guild Bolt', level: 1 }]),
  searchFeats: async () => [],
  searchSubclasses: async () => [],
  listSubclasses: async () => [],
}
const accountFor = vi.fn(() => api)
const deps = {
  siteUrl: 'https://sheet.test',
  insertCharacter: vi.fn(async () => 'id'),
  authEnv: { MCP_SECRET_TOKEN: 'secret', MCP_OWNER_USER_ID: 'owner-1' },
  accountFor,
}

const call = (name: string, args: unknown, token?: string, d = deps) =>
  handleMcpRequest(
    new Request('https://sheet.test/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name, arguments: args },
      }),
    }),
    d,
  )

describe('bearer auth on /mcp', () => {
  it('rejects missing and wrong tokens without an OAuth challenge', async () => {
    for (const token of [undefined, 'wrong']) {
      const res = await call('list_options', { category: 'classes' }, token)
      expect(res.status).toBe(401)
      expect(res.headers.get('www-authenticate')).toBeNull()
    }
  })
  it('fails closed when auth is not configured', async () => {
    const res = await call('list_options', {}, 'secret', { ...deps, authEnv: {} })
    expect(res.status).toBe(500)
  })
  it('lets CORS preflight through without a token', async () => {
    const res = await handleMcpRequest(
      new Request('https://sheet.test/mcp', { method: 'OPTIONS' }),
      deps,
    )
    expect(res.status).toBe(204)
  })
  it('serves guild tools for the owner', async () => {
    const res = await call('search_guild_spells', { query: 'bolt' }, 'secret')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(JSON.parse(body.result.content[0].text)[0].name).toBe('Guild Bolt')
    expect(accountFor).toHaveBeenCalledWith('owner-1')
    expect(api.searchSpells).toHaveBeenCalledWith({ query: 'bolt' })
  })
  it('reports guild tools as unconfigured without Supabase', async () => {
    const res = await call('list_guilds', {}, 'secret', { ...deps, accountFor: undefined })
    expect((await res.json()).result.isError).toBe(true)
  })
})

describe('parseGuildIds', () => {
  it('splits, trims and drops blanks', () => {
    expect(parseGuildIds(' 1, 2 ,,3')).toEqual(['1', '2', '3'])
    expect(parseGuildIds(undefined)).toEqual([])
  })
})

describe('accountApi', () => {
  const rows = [
    {
      id: 'a',
      guild_id: 'g1',
      data: { name: 'Frost Lance', level: 2, desc: 'Cold beam.', classes: ['Wizard'] },
    },
    {
      id: 'b',
      guild_id: 'g1',
      data: { name: 'Mend', level: 1, desc: 'Heal.', classes: ['Cleric'] },
    },
    { id: 'c', guild_id: 'g1', data: { broken: true } },
  ]
  const makeFake = () => {
    const calls: Array<[string, ...unknown[]]> = []
    const chain: Record<string, unknown> = {
      select: () => chain,
      limit: () => chain,
      eq: (...a: unknown[]) => (calls.push(['eq', ...a]), chain),
      in: (...a: unknown[]) => (calls.push(['in', ...a]), chain),
      then: (r: (v: unknown) => void) => r({ data: rows, error: null }),
    }
    const from = vi.fn(() => chain)
    return { fake: { from } as unknown as SupabaseClient, calls, from }
  }

  it('filters by class, level and text, skipping invalid rows', async () => {
    const a = accountApi(makeFake().fake, ['g1'])
    expect((await a.searchSpells({})).map((s) => s.name)).toEqual(['Frost Lance', 'Mend'])
    expect((await a.searchSpells({ className: 'cleric' })).map((s) => s.name)).toEqual(['Mend'])
    expect((await a.searchSpells({ level: 2 })).map((s) => s.name)).toEqual(['Frost Lance'])
    expect((await a.searchSpells({ query: 'cold' })).map((s) => s.name)).toEqual(['Frost Lance'])
  })
  it('scopes every query to the owner guild ids', async () => {
    const { fake, calls } = makeFake()
    const a = accountApi(fake, ['g1', 'g2'])
    await a.searchSpells({})
    await a.searchFeats({ guildId: 'g2' })
    await a.listGuilds()
    expect(calls.filter((c) => c[0] === 'in')).toEqual([
      ['in', 'guild_id', ['g1', 'g2']],
      ['in', 'guild_id', ['g1', 'g2']],
      ['in', 'guild_id', ['g1', 'g2']],
    ])
    expect(calls).toContainEqual(['eq', 'guild_id', 'g2'])
  })
  it('fails closed with no guilds or an out-of-scope guild', async () => {
    const empty = makeFake()
    const none = accountApi(empty.fake, [])
    expect(await none.searchSpells({})).toEqual([])
    expect(await none.listGuilds()).toEqual([])
    const scoped = makeFake()
    expect(await accountApi(scoped.fake, ['g1']).searchFeats({ guildId: 'other' })).toEqual([])
    expect(empty.from).not.toHaveBeenCalled()
    expect(scoped.from).not.toHaveBeenCalled()
  })
})

describe('accountApi subclasses', () => {
  const valid = (name: string, parentClass: string) => ({
    name,
    parentClass,
    description: `${name} lore`,
    features: [{ name: `${name} Feature`, level: 3, description: 'Does a thing.' }],
  })
  const rows = [
    { id: 'a', guild_id: 'g1', data: valid('Blade Dancer', 'Fighter') },
    { id: 'b', guild_id: 'g2', data: valid('Ember Circle', 'druid') },
    { id: 'c', guild_id: 'g1', data: valid('Champion', 'Fighter') }, // built-in name: invalid
    { id: 'd', guild_id: 'g1', data: { broken: true } },
  ]
  const makeFake = () => {
    const calls: Array<[string, ...unknown[]]> = []
    const chain: Record<string, unknown> = {
      select: () => chain,
      limit: () => chain,
      eq: (...a: unknown[]) => (calls.push(['eq', ...a]), chain),
      in: (...a: unknown[]) => (calls.push(['in', ...a]), chain),
      then: (r: (v: unknown) => void) => r({ data: rows, error: null }),
    }
    const from = vi.fn(() => chain)
    return { fake: { from } as unknown as SupabaseClient, calls, from }
  }

  it('skips invalid rows, canonicalises, and returns the option id and features', async () => {
    const { fake, from } = makeFake()
    const out = await accountApi(fake, ['g1', 'g2']).searchSubclasses({})
    expect(from).toHaveBeenCalledWith('guild_subclasses')
    expect(out.map((s) => s.name)).toEqual(['Blade Dancer', 'Ember Circle'])
    expect(out[1]).toMatchObject({
      guildId: 'g2',
      id: 'custom-druid-ember-circle',
      parentClass: 'Druid',
      features: [{ level: 3, name: 'Ember Circle Feature', desc: 'Does a thing.' }],
    })
  })

  it('filters by class and text', async () => {
    const a = accountApi(makeFake().fake, ['g1', 'g2'])
    expect((await a.searchSubclasses({ className: 'DRUID' })).map((s) => s.name)).toEqual([
      'Ember Circle',
    ])
    expect((await a.searchSubclasses({ query: 'dancer lore' })).map((s) => s.name)).toEqual([
      'Blade Dancer',
    ])
  })

  it('lists valid subclasses and stays scoped to the owner guilds', async () => {
    const { fake, calls } = makeFake()
    const list = await accountApi(fake, ['g1', 'g2']).listSubclasses()
    expect(list.map((s) => s.name)).toEqual(['Blade Dancer', 'Ember Circle'])
    expect(calls).toContainEqual(['in', 'guild_id', ['g1', 'g2']])
  })

  it('fails closed with no guilds', async () => {
    const { fake, from } = makeFake()
    expect(await accountApi(fake, []).listSubclasses()).toEqual([])
    expect(from).not.toHaveBeenCalled()
  })
})
