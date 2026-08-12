/**
 * Feedback submission API client.
 *
 * Sends feedback payloads to the `submit-feedback` Netlify Function. The
 * function posts to Discord via the Discord Bot REST API; the bot token is
 * never exposed to the client bundle.
 */

export type FeedbackType = 'bug' | 'feature' | 'general'

export interface FeedbackContext {
  viewport: string
  userAgent: string
  route: string
}

export interface FeedbackReporter {
  discordId: string | null
  discordUsername: string | null
  userId: string | null
}

export interface FeedbackPayload {
  type: FeedbackType
  message: string
  context: FeedbackContext
  reporter: FeedbackReporter
}

export interface FeedbackAvailability {
  configured: boolean
  code: string | null
}

/**
 * Probes the feedback service configuration via the Netlify Function's GET
 * endpoint. Used to decide whether to render the feedback UI at all.
 */
export async function checkFeedbackAvailability(): Promise<FeedbackAvailability> {
  const response = await fetch('/.netlify/functions/submit-feedback')

  if (!response.ok) {
    throw new Error(`Feedback availability check failed with status: ${response.status}`)
  }

  const body = (await response.json()) as { configured?: boolean; code?: string | null }

  return {
    configured: body.configured === true,
    code: body.code ?? null,
  }
}

/**
 * Error thrown by {@link submitFeedback} when the request fails. Carries the
 * optional machine-readable `code` returned by the Netlify Function
 * (e.g. `SERVICE_UNCONFIGURED`), so the UI can render distinct states.
 */
export class FeedbackServiceError extends Error {
  code: string | null

  constructor(message: string, code: string | null = null) {
    super(message)
    this.name = 'FeedbackServiceError'
    this.code = code
  }
}

export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  const response = await fetch('/.netlify/functions/submit-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string
      code?: string
    } | null

    throw new FeedbackServiceError(
      body?.error ?? `Feedback submission failed with status: ${response.status}`,
      body?.code ?? null,
    )
  }
}

/**
 * Extracts the Discord snowflake ID from a Discord CDN avatar URL of the
 * form: https://cdn.discordapp.com/avatars/<discordId>/<avatarHash>.<ext>
 *
 * Fails gracefully: returns `null` when the URL is malformed, the user has no
 * avatar, or Discord ever changes the URL format.
 */
export function extractDiscordIdFromAvatarUrl(avatarUrl: string | null): string | null {
  if (!avatarUrl) {
    return null
  }

  const match = avatarUrl.match(/\/avatars\/(\d{15,22})\//)
  return match?.[1] ?? null
}