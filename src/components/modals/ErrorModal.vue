<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import BaseModal from '@/components/ui/BaseModal.vue'
import PressableButton from '@/components/ui/PressableButton.vue'

const store = useCharacterStore()
</script>

<template>
  <BaseModal :open="store.errorModal.show" title="Error" size="md" @close="store.closeErrorModal">
    <ul class="list-inside list-disc space-y-1 text-left">
      <li v-for="error in store.errorModal.errors" :key="error">{{ error }}</li>
    </ul>
    <template #footer>
      <PressableButton variant="secondary" data-autofocus @click="store.closeErrorModal">
        Close
      </PressableButton>
    </template>
  </BaseModal>
</template>
