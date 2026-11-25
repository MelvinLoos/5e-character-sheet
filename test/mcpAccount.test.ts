import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { handleMcpRequest, handleMetadataRequest } from '@/mcp/handler'
import { accountApi, type AccountApi } from '@/mcp/account'

const api: AccountApi = {
  listGuilds: async () => [{ id: '1', name: 'Heroes Guild' }],
  searchSpells: vi.fn(async () => [{ name: 'Guild Bolt', level: 1 }]),
  searchFeats: async () => [],
}
const verify = vi.fn(async (t: string) => (t === 'good' ? api : null))
const deps = {
  siteUrl: 'https://sheet.test',
  insertCharacter: vi.fn(async () => 'id'),
  verifier: { verify },
  issuer: 'https://ref.supabase.co/auth/v1',
}

const call = (name: string, args: unknown, token?: string) =>
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
    deps,
  )

describe('protected resource metadata', () => {
  it('points at the Supabase OAuth server', async () => {
    const res = handleMetadataRequest(
      new Request('https://sheet.test/.well-known/oauth-protected-resource/mcp'),
      deps,
    )
    expect(await res.json()).toMatchObject({
      resource: 'https://sheet.test/mcp',
      authorization_servers: ['https://ref.supabase.co/auth/v1'],
    })
  })
  it('404s when sign-in is not configured', () => {
    expect(
      handleMetadataRequest(new Request('https://sheet.test/x'), { ...deps, issuer: undefined })
        .status,
    ).toBe(404)
  })
})

describe('account tools', () => {
  it('challenge anonymous callers', async () => {
    const res = await call('search_guild_spells', {})
    expect(res.status).toBe(401)
    const h = res.headers.get('www-authenticate')!
    expect(h).toContain(
      'resource_metadata="https://sheet.test/.well-known/oauth-protected-resource/mcp"',
    )
    expect(h).not.toContain('invalid_token')
  })
  it('flags a rejected token', async () => {
    const res = await call('list_guilds', {}, 'bad')
    expect(res.status).toBe(401)
    expect(res.headers.get('www-authenticate')).toContain('invalid_token')
  })
  it('serve signed-in callers', async () => {
    const res = await call('search_guild_spells', { query: 'bolt' }, 'good')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(JSON.parse(body.result.content[0].text)[0].name).toBe('Guild Bolt')
    expect(api.searchSpells).toHaveBeenCalledWith({ query: 'bolt' })
  })
  it('leave anonymous tools open without a token', async () => {
    verify.mockClear()
    const res = await call('list_options', { category: 'classes' })
    expect(res.status).toBe(200)
    expect(verify).not.toHaveBeenCalled()
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
  const chain = {
    select: () => chain,
    limit: () => chain,
    eq: () => chain,
    then: (r: (v: unknown) => void) => r({ data: rows, error: null }),
  }
  const fake = { from: () => chain } as unknown as SupabaseClient
  it('filters by class, level and text, skipping invalid rows', async () => {
    const a = accountApi(fake)
    expect((await a.searchSpells({})).map((s) => s.name)).toEqual(['Frost Lance', 'Mend'])
    expect((await a.searchSpells({ className: 'cleric' })).map((s) => s.name)).toEqual(['Mend'])
    expect((await a.searchSpells({ level: 2 })).map((s) => s.name)).toEqual(['Frost Lance'])
    expect((await a.searchSpells({ query: 'cold' })).map((s) => s.name)).toEqual(['Frost Lance'])
  })
})
