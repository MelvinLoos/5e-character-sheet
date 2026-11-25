import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../src/stores/authStore'
import OAuthConsent from '../src/views/OAuthConsent.vue'

const oauth = {
  getAuthorizationDetails: vi.fn(),
  approveAuthorization: vi.fn(),
  denyAuthorization: vi.fn(),
}
const client = { auth: { oauth } }

vi.mock('../src/infra/sharingService', () => ({ getSupabaseClient: () => client }))
vi.mock('vue-router', () => ({ useRoute: () => ({ query: { authorization_id: 'auth-1' } }) }))

const details = {
  authorization_id: 'auth-1',
  client: { name: 'Claude' },
  redirect_uri: 'https://claude.ai/cb',
  scope: 'openid email',
}

describe('OAuthConsent', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    useAuthStore().status = 'authenticated'
  })

  it('asks signed-out players to sign in first', async () => {
    useAuthStore().status = 'loggedOut'
    const w = mount(OAuthConsent)
    await flushPromises()
    expect(w.text()).toContain('Sign in with Discord')
    expect(oauth.getAuthorizationDetails).not.toHaveBeenCalled()
  })

  it('shows the client and approves the request', async () => {
    oauth.getAuthorizationDetails.mockResolvedValue({ data: details, error: null })
    oauth.approveAuthorization.mockResolvedValue({
      data: { redirect_url: 'https://claude.ai/cb?code=1' },
      error: null,
    })
    const hrefs: string[] = []
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://sheet.test',
        href: 'https://sheet.test/oauth/consent',
        set href(v: string) {
          hrefs.push(v)
        },
      },
      configurable: true,
    })
    const w = mount(OAuthConsent)
    await flushPromises()
    expect(w.text()).toContain('Claude')
    expect(w.text()).toContain('Confirm who you are')
    await w
      .findAll('button')
      .find((b) => b.text() === 'Approve')!
      .trigger('click')
    await flushPromises()
    expect(oauth.approveAuthorization).toHaveBeenCalledWith('auth-1')
  })

  it('denies the request', async () => {
    oauth.getAuthorizationDetails.mockResolvedValue({ data: details, error: null })
    oauth.denyAuthorization.mockResolvedValue({
      data: { redirect_url: 'https://claude.ai/cb?error=access_denied' },
      error: null,
    })
    const w = mount(OAuthConsent)
    await flushPromises()
    await w
      .findAll('button')
      .find((b) => b.text() === 'Deny')!
      .trigger('click')
    await flushPromises()
    expect(oauth.denyAuthorization).toHaveBeenCalledWith('auth-1')
  })

  it('shows an error for an invalid request', async () => {
    oauth.getAuthorizationDetails.mockResolvedValue({ data: null, error: { message: 'expired' } })
    const w = mount(OAuthConsent)
    await flushPromises()
    expect(w.text()).toContain('expired')
  })
})
