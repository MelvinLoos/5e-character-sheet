/**
 * shareUrl — Helpers for the public character share link.
 *
 * The share link is the same URL produced when a character is saved to the
 * archives: the current origin/path with the archived row id as the `id` query
 * parameter. Keeping the construction in one place means the copied link and
 * the QR code printed on the sheet always point at the same location.
 */

/**
 * Build the public share URL for an archived character id.
 * Returns an empty string when no id is provided.
 */
export function buildShareUrl(characterId: string | null | undefined): string {
  if (!characterId) return ''
  const { origin, pathname } = window.location
  return `${origin}${pathname}?id=${characterId}`
}
