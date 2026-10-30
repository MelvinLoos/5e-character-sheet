import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick, reactive } from 'vue'
import DiscordUnlockReminderModal from '../src/components/modals/DiscordUnlockReminderModal.vue'
import { useAuthStore } from '../src/stores/authStore'
import { STORAGE_KEYS } from '../src/constants/storage-keys'

/**
 * Reactive route stub shared with the mocked vue-router. Assigned fresh in each
 * test so the component's route watcher can be driven by mutating `name`.
 */
let currentRoute: { name: string }

vi.mock('vue-router', () => ({
  useRoute: () => currentRoute,
}))

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

describe('DiscordUnlockReminderModal', () => {
  let wrapper: VueWrapper | undefined

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.body.innerHTML = ''
    currentRoute = reactive({ name: 'spells' })
  })

  afterEach(() => {
    // Unmount so the component's document-level keydown listener is removed
    // (otherwise stale instances patch into the next test's wiped DOM).
    wrapper?.unmount()
    wrapper = undefined
    document.body.innerHTML = ''
  })

  function mountModal() {
    wrapper = mount(DiscordUnlockReminderModal, { attachTo: document.body })
    return wrapper
  }

  function backdrop(): HTMLElement | null {
    return document.body.querySelector('[data-testid="modal-backdrop"]')
  }

  function byTest(test: string): HTMLElement | null {
    return document.body.querySelector(`[data-test="${test}"]`)
  }

  function bodyText(): string {
    return document.body.textContent ?? ''
  }

  function setToggle(checked: boolean): void {
    const toggle = byTest('discord-reminder-dont-show') as HTMLInputElement | null
    expect(toggle).not.toBeNull()
    toggle!.checked = checked
    toggle!.dispatchEvent(new Event('change'))
  }

  describe('visibility', () => {
    it('shows the reminder on the Spells view for a logged-out player', () => {
      mountModal()

      expect(backdrop()).not.toBeNull()
      expect(byTest('discord-reminder-login')).not.toBeNull()
    })

    it('shows the reminder on the Feats view for a logged-out player', () => {
      currentRoute.name = 'feats'

      mountModal()

      expect(backdrop()).not.toBeNull()
    })

    it('does not show on unrelated views', () => {
      currentRoute.name = 'identity'

      mountModal()

      expect(backdrop()).toBeNull()
    })

    it('does not show when the player is authenticated', () => {
      useAuthStore().status = 'authenticated'

      mountModal()

      expect(backdrop()).toBeNull()
    })

    it('does not show when the reminder was dismissed before', () => {
      localStorage.setItem(STORAGE_KEYS.DISCORD_UNLOCK_REMINDER_DISMISSED, 'true')

      mountModal()

      expect(backdrop()).toBeNull()
    })

    it('opens when the player navigates to the Spells view while logged out', async () => {
      currentRoute.name = 'identity'
      mountModal()
      expect(backdrop()).toBeNull()

      currentRoute.name = 'spells'
      await nextTick()

      expect(backdrop()).not.toBeNull()
    })
  })

  describe('content', () => {
    it('explains that logging in unlocks spells and feats', () => {
      mountModal()

      const text = bodyText().toLowerCase()
      expect(text).toContain('spells')
      expect(text).toContain('feats')
      expect(bodyText()).toContain('Login with Discord')
    })
  })

  describe('dismissal', () => {
    it('closes without persisting when the "don\'t show again" toggle is off', async () => {
      mountModal()

      setToggle(false)
      byTest('discord-reminder-dismiss')!.click()
      await nextTick()

      expect(backdrop()).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.DISCORD_UNLOCK_REMINDER_DISMISSED)).toBeNull()
    })

    it('persists the dismissal when the "don\'t show again" toggle is on', async () => {
      mountModal()

      setToggle(true)
      byTest('discord-reminder-dismiss')!.click()
      await nextTick()

      expect(backdrop()).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.DISCORD_UNLOCK_REMINDER_DISMISSED)).toBe('true')
    })

    it('stays hidden after a permanent dismissal when revisiting the view', async () => {
      mountModal()

      setToggle(true)
      byTest('discord-reminder-dismiss')!.click()
      await nextTick()

      currentRoute.name = 'identity'
      await nextTick()
      currentRoute.name = 'spells'
      await nextTick()

      expect(backdrop()).toBeNull()
    })

    it('closes on backdrop click', async () => {
      mountModal()

      backdrop()!.click()
      await nextTick()

      expect(backdrop()).toBeNull()
    })

    it('closes on Escape', async () => {
      mountModal()

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await nextTick()

      expect(backdrop()).toBeNull()
    })
  })

  describe('login', () => {
    it('starts the Discord sign-in flow and closes the reminder', async () => {
      const authStore = useAuthStore()
      const signIn = vi.fn()
      authStore.signInWithDiscord = signIn

      mountModal()
      byTest('discord-reminder-login')!.click()
      await nextTick()

      expect(signIn).toHaveBeenCalledTimes(1)
      expect(backdrop()).toBeNull()
    })
  })
})
