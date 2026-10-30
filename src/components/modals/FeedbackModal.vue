<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { capturePostHogEvent } from '@/utils/posthog'
import { useFeedbackStore } from '@/stores/feedbackStore'
import {
  submitFeedback,
  extractDiscordIdFromAvatarUrl,
  FeedbackServiceError,
  type FeedbackType,
} from '@/infra/feedbackService'
import BaseModal from '@/components/ui/BaseModal.vue'
import PressableButton from '@/components/ui/PressableButton.vue'
import StatusBanner from '@/components/ui/StatusBanner.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const authStore = useAuthStore()
const feedbackStore = useFeedbackStore()
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
    capturePostHogEvent('feedback_submitted', {
      feedback_type: feedbackType.value,
    })
  } catch (error) {
    if (error instanceof FeedbackServiceError && error.code === 'SERVICE_UNCONFIGURED') {
      feedbackStore.markUnavailable()
      close()
      return
    }

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
  <BaseModal
    :open="props.isOpen"
    :title="submitState === 'success' ? 'Thanks for your feedback!' : 'Give Feedback'"
    size="md"
    @close="close"
  >
    <!-- Success state -->
    <p v-if="submitState === 'success'" role="status">
      Your feedback has been delivered to the Guild.
    </p>

    <!-- Form / loading / error state -->
    <template v-else>
      <p class="mb-4 text-sm">
        Help us improve the app. Your feedback goes straight to the Guild's private Discord
        channel.
      </p>

      <!-- Type selector -->
      <div class="mb-4 flex justify-center gap-2" role="group" aria-label="Feedback type">
        <button
          v-for="option in typeOptions"
          :key="option.value"
          type="button"
          :aria-pressed="feedbackType === option.value"
          class="flex min-h-11 select-none items-center gap-2 rounded-lg border px-3 py-2 font-label-md text-sm transition-all duration-150 ease-out"
          :class="
            feedbackType === option.value
              ? 'border-tertiary bg-tertiary text-on-tertiary'
              : 'border-outline-variant bg-surface-variant text-on-surface-variant hover:bg-surface-bright'
          "
          @click="feedbackType = option.value"
        >
          <span class="material-symbols-outlined text-base" aria-hidden="true">{{
            option.icon
          }}</span>
          {{ option.label }}
        </button>
      </div>

      <textarea
        v-model="feedbackText"
        data-autofocus
        rows="5"
        maxlength="4000"
        aria-label="Feedback message"
        placeholder="Tell us what's on your mind..."
        class="mb-4 w-full resize-y rounded-xl border border-outline-variant bg-surface-variant p-3 font-body-md text-sm text-on-surface placeholder:text-outline focus:border-tertiary focus:outline-none focus-visible:ring-2 focus-visible:ring-tertiary"
      ></textarea>

      <StatusBanner v-if="submitState === 'error'" tone="error">
        We couldn't send your feedback. Please try again.
      </StatusBanner>
    </template>

    <template #footer>
      <template v-if="submitState === 'success'">
        <PressableButton variant="primary" @click="close">Close</PressableButton>
      </template>
      <template v-else>
        <PressableButton variant="ghost" @click="close">Cancel</PressableButton>
        <PressableButton
          variant="primary"
          :loading="submitState === 'sending'"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          {{ submitState === 'sending' ? 'Sending' : 'Submit Feedback' }}
        </PressableButton>
      </template>
    </template>
  </BaseModal>
</template>
