import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createClient } from '@supabase/supabase-js'
import { createMcpServer, type McpDeps } from './server'
import { ACCOUNT_TOOLS, supabaseVerifier, type AccountApi, type AccountVerifier } from './account'

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
  /** Enables the account tools; omit when Supabase isn't configured. */
  verifier?: AccountVerifier
  /** OAuth issuer advertised to clients, e.g. https://<ref>.supabase.co/auth/v1 */
  issuer?: string
}

export interface McpEnv {
  supabaseUrl?: string
  supabaseAnonKey?: string
  siteUrl?: string
}

/** Production dependency wiring: inserts into the same `characters` table the share button uses. */
export function depsFromEnv(env: McpEnv): HandlerDeps {
  const configured = env.supabaseUrl && env.supabaseAnonKey
  return {
    siteUrl: env.siteUrl ?? '',
    issuer: env.supabaseUrl ? `${env.supabaseUrl.replace(/\/$/, '')}/auth/v1` : undefined,
    verifier: configured ? supabaseVerifier(env.supabaseUrl!, env.supabaseAnonKey!) : undefined,
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

const WELL_KNOWN = '/.well-known/oauth-protected-resource'

/** RFC 9728 protected-resource metadata, pointing clients at the Supabase OAuth server. */
export function handleMetadataRequest(req: Request, deps: HandlerDeps): Response {
  if (req.method === 'OPTIONS') return reply(204)
  if (!deps.issuer) return reply(404, { error: 'Sign-in is not configured.' })
  const origin = new URL(req.url).origin
  return reply(200, {
    resource: `${origin}/mcp`,
    authorization_servers: [deps.issuer],
    bearer_methods_supported: ['header'],
    scopes_supported: ['openid', 'email', 'profile'],
    resource_name: 'Heroes Guild Character Sheet',
  })
}

function challenge(req: Request, invalid: boolean): Response {
  const origin = new URL(req.url).origin
  const params = [`resource_metadata="${origin}${WELL_KNOWN}/mcp"`]
  if (invalid) params.push('error="invalid_token"')
  return new Response(JSON.stringify({ error: 'Sign in required for this tool.' }), {
    status: 401,
    headers: {
      ...CORS,
      'Content-Type': 'application/json',
      'Access-Control-Expose-Headers': 'WWW-Authenticate',
      'WWW-Authenticate': `Bearer ${params.join(', ')}`,
    },
  })
}

const needsAccount = (body: string): boolean => {
  try {
    const msgs = [JSON.parse(body)].flat()
    return msgs.some(
      (m) =>
        m?.method === 'tools/call' &&
        (ACCOUNT_TOOLS as readonly string[]).includes(m?.params?.name),
    )
  } catch {
    return false
  }
}

/** Stateless Streamable HTTP handler: one server + transport per request. */
export async function handleMcpRequest(req: Request, deps: HandlerDeps): Promise<Response> {
  if (req.method === 'OPTIONS') return reply(204)
  if (req.method !== 'POST')
    return reply(405, { error: 'Method not allowed. POST JSON-RPC to /mcp.' })

  const body = await req.text()
  if (new TextEncoder().encode(body).length > MAX_BODY_BYTES)
    return reply(413, { error: 'Request too large.' })

  // Account tools need a valid Supabase token; everything else stays anonymous.
  let account: AccountApi | undefined
  if (needsAccount(body)) {
    const token = /^Bearer (.+)$/i.exec(req.headers.get('authorization') ?? '')?.[1]
    if (!deps.verifier) return reply(503, { error: 'Sign-in is not configured.' })
    account = (token && (await deps.verifier.verify(token))) || undefined
    if (!account) return challenge(req, !!token)
  }

  const server = createMcpServer(deps, account)
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
