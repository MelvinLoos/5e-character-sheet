/**
 * Netlify Function: submit-feedback
 *
 * Receives in-app feedback from the client and forwards it to a private
 * Discord channel via webhook. The webhook URL is read exclusively from
 * `process.env.DISCORD_WEBHOOK_URL` on the server and is never exposed to
 * the client bundle.
 *
 * Deployed automatically via the [functions] block in netlify.toml.
 */
const VALID_TYPES = ['bug', 'feature', 'general']
const MAX_MESSAGE_LENGTH = 4000

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  })
}

export default async (req) => {
  // Handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  // Only allow POST requests.
  if (req.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405)
  }

  try {
    const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL

    if (!DISCORD_WEBHOOK_URL) {
      console.error('DISCORD_WEBHOOK_URL not configured on the server.')
      return json({ error: 'Feedback is not configured on the server.' }, 500)
    }

    const body = await req.json()
    const { type, message, context, reporter } = body ?? {}

    if (!VALID_TYPES.includes(type)) {
      return json({ error: 'Invalid feedback type.' }, 400)
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      return json({ error: 'Feedback message is required.' }, 400)
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return json({ error: 'Feedback message is too long.' }, 400)
    }

    const safeContext = context ?? {}
    const safeReporter = reporter ?? {}

    const viewport = typeof safeContext.viewport === 'string' ? safeContext.viewport : 'unknown'
    const userAgent = typeof safeContext.userAgent === 'string' ? safeContext.userAgent : 'unknown'
    const route = typeof safeContext.route === 'string' ? safeContext.route : 'unknown'

    const discordId = safeReporter.discordId ?? null
    const discordUsername = safeReporter.discordUsername ?? null
    const userId = safeReporter.userId ?? null

    const reporterLabel = discordUsername
      ? `${discordUsername}${discordId ? ` (id: ${discordId})` : ''}`
      : discordId
        ? `Discord user id: ${discordId}`
        : userId
          ? `Supabase user id: ${userId}`
          : 'Anonymous'

    const contextLabel = `Viewport: ${viewport}\nRoute: ${route}\nUser-Agent: ${userAgent.slice(0, 500)}`.slice(
      0,
      1800,
    )

    const webhookPayload = {
      username: 'In-App Feedback',
      embeds: [
        {
          title: 'New Feedback',
          color: 0x5865f2, // Discord blurple
          fields: [
            { name: 'Type', value: type, inline: true },
            { name: 'Reporter', value: reporterLabel.slice(0, 1024), inline: true },
            { name: 'Message', value: message.slice(0, 1024) },
            { name: 'Context', value: contextLabel.slice(0, 1024) },
          ],
        },
      ],
    }

    const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload),
    })

    if (!discordResponse.ok) {
      const errorBody = await discordResponse.text()
      console.error('Discord webhook error:', errorBody)
      return json({ error: 'Failed to deliver feedback to Discord.' }, 502)
    }

    return new Response(null, { status: 204, headers: corsHeaders() })
  } catch (error) {
    console.error('Error in submit-feedback function:', error)
    return json({ error: 'An unexpected error occurred.' }, 500)
  }
}