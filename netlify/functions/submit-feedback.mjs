/**
 * Netlify Function: submit-feedback
 *
 * Receives in-app feedback from the client and posts it as a new thread in a
 * community Discord Forum channel via the Discord Bot REST API. The bot token
 * and target channel ID are read exclusively from `process.env` on the server
 * and are never exposed to the client bundle.
 *
 * Deployed automatically via the [functions] block in netlify.toml.
 */
const VALID_TYPES = ['bug', 'feature', 'general']
const MAX_MESSAGE_LENGTH = 4000
const MAX_THREAD_NAME_LENGTH = 100
const MAX_LOG_LENGTH = 1500
const DISCORD_API_BASE = 'https://discord.com/api/v10'

/**
 * Removes known secrets (e.g. the Discord bot token) from text before it is
 * written to the server logs, then truncates the result so a verbose API
 * response cannot flood the logs. Callers decide which secrets apply.
 */
function redactSecrets(text, secrets) {
  let safe = String(text ?? '')
  for (const secret of secrets.filter(Boolean)) {
    safe = safe.split(secret).join('[REDACTED]')
  }
  return safe.slice(0, MAX_LOG_LENGTH)
}

/**
 * Discord forum thread names are limited to 100 characters.
 */
function buildThreadName(type, discordUsername) {
  const typeLabel = VALID_TYPES.includes(type) ? `[${type[0].toUpperCase()}${type.slice(1)}]` : '[General]'

  const baseName = discordUsername
    ? `${typeLabel} Feedback from ${discordUsername}`
    : `${typeLabel} Feedback`

  return baseName.slice(0, MAX_THREAD_NAME_LENGTH)
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
  // Handle CORS preflight requests before anything else so the browser can
  // always read the response body (including 503 SERVICE_UNCONFIGURED).
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  // Availability probe: lets the client decide whether to render the
  // feedback UI. Reveals only a boolean — never the token.
  if (req.method === 'GET') {
    const configured = Boolean(
      process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_FEEDBACK_CHANNEL_ID,
    )
    return json(
      { configured, code: configured ? null : 'SERVICE_UNCONFIGURED' },
      200,
    )
  }

  // Only allow POST requests.
  if (req.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405)
  }

  // Hoisted so both the error branch and the catch can redact the token
  // from anything that ends up in the logs.
  const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
  const DISCORD_FEEDBACK_CHANNEL_ID = process.env.DISCORD_FEEDBACK_CHANNEL_ID

  try {
    if (!DISCORD_BOT_TOKEN || !DISCORD_FEEDBACK_CHANNEL_ID) {
      console.error('Discord bot integration is not configured on the server.')
      return json(
        { error: 'Feedback service is unconfigured', code: 'SERVICE_UNCONFIGURED' },
        503,
      )
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

    // Discord "Start Thread in Forum Channel" payload: the embed is nested
    // inside the `message` object and the thread gets a dynamic title.
    const threadName = buildThreadName(type, discordUsername)

    const discordPayload = {
      name: threadName,
      message: {
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
      },
    }

    const discordResponse = await fetch(
      `${DISCORD_API_BASE}/channels/${DISCORD_FEEDBACK_CHANNEL_ID}/threads`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(discordPayload),
      },
    )

    if (!discordResponse.ok) {
      const errorBody = await discordResponse.text()
      console.error(
        'Discord API error:',
        discordResponse.status,
        redactSecrets(errorBody, [DISCORD_BOT_TOKEN]),
      )
      return json({ error: 'Failed to deliver feedback to Discord.' }, 502)
    }

    return new Response(null, { status: 204, headers: corsHeaders() })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(
      'Error in submit-feedback function:',
      redactSecrets(message, [DISCORD_BOT_TOKEN]),
    )
    return json({ error: 'An unexpected error occurred.' }, 500)
  }
}
