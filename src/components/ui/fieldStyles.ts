/** Shared control styling for TextField / NumberField (44px touch height, visible focus). */
export const fieldInputClass =
  'w-full min-h-11 rounded border bg-surface-container-high px-3 py-2 text-on-surface font-body-md text-body-md ' +
  'placeholder:text-outline focus:outline-none focus-visible:ring-2 focus-visible:ring-tertiary ' +
  'disabled:opacity-50 disabled:cursor-not-allowed'

export function fieldBorderClass(invalid: boolean): string {
  return invalid ? 'border-error' : 'border-outline-variant focus:border-tertiary'
}
