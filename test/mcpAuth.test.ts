import { describe, it, expect } from 'vitest'
import { authenticateMcpRequest, verifyMcpBearerToken } from '@/mcp/auth'

const req = (authorization?: string) =>
  new Request('https://sheet.test/mcp', {
    headers: authorization ? { authorization } : {},
  })
const env = { MCP_SECRET_TOKEN: 'secret', MCP_OWNER_USER_ID: 'owner-1' }

describe('verifyMcpBearerToken', () => {
  it('accepts the exact token', () => {
    expect(verifyMcpBearerToken('Bearer secret', 'secret')).toBe(true)
    expect(verifyMcpBearerToken('  Bearer secret  ', 'secret')).toBe(true)
  })
  it('rejects missing, malformed, empty and wrong tokens', () => {
    expect(verifyMcpBearerToken(null, 'secret')).toBe(false)
    expect(verifyMcpBearerToken('secret', 'secret')).toBe(false)
    expect(verifyMcpBearerToken('Basic secret', 'secret')).toBe(false)
    expect(verifyMcpBearerToken('Bearer ', 'secret')).toBe(false)
    expect(verifyMcpBearerToken('Bearer wrong!', 'secret')).toBe(false)
    expect(verifyMcpBearerToken('Bearer secre', 'secret')).toBe(false)
    expect(verifyMcpBearerToken('Bearer secret', '')).toBe(false)
  })
})

describe('authenticateMcpRequest', () => {
  it('returns the owner id for a valid token', () => {
    expect(authenticateMcpRequest(req('Bearer secret'), env)).toEqual({
      ok: true,
      userId: 'owner-1',
    })
  })
  it('returns 401 for a missing or invalid token', () => {
    for (const header of [undefined, 'Bearer nope']) {
      expect(authenticateMcpRequest(req(header), env)).toMatchObject({ ok: false, status: 401 })
    }
  })
  it('fails closed with 500 when env is missing or blank', () => {
    const r = req('Bearer secret')
    for (const e of [
      {},
      { MCP_SECRET_TOKEN: 'secret' },
      { MCP_OWNER_USER_ID: 'owner-1' },
      { MCP_SECRET_TOKEN: '  ', MCP_OWNER_USER_ID: 'owner-1' },
    ]) {
      expect(authenticateMcpRequest(r, e)).toMatchObject({ ok: false, status: 500 })
    }
  })
})
