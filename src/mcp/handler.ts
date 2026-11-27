import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createClient } from '@supabase/supabase-js'
import { createMcpServer, type McpDeps } from './server'
import { accountApi, parseGuildIds, type AccountApi } from './account'
import { authenticateMcpRequest, type McpAuthEnv } from './auth'

export const MAX_BODY_BYTES = 64 * 1024

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Accept, Authorization, Mcp-Protocol-Version, Mcp-Session-Id',
}

const reply = (status: number, body?: unknown): Response =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { ...CORS, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
  })

export interface HandlerDeps extends McpDeps {
  /** Static Bearer auth config (MCP_SECRET_TOKEN / MCP_OWNER_USER_ID). */
  authEnv: McpAuthEnv
  /** Enables the guild tools for the authenticated owner; omit when Supabase isn't configured. */
  accountFor?: (userId: string) => AccountApi
}

export interface McpEnv {
  supabaseUrl?: string
  /** Server-side only. Never expose to the client bundle. */
  serviceRoleKey?: string
  siteUrl?: string
  mcpSecretToken?: string
  ownerUserId?: string
  /** Comma-separated Discord guild ids the owner may read homebrew from. */
  ownerGuildIds?: string
}

/** Production dependency wiring: a service-role client, scoped explicitly to the owner. */
export function depsFromEnv(env: McpEnv): HandlerDeps {
  const client =
    env.supabaseUrl && env.serviceRoleKey
      ? createClient(env.supabaseUrl, env.serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : undefined
  const guildIds = parseGuildIds(env.ownerGuildIds)
  return {
    siteUrl: env.siteUrl ?? '',
    authEnv: { MCP_SECRET_TOKEN: env.mcpSecretToken, MCP_OWNER_USER_ID: env.ownerUserId },
    accountFor: client ? () => accountApi(client, guildIds) : undefined,
    insertCharacter: async (data, userId) => {
      if (!client) throw new Error('Supabase is not configured.')
      const { data: row, error } = await client
        .from('characters')
        .insert([
          { name: data.name, character_data: data, source_character_id: null, user_id: userId },
        ])
        .select('id')
        .single()
      if (error) throw new Error(`Could not save character: ${error.message}`)
      return row.id as string
    },
  }
}

/** Stateless Streamable HTTP handler: one server + transport per request. */
export async function handleMcpRequest(req: Request, deps: HandlerDeps): Promise<Response> {
  if (req.method === 'OPTIONS') return reply(204)

  const auth = authenticateMcpRequest(req, deps.authEnv)
  if (!auth.ok) return reply(auth.status, { error: auth.error })

  if (req.method !== 'POST')
    return reply(405, { error: 'Method not allowed. POST JSON-RPC to /mcp.' })

  const body = await req.text()
  if (new TextEncoder().encode(body).length > MAX_BODY_BYTES)
    return reply(413, { error: 'Request too large.' })

  const server = createMcpServer(deps, auth.userId, deps.accountFor?.(auth.userId))
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await server.connect(transport)
  try {
    const res = await transport.handleRequest(
      new Request(req.url, { method: 'POST', headers: req.headers, body }),
    )
    const headers = new Headers(res.headers)
    for (const [k, v] of Object.entries(CORS)) headers.set(k, v)
    return new Response(res.body, { status: res.status, headers })
  } finally {
    await server.close()
  }
}
