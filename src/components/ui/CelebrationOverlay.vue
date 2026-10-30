<script setup lang="ts">
/**
 * CelebrationOverlay — brief, non-interactive celebratory overlay.
 *
 * Specified by Issue #66 (Delightful Reaction Animations). The dice roller
 * (Issue #69) is the first consumer: a Natural 20 triggers the `crit` variant.
 * `success` / `save` are reserved for the other #66 triggers.
 */
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useCelebration } from '@/composables/useCelebration'

/** How long the overlay stays on screen (ms). */
const VISIBLE_MS = 1500

const { celebration } = useCelebration()
const visible = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

const label = computed(() => (celebration.value.type === 'crit' ? 'NAT 20' : ''))

watch(
  () => celebration.value.timestamp,
  (timestamp) => {
    if (!timestamp || celebration.value.type !== 'crit') return
    visible.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (visible.value = false), VISIBLE_MS)
  },
)

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <Transition name="celebration-fade">
    <div
      v-if="visible"
      class="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center print:hidden"
      aria-hidden="true"
      data-testid="celebration-overlay"
    >
      <div class="crit-ring" />
      <div class="crit-text">{{ label }}</div>
    </div>
  </Transition>
</template>

<style scoped>
.celebration-fade-enter-active,
.celebration-fade-leave-active {
  transition: opacity 200ms ease-out;
}

.celebration-fade-enter-from,
.celebration-fade-leave-to {
  opacity: 0;
}

@keyframes critPop {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  40% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1.35);
    opacity: 0;
  }
}

@keyframes critText {
  0% {
    transform: scale(0.6);
    opacity: 0;
  }
  35% {
    transform: scale(1.15);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.crit-ring {
  position: absolute;
  width: 16rem;
  height: 16rem;
  border-radius: 9999px;
  border: 8px solid color-mix(in srgb, var(--color-tertiary) 60%, transparent);
  animation: critPop 0.9s ease-out forwards;
}

.crit-text {
  position: relative;
  font-family: 'EB Garamond', serif;
  font-size: 3.5rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--color-tertiary);
  text-shadow: 0 0 24px color-mix(in srgb, var(--color-tertiary) 80%, transparent);
  animation: critText 0.5s ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  .crit-ring,
  .crit-text {
    animation: none;
  }
}
</style>
