/**
 * Module-level storage for the Service Worker update callback.
 *
 * Previously this was exposed as `window.__swUpdate`, which made it trivially
 * inspectable from the browser console. This module keeps the callback in a
 * closure so it is not discoverable on the global scope.
 */

let _updateCallback: (() => Promise<void>) | null = null

/** Set the update callback. Called once during SW registration in main.ts. */
export function setSwUpdateCallback(fn: () => Promise<void>): void {
  _updateCallback = fn
}

/** Get the update callback for triggering an SW update from the notification component. */
export function getSwUpdateCallback(): (() => Promise<void>) | null {
  return _updateCallback
}