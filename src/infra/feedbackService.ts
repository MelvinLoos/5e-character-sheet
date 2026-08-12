/**
 * Feedback submission API client.
 *
 * Sends feedback payloads to the `submit-feedback` Netlify Function. The
 * function is responsible for the actual Discord Webhook POST; the webhook
 * URL is never exposed to the client bundle.
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

export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  const response = await fetch('/.netlify/functions/submit-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Feedback submission failed with status: ${response.status}`)
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