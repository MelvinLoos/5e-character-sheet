<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCharacterStore } from '@/stores/character'
import BaseModal from '@/components/ui/BaseModal.vue'
import IconButton from '@/components/ui/IconButton.vue'
import PressableButton from '@/components/ui/PressableButton.vue'
import TextField from '@/components/ui/TextField.vue'

const store = useCharacterStore()
const copyState = ref<'idle' | 'copied' | 'failed'>('idle')

watch(
  () => store.shareModal.show,
  (show) => {
    if (show) copyState.value = 'idle'
  },
)

function copyToClipboard() {
  navigator.clipboard
    .writeText(store.shareModal.url)
    .then(() => {
      copyState.value = 'copied'
    })
    .catch(() => {
      copyState.value = 'failed'
    })
}
</script>

<template>
  <BaseModal
    :open="store.shareModal.show"
    title="Character Shared!"
    size="md"
    @close="store.closeShareModal"
  >
    <p class="mb-4">Your character has been saved to the archives. Share this link:</p>
    <div class="flex items-end gap-2">
      <TextField
        class="flex-grow"
        label="Share link"
        :model-value="store.shareModal.url"
        readonly
        data-autofocus
        @focus="($event.target as HTMLInputElement).select()"
      />
      <IconButton icon="content_copy" label="Copy link to clipboard" @click="copyToClipboard" />
    </div>
    <p v-if="copyState !== 'idle'" role="status" class="mt-2 text-sm" :class="copyState === 'failed' ? 'text-error' : 'text-primary'">
      {{ copyState === 'copied' ? 'Link copied to clipboard.' : 'Failed to copy link. Select it and copy manually.' }}
    </p>
    <template #footer>
      <PressableButton variant="secondary" @click="store.closeShareModal">Close</PressableButton>
    </template>
  </BaseModal>
</template>
