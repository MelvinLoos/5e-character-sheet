// @vitest-environment node

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Import the Netlify function handler directly. Dynamic import avoids Vite
// hoisting issues with the .mjs fixture.
const submitFeedbackUrl = new URL('../netlify/functions/submit-feedback.mjs', import.meta.url)

describe('submit-feedback Netlify function (Discord Forum channels)', () => {
  let handler: (req: Request) => Promise<Response>
  let fetchMock: ReturnType<typeof vi.fn>

  const CHANNEL_ID = '987654321098765432'
  const BOT_TOKEN = 'secret-bot-token'

  beforeEach(async () => {
    vi.resetModules()
    vi.stubEnv('DISCORD_BOT_TOKEN', BOT_TOKEN)
    vi.stubEnv('DISCORD_FEEDBACK_CHANNEL_ID', CHANNEL_ID)

    fetchMock = vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ id: '123456789012345678' }), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const mod = (await import(submitFeedbackUrl.href)) as {
      default: (req: Request) => Promise<Response>
    }
    handler = mod.default
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  function buildPostRequest(payload: Record<string, unknown>): Request {
    return new Request('https://example.com/.netlify/functions/submit-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }

  function samplePayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      type: 'bug',
      message: 'The goblin stat block is missing its scimitar attack.',
      context: {
        viewport: '1280x800',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
        route: '/spells?id=abc',
      },
      reporter: {
        discordId: '123456789012345678',
        discordUsername: 'Dungeon Master',
        userId: 'supabase-user-id',
      },
      ...overrides,
    }
  }

  function lastFetch(): { url: string; init: { headers: Record<string, string>; body: string } } {
    expect(fetchMock).toHaveBeenCalled()
    const call = fetchMock.mock.calls[fetchMock.mock.calls.length - 1] as unknown as [
      string,
      { headers: Record<string, string>; body: string },
    ]
    return { url: call[0], init: call[1] }
  }

  describe('forum thread endpoint', () => {
    it('POSTs to the forum /threads endpoint with the bot authorization header', async () => {
      await handler(buildPostRequest(samplePayload()))

      const { url, init } = lastFetch()
      expect(url).toBe(`https://discord.com/api/v10/channels/${CHANNEL_ID}/threads`)
      expect(init.headers.Authorization).toBe(`Bot ${BOT_TOKEN}`)
    })

    it('nests the embed inside the message object of the thread payload', async () => {
      await handler(buildPostRequest(samplePayload()))

      const { init } = lastFetch()
      const body = JSON.parse(init.body) as Record<string, unknown>

      expect(body.embeds).toBeUndefined()
      const message = body.message as { embeds: Record<string, unknown>[] }
      const embed = message?.embeds?.[0]
      expect(embed).toBeDefined()
      expect(embed.title).toBe('New Feedback')
      expect(embed.fields).toHaveLength(4)
      expect((embed.fields as { name: string }[]).map((f) => f.name)).toEqual([
        'Type',
        'Reporter',
        'Message',
        'Context',
      ])
    })
  })

  describe('thread name', () => {
    it('includes the feedback type and the reporter username', async () => {
      await handler(buildPostRequest(samplePayload({ type: 'bug' })))

      const { init } = lastFetch()
      const body = JSON.parse(init.body) as { name: string }
      expect(body.name).toBe('[Bug] Feedback from Dungeon Master')
    })

    it('falls back to an anonymous title when no reporter is present', async () => {
      await handler(
        buildPostRequest(
          samplePayload({
            type: 'feature',
            reporter: { discordId: null, discordUsername: null, userId: null },
          }),
        ),
      )

      const { init } = lastFetch()
      const body = JSON.parse(init.body) as { name: string }
      expect(body.name).toBe('[Feature] Feedback')
    })

    it('keeps the thread name within the 100 character Discord limit', async () => {
      const longUsername = 'A'.repeat(200)
      await handler(
        buildPostRequest(
          samplePayload({
            type: 'general',
            reporter: { discordId: null, discordUsername: longUsername, userId: null },
          }),
        ),
      )

      const { init } = lastFetch()
      const body = JSON.parse(init.body) as { name: string }
      expect(body.name.length).toBeLessThanOrEqual(100)
    })
  })

  describe('availability probe (regression)', () => {
    it('GET still returns { configured: true } when both env vars are set', async () => {
      const response = await handler(
        new Request('https://example.com/.netlify/functions/submit-feedback', { method: 'GET' }),
      )
      const body = (await response.json()) as { configured: boolean }

      expect(response.status).toBe(200)
      expect(body.configured).toBe(true)
    })

    it('POST still returns 503 SERVICE_UNCONFIGURED when env vars are missing', async () => {
      vi.stubEnv('DISCORD_BOT_TOKEN', '')
      vi.stubEnv('DISCORD_FEEDBACK_CHANNEL_ID', '')

      const response = await handler(buildPostRequest(samplePayload()))
      const body = (await response.json()) as { code: string }

      expect(response.status).toBe(503)
      expect(body.code).toBe('SERVICE_UNCONFIGURED')
    })
  })
})
