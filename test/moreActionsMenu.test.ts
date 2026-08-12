import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent } from 'vue'
import MoreActionsMenu from '../src/components/MoreActionsMenu.vue'
import { useAuthStore } from '../src/stores/authStore'
import { useGuildStore } from '../src/stores/guildStore'
import { useFeedbackStore } from '../src/stores/feedbackStore'

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

// Stub GuildSelector to avoid onMounted side-effects (API calls)
vi.mock('../src/components/GuildSelector.vue', () => ({
  default: defineComponent({
    name: 'GuildSelector',
    template: '<div class="guild-selector-mock">GuildSelector Mock</div>',
  }),
}))

// Stub GuildManagementModal to avoid complex modal rendering in tests
vi.mock('../src/components/modals/GuildManagementModal.vue', () => ({
  default: defineComponent({
    name: 'GuildManagementModal',
    props: { isOpen: Boolean },
    emits: ['close'],
    template: '<div v-if="isOpen" class="guild-management-modal-mock">GuildManagementModal Mock</div>',
  }),
}))

// Mock idb-keyval used by guildStore
vi.mock('idb-keyval', () => ({
  get: vi.fn(() => Promise.resolve()),
  set: vi.fn(() => Promise.resolve()),
  del: vi.fn(() => Promise.resolve()),
}))

// Mock fetch for guildStore API calls
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  }),
) as unknown as typeof fetch

// Mock getSupabaseClient to return null (graceful degradation)
vi.mock('../src/infra/sharingService', () => ({
  getSupabaseClient: vi.fn(() => null),
  loadCharacterFromSupabase: vi.fn(),
  saveCharacterToSupabase: vi.fn(),
  updateCharacterNameInSupabase: vi.fn(),
  deleteCharacterFromSupabase: vi.fn(),
  listUserCharacters: vi.fn(),
}))

describe('MoreActionsMenu', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  function mountOpen() {
    return mount(MoreActionsMenu, {
      props: { modelValue: true },
      attachTo: document.body,
      global: {
        stubs: {
          AuthButton: false,
        },
      },
    })
  }

  function bodyHtml(): string {
    return document.body.innerHTML
  }

  function bodyText(): string {
    return document.body.textContent ?? ''
  }

  describe('Discord Auth integration', () => {
    it('renders AuthButton in the mobile menu', () => {
      mountOpen()
      expect(bodyText()).toContain('Login with Discord')
    })

    it('renders AuthButton with user info when authenticated', async () => {
      const authStore = useAuthStore()
      authStore.status = 'authenticated'
      authStore.discordUsername = 'Dungeon Master'

      mountOpen()
      await new Promise((r) => setTimeout(r, 10))

      expect(bodyText()).toContain('Dungeon Master')
    })
  })

  describe('Guild Selector integration', () => {
    it('renders GuildSelector component in the mobile menu', () => {
      mountOpen()
      expect(bodyText()).toContain('GuildSelector Mock')
    })

    it('renders GuildSelector before AuthButton in DOM order', () => {
      mountOpen()

      const html = bodyHtml()
      const guildSelectorIndex = html.indexOf('GuildSelector Mock')
      const authButtonIndex = html.indexOf('Login with Discord')

      expect(guildSelectorIndex).toBeGreaterThanOrEqual(0)
      expect(authButtonIndex).toBeGreaterThan(guildSelectorIndex)
    })
  })

  describe('Feedback entry point availability', () => {
    it('renders the Give Feedback tile when the feedback service is available', () => {
      const feedbackStore = useFeedbackStore()
      feedbackStore.availability = 'available'

      mountOpen()
      expect(bodyText()).toContain('Give Feedback')
    })

    it('hides the Give Feedback tile when the feedback service is unavailable', () => {
      const feedbackStore = useFeedbackStore()
      feedbackStore.availability = 'unavailable'

      mountOpen()
      expect(bodyText()).not.toContain('Give Feedback')
    })

    it('hides the Give Feedback tile while availability is unknown', () => {
      const feedbackStore = useFeedbackStore()
      feedbackStore.availability = 'unknown'

      mountOpen()
      expect(bodyText()).not.toContain('Give Feedback')
    })
  })

  describe('Guild Management modal trigger', () => {
    it('renders "Manage Server Homebrew" button when user is admin', () => {
      const authStore = useAuthStore()
      authStore.status = 'authenticated'

      const guildStore = useGuildStore()
      guildStore.$patch({
        guilds: [
          { id: 'guild-admin', name: 'Admin Guild', icon: null, owner: false, permissions: '8', features: [] },
        ],
        activeGuildId: 'guild-admin',
        isLoading: false,
      })

      mountOpen()
      expect(bodyText()).toContain('Manage Server Homebrew')
    })

    it('does not render "Manage Server Homebrew" button when user is not admin', () => {
      const guildStore = useGuildStore()
      guildStore.$patch({
        guilds: [
          { id: 'guild-reg', name: 'Normal Guild', icon: null, owner: false, permissions: '0', features: [] },
        ],
        activeGuildId: 'guild-reg',
        isLoading: false,
      })

      mountOpen()
      expect(bodyText()).not.toContain('Manage Server Homebrew')
    })
  })
})