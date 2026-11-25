// MCP endpoint. The handler is prebuilt from src/mcp by `npm run build:mcp`.
import { handleMcpRequest, depsFromEnv } from '../../dist-mcp/handler.mjs'

export default async (req: Request): Promise<Response> =>
  handleMcpRequest(
    req,
    depsFromEnv({
      supabaseUrl: process.env.VITE_SUPABASE_URL,
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
      siteUrl: process.env.URL,
    }),
  )

export const config = {
  path: '/mcp',
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip', 'domain'] },
}
