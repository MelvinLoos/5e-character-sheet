import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { handleMcpRequest } from '@/mcp/handler'
import { getClassBundle } from '@/utils/equipmentResolver'

const insertCharacter = vi.fn(async () => 'row-1')
const TOKEN = 'test-token'
const deps = {
  siteUrl: 'https://sheet.test/',
  insertCharacter,
  authEnv: { MCP_SECRET_TOKEN: TOKEN, MCP_OWNER_USER_ID: 'owner-1' },
}
const authHeader = { authorization: `Bearer ${TOKEN}` }

async function rpc(method: string, params?: unknown) {
  const res = await handleMcpRequest(
    new Request('https://sheet.test/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        ...authHeader,
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    }),
    deps,
  )
  return res.json()
}
const tool = async (name: string, args: unknown) => {
  const r = (await rpc('tools/call', { name, arguments: args })).result
  return {
    isError: !!r.isError,
    body: (() => {
      try {
        return JSON.parse(r.content[0].text)
      } catch {
        return r.content[0].text
      }
    })(),
  }
}

const wizard = {
  name: 'Test Wizard',
  class: 'Wizard',
  species: 'Human',
  background: 'Sage',
  pointBuyBaseScores: { str: 8, dex: 14, con: 14, int: 15, wis: 10, cha: 8 },
  backgroundBonusSelections: { plusTwo: 'int', plusOne: 'wis' },
}

describe('MCP handler', () => {
  it('lists the tools with the stripped authoring schema', async () => {
    const { result } = await rpc('tools/list')
    expect(result.tools.map((t: { name: string }) => t.name)).toEqual([
      'list_options',
      'get_option_details',
      'validate_character',
      'create_character',
      'list_guilds',
      'search_guild_spells',
      'search_guild_feats',
    ])
    const schema = JSON.parse(
      readFileSync(resolve(process.cwd(), 'public/llm-character-schema.json'), 'utf-8'),
    )
    delete schema.$schema
    delete schema.$id
    const create = result.tools.find((t: { name: string }) => t.name === 'create_character')
    expect(create.inputSchema.properties.character).toEqual(schema)
  })

  it('rejects non-POST and oversize bodies', async () => {
    const get = await handleMcpRequest(
      new Request('https://sheet.test/mcp', { headers: authHeader }),
      deps,
    )
    expect(get.status).toBe(405)
    const big = await handleMcpRequest(
      new Request('https://sheet.test/mcp', {
        method: 'POST',
        headers: authHeader,
        body: 'x'.repeat(70_000),
      }),
      deps,
    )
    expect(big.status).toBe(413)
  })

  it('lists and describes options', async () => {
    const list = await tool('list_options', { category: 'classes' })
    expect(list.body.map((c: { id: string }) => c.id)).toContain('Wizard')
    const detail = await tool('get_option_details', { category: 'classes', id: 'Wizard' })
    expect(detail.body.hitDie).toBe('d6')
    expect((await tool('get_option_details', { category: 'classes', id: 'Nope' })).isError).toBe(
      true,
    )
  })

  it('validates a legal character without saving', async () => {
    insertCharacter.mockClear()
    const r = await tool('validate_character', { character: wizard })
    expect(r.isError).toBe(false)
    expect(r.body.summary.abilityScores.int).toBe(17)
    expect(insertCharacter).not.toHaveBeenCalled()
  })

  it('creates a character and returns a share link', async () => {
    insertCharacter.mockClear()
    const r = await tool('create_character', { character: wizard })
    expect(r.body.shareUrl).toBe('https://sheet.test/?id=row-1')
    expect(insertCharacter).toHaveBeenCalledOnce()
    expect((insertCharacter.mock.calls[0] as unknown[])[1]).toBe('owner-1')
    const saved = (insertCharacter.mock.calls[0] as unknown[])[0] as {
      combat: { hp_max: number; hp_current: number }
    }
    expect(saved.combat.hp_current).toBe(saved.combat.hp_max)
  })

  it('rejects illegal point buy and duplicate bonuses without inserting', async () => {
    insertCharacter.mockClear()
    const bad = await tool('create_character', {
      character: {
        ...wizard,
        pointBuyBaseScores: { str: 15, dex: 15, con: 15, int: 15, wis: 8, cha: 8 },
        backgroundBonusSelections: { plusTwo: 'int', plusOne: 'int' },
      },
    })
    expect(bad.isError).toBe(true)
    expect(bad.body.errors.join(' ')).toMatch(/budget/)
    expect(bad.body.errors.join(' ')).toMatch(/different/)
    expect(insertCharacter).not.toHaveBeenCalled()
  })

  it('rejects unknown fields via the schema', async () => {
    const r = await tool('validate_character', { character: { ...wizard, bogus: 20 } })
    expect(r.isError).toBe(true)
  })

  it('builds a level-mode character on request and defaults to Renown', async () => {
    const lvl = await tool('validate_character', {
      character: { ...wizard, progressionMode: 'level', level: 5 },
    })
    expect(lvl.isError).toBe(false)
    expect(lvl.body.summary.effectiveLevel).toBe(5)
    expect(lvl.body.summary.proficiencyBonus).toBe(3)

    const renown = await tool('validate_character', { character: wizard })
    expect(renown.body.summary.effectiveLevel).toBe(3)
  })

  it('applies starting equipment and demands choices', async () => {
    const bundle = getClassBundle('Wizard', 'A')!
    const missing = await tool('validate_character', {
      character: wizard,
      startingEquipment: { classOption: 'A', backgroundOption: 'B' },
    })
    expect(missing.isError).toBe(!!bundle.choices?.length)
    const classChoices = (bundle.choices ?? []).map((c, i) => ({
      choiceIndex: i,
      itemId: c.options[0]!.itemId,
    }))
    const ok = await tool('validate_character', {
      character: wizard,
      startingEquipment: { classOption: 'A', backgroundOption: 'B', classChoices },
    })
    expect(ok.isError).toBe(false)
  })

  it('accepts feature choices and reports pending ones', async () => {
    const fighter = {
      ...wizard,
      class: 'Fighter',
      background: 'Soldier',
      pointBuyBaseScores: { str: 15, dex: 13, con: 14, int: 8, wis: 10, cha: 8 },
      backgroundBonusSelections: { plusTwo: 'str', plusOne: 'con' },
    }
    const pending = await tool('validate_character', { character: fighter })
    expect(
      pending.body.summary.pendingFeatureChoices.map((p: { choice: string }) => p.choice),
    ).toContain('fighting-style')
    const done = await tool('validate_character', {
      character: {
        ...fighter,
        featureChoices: { 'fighting-style': ['defense'] },
        proficiencies: { skills: ['perception', 'survival'] },
      },
    })
    expect(done.isError).toBe(false)
    expect(done.body.summary.featureChoices).toEqual({ 'fighting-style': ['defense'] })
    expect(done.body.summary.features).toContain('Fighting Style: Defense')
    expect(done.body.summary.skills).not.toContain('religion')
    expect(done.body.summary.pendingSkillChoices).toBeNull()
  })

  it('rejects unknown feature choice options', async () => {
    const r = await tool('validate_character', {
      character: { ...wizard, featureChoices: { 'fighting-style': ['defense'] } },
    })
    expect(r.isError).toBe(true)
    expect(r.body.errors.join(' ')).toMatch(/not available/)
  })
})
