<script setup lang="ts">
/**
 * TourTooltip — the onboarding tour overlay.
 *
 * Rendered once near the app root and driven entirely by the
 * `useOnboardingTour` singleton. Dims the page (spotlighting the current
 * target), and shows a skippable coaching card with Back / Next / Finish.
 *
 * Auto-imported via `unplugin-vue-components` — do not import it manually.
 */
import { useOnboardingTour } from '@/composables/useOnboardingTour'

const {
  active,
  currentStep,
  stepLabel,
  isFirst,
  isLast,
  spotlightStyle,
  tooltipStyle,
  next,
  prev,
  skip,
} = useOnboardingTour()
</script>

<template>
  <Teleport to="body">
    <div v-if="active">
      <!-- Spotlight: a ring around the target with a huge shadow that dims the rest -->
      <div
        v-if="spotlightStyle"
        class="fixed z-50 pointer-events-none rounded-lg ring-2 ring-tertiary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
        :style="spotlightStyle"
        aria-hidden="true"
      ></div>
      <div
        v-else
        class="fixed inset-0 z-50 pointer-events-none bg-black/50"
        aria-hidden="true"
      ></div>

      <Transition name="pop">
        <div
          v-if="currentStep"
          role="dialog"
          aria-modal="false"
          :aria-label="currentStep.title"
          class="tour-tooltip fixed z-[60] max-w-xs bg-surface-container p-4 rounded-xl border border-tertiary/30 shadow-elevation-4 pointer-events-auto"
          :style="tooltipStyle"
          @keydown.esc="skip"
        >
          <div class="flex items-start justify-between gap-2 mb-1">
            <div class="font-headline-md text-headline-md text-tertiary">{{ currentStep.title }}</div>
            <button
              type="button"
              class="text-xs text-on-surface-variant hover:text-on-surface transition-colors select-none"
              aria-label="Skip tour"
              @click="skip"
            >
              Skip
            </button>
          </div>

          <p class="text-sm text-on-surface mb-4">{{ currentStep.body }}</p>

          <div class="flex items-center justify-between">
            <span class="text-xs text-on-surface-variant">{{ stepLabel }}</span>
            <div class="flex gap-2">
              <button
                type="button"
                class="px-3 py-1 rounded text-sm text-on-surface-variant hover:text-on-surface disabled:opacity-40 disabled:cursor-not-allowed transition-colors select-none"
                :disabled="isFirst"
                @click="prev"
              >
                Back
              </button>
              <button
                type="button"
                class="bg-tertiary text-on-tertiary px-3 py-1 rounded text-sm font-label-md hover:bg-tertiary-fixed active:scale-95 transition-all duration-200 select-none"
                @click="next"
              >
                {{ isLast ? 'Finish' : 'Next' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.pop-enter-active {
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}

.pop-leave-active {
  transition: opacity 100ms ease-in, transform 100ms ease-in;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
