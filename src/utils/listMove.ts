/**
 * Return a copy of `list` with the item at `from` moved to `to` (clamped to the list).
 * Used as the keyboard / single-pointer alternative to drag-and-drop reordering.
 */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list]
  if (from < 0 || from >= next.length) return next
  const target = Math.max(0, Math.min(next.length - 1, to))
  if (target === from) return next
  const [item] = next.splice(from, 1)
  next.splice(target, 0, item as T)
  return next
}
