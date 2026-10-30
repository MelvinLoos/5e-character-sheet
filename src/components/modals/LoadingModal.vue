<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import BaseModal from '@/components/ui/BaseModal.vue'

const store = useCharacterStore()
</script>

<template>
  <BaseModal
    :open="store.isLoading"
    :aria-label="store.loadingText || 'Loading'"
    size="sm"
    hide-close
    :close-on-escape="false"
    :close-on-backdrop="false"
    @close="() => {}"
  >
    <div class="py-4 text-center" role="status" aria-live="polite">
      <div class="loading-spinner mx-auto mb-4" aria-hidden="true"></div>
      <p class="text-lg font-bold text-tertiary">{{ store.loadingText }}</p>
    </div>
  </BaseModal>
</template>
