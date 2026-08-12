import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFeedbackStore } from '../src/stores/feedbackStore'
import { checkFeedbackAvailability } from '../src/infra/feedbackService'
import { logger } from '../src/utils/logger'

vi.mock('../src/infra/feedbackService', () => ({
  checkFeedbackAvailability: vi.fn(),
}))

const mockedCheck = vi.mocked(checkFeedbackAvailability)

describe('feedbackStore', () => {
  let store: ReturnType<typeof useFeedbackStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    store = useFeedbackStore()
  })

  describe('checkAvailability', () => {
    it('sets availability to available when the service is configured', async () => {
      mockedCheck.mockResolvedValue({ configured: true, code: null })

      await store.checkAvailability()

      expect(store.availability).toBe('available')
      expect(store.isFeedbackAvailable).toBe(true)
    })

    it('sets availability to unavailable and logs a console error when SERVICE_UNCONFIGURED', async () => {
      const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
      mockedCheck.mockResolvedValue({ configured: false, code: 'SERVICE_UNCONFIGURED' })

      await store.checkAvailability()

      expect(store.availability).toBe('unavailable')
      expect(store.isFeedbackAvailable).toBe(false)
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('unconfigured'))
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('DISCORD_BOT_TOKEN or DISCORD_FEEDBACK_CHANNEL_ID'),
      )
      errorSpy.mockRestore()
    })

    it('sets availability to unavailable when the availability probe fails', async () => {
      const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
      mockedCheck.mockRejectedValue(new Error('network down'))

      await store.checkAvailability()

      expect(store.availability).toBe('unavailable')
      expect(store.isFeedbackAvailable).toBe(false)
      expect(errorSpy).toHaveBeenCalledTimes(1)
      errorSpy.mockRestore()
    })
  })

  describe('markUnavailable', () => {
    it('marks the service unavailable and logs a dev-facing console error', () => {
      const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
      store.availability = 'available'

      store.markUnavailable()

      expect(store.availability).toBe('unavailable')
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Feedback form is disabled'))
      errorSpy.mockRestore()
    })
  })
})
