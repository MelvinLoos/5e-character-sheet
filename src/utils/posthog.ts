// Centralized PostHog analytics wrapper.
//
// All analytics access routes through this module so the "should we track"
// decision lives in exactly one place. Tests and other opt-out environments
// disable tracking by setting VITE_POSTHOG_DISABLED=true, and unconfigured
// environments degrade to a dev-only warning instead of throwing.

import posthog from 'posthog-js'
import { logger } from './logger'

const isDisabled = import.meta.env.VITE_POSTHOG_DISABLED === 'true'
const projectToken = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN
const host = import.meta.env.VITE_POSTHOG_HOST

/** Whether PostHog should capture events in this environment. */
export const isPostHogEnabled = !isDisabled && Boolean(projectToken && host)

let initialized = false

/**
 * Initialize PostHog once. No-ops when analytics is disabled; warns in
 * development (without throwing) when the required variables are missing.
 */
export function initPostHog(): void {
  if (initialized) return
  initialized = true

  if (!isPostHogEnabled) {
    if (import.meta.env.DEV && !isDisabled) {
      const missingVariable = projectToken ? 'VITE_POSTHOG_HOST' : 'VITE_POSTHOG_PROJECT_TOKEN'
      logger.warn(
        `PostHog is not initialized: ${missingVariable} is missing. ` +
          'Analytics events will be silently skipped until it is configured.',
      )
    }
    return
  }

  if (!projectToken || !host) return

  posthog.init(projectToken, {
    api_host: host,
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
  })
}

export function capturePostHogEvent(
  eventName: string,
  properties?: Record<string, unknown>,
): void {
  if (!isPostHogEnabled) return
  posthog.capture(eventName, properties)
}

export function capturePostHogException(error: unknown): void {
  if (!isPostHogEnabled) return
  posthog.captureException(error)
}

let identifiedUserId: string | null = null

export function identifyPostHogUser(
  userId: string,
  properties?: Record<string, unknown>,
): void {
  if (!isPostHogEnabled || identifiedUserId === userId) return
  if (identifiedUserId) posthog.reset()
  posthog.identify(userId, properties)
  identifiedUserId = userId
}

export function resetPostHogUser(): void {
  if (isPostHogEnabled && identifiedUserId) {
    posthog.reset()
  }
  identifiedUserId = null
}
