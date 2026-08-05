import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import AuthButton from '../src/components/AuthButton.vue'
import { useAuthStore } from '../src/stores/authStore'

vi.mock('../src/infra/supabaseClient', () => ({
  createSupabaseClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      setSession: vi.fn(),
    },
  })),
}))

describe('AuthButton', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders Login with Discord button when logged out', () => {
    const wrapper = mount(AuthButton)

    expect(wrapper.text()).toContain('Login with Discord')
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('renders user avatar and username when authenticated', async () => {
    const authStore = useAuthStore()
    authStore.status = 'authenticated'
    authStore.discordUsername = 'Dungeon Master'
    authStore.discordAvatarUrl = 'https://cdn.discordapp.com/avatars/456/def.png'

    const wrapper = mount(AuthButton)
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Dungeon Master')
    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.find('img').attributes('src')).toBe('https://cdn.discordapp.com/avatars/456/def.png')
  })

  it('shows loading state when auth is loading', () => {
    const authStore = useAuthStore()
    authStore.status = 'loading'

    const wrapper = mount(AuthButton)

    expect(wrapper.text()).not.toContain('Login with Discord')
    expect(wrapper.find('[data-testid="auth-loading"]').exists()).toBe(true)
  })

  it('calls signInWithDiscord when login button is clicked', async () => {
    const authStore = useAuthStore()
    authStore.signInWithDiscord = vi.fn()

    const wrapper = mount(AuthButton)
    await wrapper.find('button').trigger('click')

    expect(authStore.signInWithDiscord).toHaveBeenCalled()
  })

  it('calls signOut when logout button is clicked', async () => {
    const authStore = useAuthStore()
    authStore.status = 'authenticated'
    authStore.discordUsername = 'Test User'
    authStore.signOut = vi.fn()

    const wrapper = mount(AuthButton)
    await wrapper.find('button').trigger('click')

    expect(authStore.signOut).toHaveBeenCalled()
  })
})
