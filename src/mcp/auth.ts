/** Static single-user Bearer auth for the MCP endpoint. */
export interface McpAuthEnv {
  MCP_SECRET_TOKEN?: string
  MCP_OWNER_USER_ID?: string
}

export interface McpAuthSuccess {
  ok: true
  userId: string
}

export interface McpAuthFailure {
  ok: false
  status: number
  error: string
}

export type McpAuthResult = McpAuthSuccess | McpAuthFailure

function constantTimeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder()
  const bytesA = encoder.encode(a)
  const bytesB = encoder.encode(b)

  if (bytesA.length !== bytesB.length) {
    return false
  }

  let diff = 0
  for (let i = 0; i < bytesA.length; i++) {
    diff |= bytesA[i]! ^ bytesB[i]!
  }

  return diff === 0
}

export function verifyMcpBearerToken(authHeader: string | null, expectedToken: string): boolean {
  if (!authHeader || !expectedToken) {
    return false
  }

  const trimmed = authHeader.trim()
  const prefix = 'Bearer '

  if (!trimmed.startsWith(prefix)) {
    return false
  }

  const providedToken = trimmed.slice(prefix.length).trim()
  if (!providedToken) {
    return false
  }

  return constantTimeEqual(providedToken, expectedToken)
}

export function authenticateMcpRequest(request: Request, env: McpAuthEnv): McpAuthResult {
  try {
    const expectedToken = env.MCP_SECRET_TOKEN?.trim()
    const ownerUserId = env.MCP_OWNER_USER_ID?.trim()

    if (!expectedToken || !ownerUserId) {
      return {
        ok: false,
        status: 500,
        error: 'MCP server auth is not configured. Set MCP_SECRET_TOKEN and MCP_OWNER_USER_ID.',
      }
    }

    const authHeader = request.headers.get('authorization')
    const isValid = verifyMcpBearerToken(authHeader, expectedToken)

    if (!isValid) {
      return {
        ok: false,
        status: 401,
        error: 'Unauthorized: invalid or missing MCP Bearer token.',
      }
    }

    return {
      ok: true,
      userId: ownerUserId,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown authentication error'
    return {
      ok: false,
      status: 500,
      error: `Authentication check failed: ${message}`,
    }
  }
}
