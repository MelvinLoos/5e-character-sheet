// OAuth protected-resource metadata (RFC 9728) so MCP clients can find the Supabase OAuth server.
import { handleMetadataRequest, depsFromEnv } from '../../dist-mcp/handler.mjs'

export default async (req: Request): Promise<Response> =>
  handleMetadataRequest(
    req,
    depsFromEnv({
      supabaseUrl: process.env.VITE_SUPABASE_URL,
      supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
    }),
  )

export const config = {
  path: ['/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp'],
}
