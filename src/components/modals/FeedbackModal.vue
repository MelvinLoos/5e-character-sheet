<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import {
  submitFeedback,
  extractDiscordIdFromAvatarUrl,
  type FeedbackType,
} from '@/infra/feedbackService'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const authStore = useAuthStore()
const route = useRoute()

const feedbackType = ref<FeedbackType>('general')
const feedbackText = ref('')
const submitState = ref<'idle' | 'sending' | 'success' | 'error'>('idle')

const typeOptions = [
  { value: 'bug', label: 'Bug', icon: 'bug_report' },
  { value: 'feature', label: 'Feature', icon: 'lightbulb' },
  { value: 'general', label: 'General', icon: 'forum' },
] as const

const canSubmit = computed(
  () => feedbackText.value.trim().length > 0 && submitState.value !== 'sending',
)

function close() {
  emit('close')
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  }
}

async function handleSubmit() {
  if (!canSubmit.value) {
    return
  }

  submitState.value = 'sending'

  try {
    await submitFeedback({
      type: feedbackType.value,
      message: feedbackText.value.trim(),
      context: {
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        userAgent: navigator.userAgent,
        route: route.fullPath,
      },
      reporter: {
        discordId: extractDiscordIdFromAvatarUrl(authStore.discordAvatarUrl),
        discordUsername: authStore.discordUsername,
        userId: authStore.userId,
      },
    })
    submitState.value = 'success'
  } catch {
    submitState.value = 'error'
  }
}

// Reset the form whenever the modal re-opens.
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      feedbackText.value = ''
      feedbackType.value = 'general'
      submitState.value = 'idle'
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="props.isOpen"
        class="modal-backdrop backdrop-blur-sm bg-black/40"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
        role="dialog"
        aria-modal="true"
        aria-label="Give Feedback"
      >
        <div class="modal-content rounded-xl">
          <!-- Success state -->
          <template v-if="submitState === 'success'">
            <h2 class="text-xl font-bold text-sheet-red mb-4">Thanks for your feedback!</h2>
            <p class="mb-6">Your feedback has been delivered to the Guild.</p>
            <button @click="close" class="icon-button">
              <span class="material-symbols-outlined text-base">check</span>
              Close
            </button>
          </template>

          <!-- Form / loading / error state -->
          <template v-else>
            <h2 class="text-xl font-bold text-sheet-red mb-4">Give Feedback</h2>
            <p class="mb-4 text-sm">
              Help us improve the app. Your feedback goes straight to the Guild's private
              Discord channel.
            </p>

            <!-- Type selector -->
            <div class="flex gap-2 justify-center mb-4" role="group" aria-label="Feedback type">
              <button
                v-for="option in typeOptions"
                :key="option.value"
                @click="feedbackType = option.value"
                class="flex items-center gap-2 px-3 py-2 rounded-lg font-label-md text-sm border transition-all duration-150 ease-out select-none"
                :class="
                  feedbackType === option.value
                    ? 'bg-tertiary text-on-tertiary border-tertiary'
                    : 'bg-surface-variant text-on-surface-variant border-outline-variant hover:bg-surface-bright'
                "
              >
                <span class="material-symbols-outlined text-base">{{ option.icon }}</span>
                {{ option.label }}
              </button>
            </div>

            <textarea
              v-model="feedbackText"
              rows="5"
              maxlength="4000"
              aria-label="Feedback message"
              placeholder="Tell us what's on your mind..."
              class="w-full bg-surface-variant border border-outline-variant rounded-xl p-3 font-body-md text-sm text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary resize-y mb-4"
            ></textarea>

            <p v-if="submitState === 'error'" class="text-red-600 text-sm mb-4">
              We couldn't send your feedback. Please try again.
            </p>

            <div class="flex gap-2 justify-center">
              <button
                @click="close"
                class="px-4 py-2 rounded-lg text-on-surface-variant font-label-md text-sm hover:bg-surface-variant active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                @click="handleSubmit"
                :disabled="!canSubmit"
                class="icon-button font-label-md text-sm"
              >
                <span
                  v-if="submitState === 'sending'"
                  class="material-symbols-outlined animate-spin text-base"
                  >progress_activity</span
                >
                {{ submitState === 'sending' ? 'Sending' : 'Submit Feedback' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active {
  transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-leave-active {
  transition: all 150ms ease-in;
}

.modal-enter-from {
  opacity: 0;
}

.modal-enter-from > div:last-child {
  opacity: 0;
  transform: scale(0.95) translateY(12px);
}

.modal-leave-to {
  opacity: 0;
}

.modal-leave-to > div:last-child {
  opacity: 0;
  transform: scale(0.95);
}
</style>