/**
 * useDialogBehavior — accessibility behaviour shared by every modal dialog.
 *
 * While `open` is true it:
 * - moves focus into the dialog (preferring `[data-autofocus]`) and restores it on close
 * - traps Tab / Shift+Tab inside the dialog panel
 * - closes on Escape (only the topmost dialog reacts when several are stacked)
 * - locks body scroll (reference counted, so stacked dialogs unlock exactly once)
 */
import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/** Open dialogs, topmost last. */
const dialogStack: symbol[] = []
let scrollLocks = 0
let previousOverflow = ''

function lockScroll(): void {
  if (scrollLocks++ === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
}

function unlockScroll(): void {
  if (scrollLocks > 0 && --scrollLocks === 0) {
    document.body.style.overflow = previousOverflow
  }
}

function focusableIn(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true',
  )
}

export interface DialogBehaviorOptions {
  open: Ref<boolean>
  panel: Ref<HTMLElement | null>
  onClose: () => void
  closeOnEscape?: Ref<boolean>
}

export function useDialogBehavior({ open, panel, onClose, closeOnEscape }: DialogBehaviorOptions) {
  const id = Symbol('dialog')
  let returnFocusTo: HTMLElement | null = null
  let active = false

  function onKeydown(event: KeyboardEvent): void {
    if (dialogStack[dialogStack.length - 1] !== id) return
    const el = panel.value
    if (!el) return

    if (event.key === 'Escape') {
      if (closeOnEscape?.value === false) return
      event.stopPropagation()
      onClose()
      return
    }

    if (event.key !== 'Tab') return
    const items = focusableIn(el)
    if (items.length === 0) {
      event.preventDefault()
      el.focus()
      return
    }
    const first = items[0]!
    const last = items[items.length - 1]!
    const current = document.activeElement
    if (event.shiftKey && (current === first || current === el)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && current === last) {
      event.preventDefault()
      first.focus()
    } else if (!el.contains(current)) {
      event.preventDefault()
      first.focus()
    }
  }

  function activate(): void {
    if (active) return
    active = true
    returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialogStack.push(id)
    lockScroll()
    document.addEventListener('keydown', onKeydown)
    void nextTick(() => {
      const el = panel.value
      if (!el) return
      const target =
        el.querySelector<HTMLElement>('[data-autofocus]') ??
        focusableIn(el).find((node) => !node.hasAttribute('data-modal-close')) ??
        focusableIn(el)[0] ??
        el
      target.focus()
    })
  }

  function deactivate(): void {
    if (!active) return
    active = false
    const index = dialogStack.indexOf(id)
    if (index !== -1) dialogStack.splice(index, 1)
    unlockScroll()
    document.removeEventListener('keydown', onKeydown)
    if (returnFocusTo && returnFocusTo.isConnected) returnFocusTo.focus()
    returnFocusTo = null
  }

  watch(open, (value) => (value ? activate() : deactivate()), { immediate: true, flush: 'post' })
  onBeforeUnmount(deactivate)
}
