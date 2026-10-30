<script setup lang="ts">
/**
 * RestConfirmationModal — lists exactly what a short or long rest will restore.
 * A short rest also lets the player spend Hit Dice (rolled or average).
 */
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import PressableButton from '@/components/ui/PressableButton.vue'
import { averageHitDieHealing, type RestContext, type RestSummary } from '@/domain'

const props = defineProps<{
  open: boolean
  kind: 'short' | 'long'
  summary: RestSummary
  context: RestContext
  currentHp: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', options: { hitDiceSpent: number; useAverage: boolean }): void
}>()

const hitDiceSpent = ref(0)
const useAverage = ref(true)

watch(
  () => props.open,
  (open) => {
    if (open) {
      hitDiceSpent.value = 0
      useAverage.value = true
    }
  },
)

const isShort = computed(() => props.kind === 'short')
const title = computed(() => (isShort.value ? 'Take a Short Rest' : 'Take a Long Rest'))

const expectedHealing = computed(() => {
  const perDie = useAverage.value
    ? averageHitDieHealing(props.context)
    : Math.max(1, Math.round((props.context.hitDie + 1) / 2) + props.context.conMod)
  const raw = hitDiceSpent.value * perDie
  return Math.min(raw, Math.max(0, props.context.maxHp - props.currentHp))
})

const lines = computed(() => {
  const s = props.summary
  const out: string[] = []
  if (!isShort.value) {
    if (s.hpGained > 0) out.push(`Restore ${s.hpGained} HP to your maximum`)
    if (s.tempHpCleared > 0) out.push(`Clear ${s.tempHpCleared} temporary HP`)
    if (s.hitDiceRegained > 0) out.push(`Regain ${s.hitDiceRegained} Hit Dice`)
    if (s.deathSavesReset) out.push('Reset death saves')
  }
  if (s.slotLevels.length > 0) {
    out.push(
      `${isShort.value ? 'Restore Pact Magic slots' : 'Restore all spell slots'} (${s.slotLevels
        .map((k) => k.replace('level', 'Lv '))
        .join(', ')})`,
    )
  }
  if (s.features.length > 0) out.push(`Reset uses: ${s.features.join(', ')}`)
  return out
})
</script>

<template>
  <BaseModal :open="open" :title="title" variant="sheet" size="sm" @close="emit('close')">
    <div class="flex flex-col gap-4">
      <section v-if="isShort" class="flex flex-col gap-3" data-testid="rest-hit-dice">
        <p class="font-body-md text-body-md text-on-surface-variant">
          Spend Hit Dice to heal. {{ summary.hitDiceAvailable }} d{{ context.hitDie }} available.
        </p>
        <div class="flex items-center gap-3">
          <PressableButton
            variant="secondary"
            class="w-11"
            aria-label="Spend fewer Hit Dice"
            :disabled="hitDiceSpent <= 0"
            @click="hitDiceSpent--"
          >
            −
          </PressableButton>
          <span class="min-w-[4ch] text-center font-headline-md text-headline-md" data-testid="rest-dice-count">
            {{ hitDiceSpent }}
          </span>
          <PressableButton
            variant="secondary"
            class="w-11"
            aria-label="Spend more Hit Dice"
            :disabled="hitDiceSpent >= summary.hitDiceAvailable"
            @click="hitDiceSpent++"
          >
            +
          </PressableButton>
        </div>
        <fieldset class="flex gap-4" :disabled="hitDiceSpent === 0">
          <legend class="sr-only">Healing method</legend>
          <label class="inline-flex items-center gap-2">
            <input v-model="useAverage" type="radio" :value="true" /> Average
          </label>
          <label class="inline-flex items-center gap-2">
            <input v-model="useAverage" type="radio" :value="false" /> Roll
          </label>
        </fieldset>
        <p v-if="hitDiceSpent > 0" class="font-body-md text-body-md text-tertiary" data-testid="rest-expected-healing">
          {{ useAverage ? 'Heals' : 'Expected to heal about' }} {{ expectedHealing }} HP
        </p>
      </section>

      <ul v-if="lines.length > 0" class="list-disc pl-5 font-body-md text-body-md text-on-surface">
        <li v-for="line in lines" :key="line">{{ line }}</li>
      </ul>
      <p v-else-if="!isShort" class="font-body-md text-body-md text-on-surface-variant">
        Nothing needs restoring.
      </p>
    </div>

    <template #footer>
      <PressableButton variant="ghost" @click="emit('close')">Cancel</PressableButton>
      <PressableButton
        variant="primary"
        data-autofocus
        data-testid="rest-confirm"
        @click="emit('confirm', { hitDiceSpent, useAverage })"
      >
        {{ isShort ? 'Take Short Rest' : 'Take Long Rest' }}
      </PressableButton>
    </template>
  </BaseModal>
</template>
