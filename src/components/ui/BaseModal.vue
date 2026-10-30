<script setup lang="ts">
/**
 * BaseModal — the single dialog shell for the app.
 *
 * Teleports to <body>, exposes role="dialog" + aria-modal, labels itself from
 * `title` (or `ariaLabel`), closes on Escape / backdrop, traps and restores
 * focus and locks page scroll (see useDialogBehavior).
 *
 *   <BaseModal :open="show" title="Import" @close="show = false">
 *     …body…
 *     <template #footer>…actions…</template>
 *   </BaseModal>
 *
 * Mark the element that should receive focus first with `data-autofocus`.
 * `variant="sheet"` renders a bottom sheet on mobile and a centred dialog from md up.
 */
import { computed, ref, toRef, useId } from 'vue'
import { useDialogBehavior } from '@/composables/useDialogBehavior'
import IconButton from '@/components/ui/IconButton.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    /** Accessible name when there is no visible title. */
    ariaLabel?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'dialog' | 'sheet'
    closeOnBackdrop?: boolean
    closeOnEscape?: boolean
    hideClose?: boolean
  }>(),
  {
    size: 'md',
    variant: 'dialog',
    closeOnBackdrop: true,
    closeOnEscape: true,
    hideClose: false,
  },
)

const emit = defineEmits<{ (e: 'close'): void }>()

const titleId = useId()
const panel = ref<HTMLElement | null>(null)

useDialogBehavior({
  open: toRef(props, 'open'),
  panel,
  onClose: () => emit('close'),
  closeOnEscape: toRef(props, 'closeOnEscape'),
})

const sizeClass = computed(
  () => ({ sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' })[props.size],
)

function onBackdropMouseDown(): void {
  if (props.closeOnBackdrop) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-modal flex justify-center bg-black/60 backdrop-blur-sm p-0 print:hidden"
        :class="variant === 'sheet' ? 'items-end md:items-center md:p-4' : 'items-center p-4'"
        data-testid="modal-backdrop"
        @mousedown.self="onBackdropMouseDown"
      >
        <div
          ref="panel"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          :aria-labelledby="title ? titleId : undefined"
          :aria-label="title ? undefined : ariaLabel"
          class="flex w-full flex-col overflow-hidden border border-outline-variant bg-surface-container text-on-surface shadow-elevation-4 max-h-[85dvh] focus:outline-none"
          :class="[
            sizeClass,
            variant === 'sheet' ? 'rounded-t-xl md:rounded-xl' : 'rounded-xl',
          ]"
        >
          <header
            v-if="title || $slots.header || !hideClose"
            class="flex items-start justify-between gap-4 border-b border-outline-variant px-6 py-4"
          >
            <slot name="header">
              <h2 :id="titleId" class="font-headline-md text-headline-md text-tertiary">
                {{ title }}
              </h2>
            </slot>
            <IconButton
              v-if="!hideClose"
              icon="close"
              label="Close dialog"
              size="sm"
              data-modal-close
              class="-mr-2 -mt-1 shrink-0"
              @click="emit('close')"
            />
          </header>
          <div class="flex-1 overflow-y-auto px-6 py-4">
            <slot />
          </div>
          <footer
            v-if="$slots.footer"
            class="flex flex-wrap justify-end gap-3 border-t border-outline-variant px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
