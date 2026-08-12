import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import FeedbackModal from '../src/components/modals/FeedbackModal.vue'
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

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ fullPath: '/spells?id=abc' })),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

describe('FeedbackModal', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    fetchMock = vi.fn(() => Promise.resolve({ ok: true, status: 204 }))
    global.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  function mountOpen() {
    return mount(FeedbackModal, {
      props: { isOpen: true },
      attachTo: document.body,
    })
  }

  function bodyText(): string {
    return document.body.textContent ?? ''
  }

  function findButton(label: string): HTMLButtonElement {
    const button = Array.from(document.body.querySelectorAll('button')).find((b) =>
      b.textContent?.includes(label),
    )
    expect(button).toBeDefined()
    return button as HTMLButtonElement
  }

  function getTextarea(): HTMLTextAreaElement {
    const textarea = document.body.querySelector('textarea')
    expect(textarea).not.toBeNull()
    return textarea as HTMLTextAreaElement
  }

  function setTextarea(value: string): void {
    const textarea = getTextarea()
    textarea.value = value
    textarea.dispatchEvent(new Event('input'))
  }

  async function flushPromises(): Promise<void> {
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await nextTick()
  }

  function submittedPayload(): Record<string, any> {
    expect(fetchMock).toHaveBeenCalled()
    const [url, init] = fetchMock.mock.calls[0] as [string, { method: string; body: string }]
    expect(url).toBe('/.netlify/functions/submit-feedback')
    expect(init.method).toBe('POST')
    return JSON.parse(init.body)
  }

  describe('rendering', () => {
    it('renders the feedback form when isOpen is true', () => {
      mountOpen()

      const text = bodyText()
      expect(text).toContain('Give Feedback')
      expect(text).toContain('Bug')
      expect(text).toContain('Feature')
      expect(text).toContain('General')
      expect(text).toContain('Submit Feedback')
      expect(document.body.querySelector('textarea')).not.toBeNull()
    })

    it('does not render when isOpen is false', () => {
      mount(FeedbackModal, {
        props: { isOpen: false },
        attachTo: document.body,
      })

      expect(bodyText()).not.toContain('Give Feedback')
    })

    it('emits close when the Cancel button is clicked', async () => {
      const wrapper = mountOpen()

      findButton('Cancel').click()
      await nextTick()

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('emits close when the backdrop is clicked', async () => {
      const wrapper = mountOpen()

      const backdrop = document.body.querySelector('.modal-backdrop')
      expect(backdrop).not.toBeNull()
      ;(backdrop as HTMLElement).click()
      await nextTick()

      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('validation', () => {
    it('disables the submit button when the message is empty', async () => {
      mountOpen()

      expect(findButton('Submit Feedback').disabled).toBe(true)
    })

    it('enables the submit button once a message is entered', async () => {
      mountOpen()

      setTextarea('The spell list is missing Fireball.')
      await nextTick()

      expect(findButton('Submit Feedback').disabled).toBe(false)
    })
  })

  describe('submission', () => {
    it('submits the feedback with type, message, environment context and reporter to the edge function', async () => {
      const authStore = useAuthStore()
      authStore.discordUsername = 'Dungeon Master'
      authStore.discordAvatarUrl = 'https://cdn.discordapp.com/avatars/123456789012345678/a_abc123.png'

      mountOpen()

      findButton('Bug').click()
      await nextTick()
      setTextarea('The spell list is missing Fireball.')
      await nextTick()
      findButton('Submit Feedback').click()
      await flushPromises()

      const payload = submittedPayload()
      expect(payload.type).toBe('bug')
      expect(payload.message).toBe('The spell list is missing Fireball.')
      expect(payload.context.viewport).toBe(`${window.innerWidth}x${window.innerHeight}`)
      expect(payload.context.userAgent).toBe(navigator.userAgent)
      expect(payload.context.route).toBe('/spells?id=abc')
      expect(payload.reporter.discordUsername).toBe('Dungeon Master')
      expect(payload.reporter.discordId).toBe('123456789012345678')
    })

    it('defaults the feedback type to general when none is selected', async () => {
      mountOpen()

      setTextarea('Just a thought.')
      await nextTick()
      findButton('Submit Feedback').click()
      await flushPromises()

      const payload = submittedPayload()
      expect(payload.type).toBe('general')
    })

    it('falls back to null reporter fields when the user is not signed in or has no avatar', async () => {
      mountOpen()

      setTextarea('Anonymous feedback.')
      await nextTick()
      findButton('Submit Feedback').click()
      await flushPromises()

      const payload = submittedPayload()
      expect(payload.reporter.discordId).toBeNull()
      expect(payload.reporter.discordUsername).toBeNull()
    })

    it('shows a loading state while the submission is in flight', async () => {
      let resolveFetch: ((value: unknown) => void) | undefined
      fetchMock = vi.fn(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve
          }),
      )
      global.fetch = fetchMock as unknown as typeof fetch

      mountOpen()

      setTextarea('Hello!')
      await nextTick()
      findButton('Submit Feedback').click()
      await nextTick()

      expect(bodyText()).toContain('Sending')
      expect(findButton('Sending').disabled).toBe(true)
      expect(fetchMock).toHaveBeenCalledTimes(1)

      resolveFetch?.({ ok: true, status: 204 })
      await flushPromises()
    })

    it('shows a success message after a successful submission', async () => {
      mountOpen()

      setTextarea('Great app!')
      await nextTick()
      findButton('Submit Feedback').click()
      await flushPromises()

      expect(bodyText()).toContain('Thanks for your feedback!')
    })

    it('shows an error message when the submission fails and allows retrying', async () => {
      fetchMock = vi.fn(() => Promise.reject(new Error('network down')))
      global.fetch = fetchMock as unknown as typeof fetch

      mountOpen()

      setTextarea('Something to report.')
      await nextTick()
      findButton('Submit Feedback').click()
      await flushPromises()

      expect(bodyText()).toContain("We couldn't send your feedback")

      fetchMock = vi.fn(() => Promise.resolve({ ok: true, status: 204 }))
      global.fetch = fetchMock as unknown as typeof fetch

      findButton('Submit Feedback').click()
      await flushPromises()

      expect(bodyText()).toContain('Thanks for your feedback!')
    })
  })
})