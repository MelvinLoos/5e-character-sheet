<script setup lang="ts">
/**
 * DiscordUnlockReminderModal
 *
 * A contextual reminder shown to logged-out players when they open the Spells
 * or Feats views. Explains that logging in with Discord unlocks server-specific
 * spells and feats, offers the Discord sign-in button, and provides a
 * "Don't show this again" toggle that permanently suppresses the reminder.
 *
 * The component is self-contained: it watches the current route and the auth
 * state, so it can be mounted once globally (see App.vue) without a parent
 * having to drive its visibility.
 */
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { STORAGE_KEYS } from '@/constants/storage-keys'

/** Routes on which the reminder is relevant (spells and feats). */
const REMINDER_ROUTES = ['spells', 'feats'] as const

const authStore = useAuthStore()
const route = useRoute()

const isOpen = ref(false)
const dontShowAgain = ref(false)

function isRelevantRouteName(name: unknown): boolean {
  return REMINDER_ROUTES.includes(String(name ?? '') as (typeof REMINDER_ROUTES)[number])
}

function isDismissedPermanently(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.DISCORD_UNLOCK_REMINDER_DISMISSED) === 'true'
  } catch {
    // Storage can throw in private mode / when disabled — treat as not dismissed.
    return false
  }
}

function persistDismissal(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DISCORD_UNLOCK_REMINDER_DISMISSED, 'true')
  } catch {
    // Ignore storage failures; the reminder still closes for this session.
  }
}

function close(): void {
  if (dontShowAgain.value) {
    persistDismissal()
  }
  isOpen.value = false
}

function handleLogin(): void {
  isOpen.value = false
  authStore.signInWithDiscord()
}

function handleBackdropClick(event: MouseEvent): void {
  if (event.target === event.currentTarget) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (isOpen.value && event.key === 'Escape') {
    close()
  }
}

// Re-evaluate visibility whenever the route or the auth state changes.
watch(
  () => [route.name, authStore.isAuthenticated] as const,
  ([name, isAuthenticated]) => {
    const shouldShow = !isAuthenticated && isRelevantRouteName(name) && !isDismissedPermanently()

    if (shouldShow) {
      dontShowAgain.value = false
      isOpen.value = true
    } else if (isOpen.value) {
      isOpen.value = false
    }
  },
  { immediate: true },
)

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="modal-backdrop backdrop-blur-sm bg-black/40"
      @click="handleBackdropClick"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discord-reminder-title"
    >
      <div class="modal-content rounded-xl max-w-md w-full mx-4">
        <!-- Close (X) -->
        <div class="flex justify-end -mt-2 -mr-2 mb-1">
          <button
            data-test="discord-reminder-close"
            @click="close"
            class="info-button"
            title="Close"
            aria-label="Close"
          >
            <span class="material-symbols-outlined text-base" aria-hidden="true">close</span>
          </button>
        </div>

        <!-- Discord badge + heading -->
        <div class="flex flex-col items-center text-center gap-3 mb-4">
          <span
            class="flex items-center justify-center w-14 h-14 rounded-full bg-[#5865F2] text-white shadow-md"
          >
            <svg class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
              />
            </svg>
          </span>
          <h2 id="discord-reminder-title" class="text-xl font-bold text-tertiary">
            Unlock Guild Spells &amp; Feats
          </h2>
          <p class="text-sm text-on-surface-variant leading-relaxed">
            Log in with Discord to unlock the spells and feats shared by your guild. Server-specific
            content appears here once you're connected.
          </p>
        </div>

        <!-- Login button -->
        <button
          data-test="discord-reminder-login"
          @click="handleLogin"
          class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] transition-colors text-white font-label-md mb-4"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
            />
          </svg>
          Login with Discord
        </button>

        <!-- Don't show again toggle -->
        <label
          class="flex items-center justify-center gap-2 cursor-pointer select-none text-on-surface-variant font-label-md text-sm mb-6"
        >
          <input
            data-test="discord-reminder-dont-show"
            v-model="dontShowAgain"
            type="checkbox"
            class="usage-box"
          />
          Don't show this again
        </label>

        <!-- Dismiss -->
        <div class="flex justify-center">
          <button
            data-test="discord-reminder-dismiss"
            @click="close"
            class="px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-variant active:scale-95 transition-all font-label-md text-sm"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

