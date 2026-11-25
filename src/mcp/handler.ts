import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createClient } from '@supabase/supabase-js'
import { createMcpServer, type McpDeps } from './server'

export const MAX_BODY_BYTES = 64 * 1024

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id',
}

const reply = (status: number, body?: unknown): Response =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { ...CORS, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
  })

export interface McpEnv {
  supabaseUrl?: string
  supabaseAnonKey?: string
  siteUrl?: string
}

/** Production dependency wiring: inserts into the same `characters` table the share button uses. */
export function depsFromEnv(env: McpEnv): McpDeps {
  return {
    siteUrl: env.siteUrl ?? '',
    insertCharacter: async (data) => {
      if (!env.supabaseUrl || !env.supabaseAnonKey) throw new Error('Supabase is not configured.')
      const client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
        auth: { persistSession: false },
      })
      const { data: row, error } = await client
        .from('characters')
        .insert([{ name: data.name, character_data: data, source_character_id: null }])
        .select('id')
        .single()
      if (error) throw new Error(`Could not save character: ${error.message}`)
      return row.id as string
    },
  }
}

/** Stateless Streamable HTTP handler: one server + transport per request. */
export async function handleMcpRequest(req: Request, deps: McpDeps): Promise<Response> {
  if (req.method === 'OPTIONS') return reply(204)
  if (req.method !== 'POST')
    return reply(405, { error: 'Method not allowed. POST JSON-RPC to /mcp.' })

  const body = await req.text()
  if (new TextEncoder().encode(body).length > MAX_BODY_BYTES)
    return reply(413, { error: 'Request too large.' })

  const server = createMcpServer(deps)
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
