<script setup lang="ts">
/** Renders the pending useConfirm() request. Mounted once in App.vue. */
import { useConfirm } from '@/composables/useConfirm'
import BaseModal from '@/components/ui/BaseModal.vue'
import PressableButton from '@/components/ui/PressableButton.vue'

const { state, settle } = useConfirm()
</script>

<template>
  <BaseModal
    :open="state.open"
    :title="state.title"
    size="sm"
    hide-close
    @close="settle(false)"
  >
    <p v-if="state.message" class="font-body-md text-body-md text-on-surface-variant">
      {{ state.message }}
    </p>
    <template #footer>
      <PressableButton
        variant="ghost"
        :data-autofocus="state.danger ? '' : undefined"
        @click="settle(false)"
      >
        {{ state.cancelLabel }}
      </PressableButton>
      <PressableButton
        :variant="state.danger ? 'danger' : 'primary'"
        :data-autofocus="state.danger ? undefined : ''"
        @click="settle(true)"
      >
        {{ state.confirmLabel }}
      </PressableButton>
    </template>
  </BaseModal>
</template>
