import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { checkFeedbackAvailability } from '../infra/feedbackService'
import { logger } from '../utils/logger'

export type FeedbackAvailability = 'unknown' | 'available' | 'unavailable'

export const useFeedbackStore = defineStore('feedback', () => {
  // State
  const availability = ref<FeedbackAvailability>('unknown')

  // Getters
  const isFeedbackAvailable = computed(() => availability.value === 'available')

  // Actions
  async function checkAvailability() {
    try {
      const result = await checkFeedbackAvailability()

      if (result.configured) {
        availability.value = 'available'
        return
      }

      availability.value = 'unavailable'
      logger.error(
        '[Feedback] Feedback form is disabled: feedback service is unconfigured ' +
          '(missing DISCORD_BOT_TOKEN or DISCORD_FEEDBACK_CHANNEL_ID on the server).',
      )
    } catch (error) {
      availability.value = 'unavailable'
      logger.error(
        '[Feedback] Feedback form is disabled: could not reach the feedback service.',
        error,
      )
    }
  }

  function markUnavailable() {
    availability.value = 'unavailable'
    logger.error(
      '[Feedback] Feedback form is disabled: feedback service returned SERVICE_UNCONFIGURED.',
    )
  }

  return {
    // State
    availability,
    // Getters
    isFeedbackAvailable,
    // Actions
    checkAvailability,
    markUnavailable,
  }
})