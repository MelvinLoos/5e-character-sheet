/**
 * useConfirm — promise-based replacement for window.confirm().
 *
 * Module-level singleton state, rendered once by <ConfirmDialog /> in App.vue.
 *
 *   if (await confirm({ title: 'Remove feature?', message: '…', danger: true })) { … }
 */
import { reactive } from 'vue'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Style the confirm action as destructive and focus Cancel first. */
  danger?: boolean
}

const defaults = {
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  danger: false,
}

const state = reactive({ open: false, ...defaults })
let resolver: ((value: boolean) => void) | null = null

export function useConfirm() {
  function confirm(options: ConfirmOptions): Promise<boolean> {
    // A newer request supersedes a pending one.
    resolver?.(false)
    Object.assign(state, defaults, options, { open: true })
    return new Promise<boolean>((resolve) => {
      resolver = resolve
    })
  }

  function settle(value: boolean): void {
    state.open = false
    resolver?.(value)
    resolver = null
  }

  return { state, confirm, settle }
}
