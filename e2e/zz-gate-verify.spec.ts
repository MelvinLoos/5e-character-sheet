import { test, expect } from '@playwright/test'

/**
 * TEMPORARY verification spec (issue #253) — intentionally fails.
 *
 * Proves the CI E2E gate now fails the job for a failure nested inside a
 * `test.describe` block (the exact case the old gate silently ignored).
 * This file is removed before the PR is merged.
 */
test.describe('temporary gate verification', () => {
  test('nested test deliberately fails', async () => {
    expect(1).toBe(2)
  })
})
