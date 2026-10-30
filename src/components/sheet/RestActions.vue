<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '@/stores/character'
import { describeLongRest, describeShortRest } from '@/domain'
import PressableButton from '@/components/ui/PressableButton.vue'
import RestConfirmationModal from '@/components/modals/RestConfirmationModal.vue'

const store = useCharacterStore()
const pending = ref<'short' | 'long' | null>(null)

const context = computed(() => store.buildRestContext())
const shortSummary = computed(() => describeShortRest(store.currentCharacterData, context.value))
const longSummary = computed(() => describeLongRest(store.currentCharacterData, context.value))
const summary = computed(() => (pending.value === 'long' ? longSummary.value : shortSummary.value))

const noCharacter = computed(() => !store.currentCharacterData)

function confirm(options: { hitDiceSpent: number; useAverage: boolean }): void {
  if (pending.value === 'short') store.shortRest(options)
  else if (pending.value === 'long') store.longRest()
  pending.value = null
}
</script>

<template>
  <div class="flex gap-3">
    <PressableButton
      variant="secondary"
      class="flex-1 gap-2"
      data-testid="short-rest-btn"
      :disabled="noCharacter || !shortSummary.hasAnything"
      @click="pending = 'short'"
    >
      <span class="material-symbols-outlined" aria-hidden="true">nightlight</span>
      Short Rest
    </PressableButton>
    <PressableButton
      variant="secondary"
      class="flex-1 gap-2"
      data-testid="long-rest-btn"
      :disabled="noCharacter || !longSummary.hasAnything"
      @click="pending = 'long'"
    >
      <span class="material-symbols-outlined" aria-hidden="true">bedtime</span>
      Long Rest
    </PressableButton>
  </div>

  <RestConfirmationModal
    v-if="pending"
    :open="true"
    :kind="pending"
    :summary="summary"
    :context="context"
    :current-hp="store.currentCharacterData.combat.hp_current ?? context.maxHp"
    @close="pending = null"
    @confirm="confirm"
  />
</template>
