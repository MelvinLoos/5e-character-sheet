// MCP endpoint. The handler is prebuilt from src/mcp by `npm run build:mcp`.
import { resolveSupabaseUrl } from '../../resolve-supabase-url'
import { handleMcpRequest, depsFromEnv } from '../../dist-mcp/handler.mjs'

export default async (req: Request): Promise<Response> =>
  handleMcpRequest(
    req,
    depsFromEnv({
      supabaseUrl: resolveSupabaseUrl(process.env),
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      siteUrl: process.env.URL,
      mcpSecretToken: process.env.MCP_SECRET_TOKEN,
      ownerUserId: process.env.MCP_OWNER_USER_ID,
      ownerGuildIds: process.env.MCP_OWNER_GUILD_IDS,
    }),
  )

export const config = {
  path: '/mcp',
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip', 'domain'] },
}
