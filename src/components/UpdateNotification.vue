<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getSwUpdateCallback } from '../utils/swUpdateBus'

const updateAvailable = ref(false)

function handleUpdateAvailable() {
  updateAvailable.value = true
}

function applyUpdate() {
  updateAvailable.value = false
  const updateSW = getSwUpdateCallback()

  if (updateSW) {
    updateSW()
  } else {
    // Fallback: reload directly
    window.location.reload()
  }
}

onMounted(() => {
  window.addEventListener('sw-update-available', handleUpdateAvailable)
})

onUnmounted(() => {
  window.removeEventListener('sw-update-available', handleUpdateAvailable)
})
</script>

<template>
  <Transition name="slide-up">
    <div v-if="updateAvailable" class="update-notification" role="alert">
      <div class="update-notification__content">
        <svg
          class="update-notification__icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span>A new version of the app is available.</span>
      </div>
      <button class="update-notification__button" @click="applyUpdate">
        Refresh now
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.update-notification {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  background-color: var(--color-surface-elevated, #1e2d2f);
  color: var(--color-text-primary, #e8e6e3);
  border: 1px solid var(--color-border, #3a4a4c);
  border-radius: 12px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  max-width: calc(100vw - 32px);
  backdrop-filter: blur(12px);
}

.update-notification__content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Manrope', sans-serif;
  font-size: 14px;
  line-height: 1.4;
}

.update-notification__icon {
  flex-shrink: 0;
  color: var(--color-accent, #73b58c);
}

.update-notification__button {
  flex-shrink: 0;
  padding: 6px 14px;
  border: none;
  border-radius: 8px;
  background-color: var(--color-accent, #73b58c);
  color: var(--color-surface, #121b1d);
  font-family: 'Manrope', sans-serif;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.update-notification__button:hover {
  opacity: 0.9;
}

/* Slide-up transition */
.slide-up-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-up-leave-active {
  transition: all 0.2s ease-in;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}
</style>