<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import PressableButton from '@/components/ui/PressableButton.vue'
import { DEFAULT_ABILITY_MAX, isValidAbilityChoice } from '@/domain/abilityIncreases'
import type { AbilityChoice, CharacterFeature } from '@/types/character'
import type { AbilityKey } from '@/types/enums'

const props = defineProps<{
  isOpen: boolean
  feature: CharacterFeature | null
  /** Current final scores, used for the preview. */
  abilityScores: Record<string, number>
}>()
const emit = defineEmits<{ select: [choice: AbilityChoice]; close: [] }>()

const options = computed(() => props.feature?.abilityIncrease ?? [])
const option = ref(0)
const picks = ref<(AbilityKey | '')[]>([])

const active = computed(() => options.value[option.value])
const choose = computed(() => active.value?.choose)

function optionLabel(i: number): string {
  const o = options.value[i]
  if (!o) return ''
  const parts: string[] = []
  if (o.fixed) parts.push(Object.entries(o.fixed).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(', '))
  if (o.choose) {
    const { count, amount } = o.choose
    parts.push(count === 1 ? `+${amount} to one score` : `+${amount} to ${count} different scores`)
  }
  return parts.join(' and ')
}

watch(
  () => [props.isOpen, props.feature] as const,
  () => {
    const existing = props.feature?.abilityChoice
    option.value = existing?.option ?? 0
    picks.value = [...(existing?.picks ?? [])]
  },
  { immediate: true },
)
watch(option, () => {
  picks.value = Array.from({ length: choose.value?.count ?? 0 }, (_, i) => picks.value[i] ?? '')
})
const slots = computed(() => Array.from({ length: choose.value?.count ?? 0 }, (_, i) => i))

/** Abilities already taken by the other slots can't be picked again. */
function available(slot: number): AbilityKey[] {
  const taken = new Set(picks.value.filter((p, i) => i !== slot && p))
  return (choose.value?.from ?? []).filter((a) => !taken.has(a))
}

const candidate = computed<AbilityChoice>(() => ({
  option: option.value,
  picks: picks.value.filter((p): p is AbilityKey => !!p),
}))
const valid = computed(() => isValidAbilityChoice(options.value, candidate.value))

/** Preview rows: current → new (capped), for each affected ability. */
const preview = computed(() => {
  const o = active.value
  if (!o) return []
  const max = o.max ?? DEFAULT_ABILITY_MAX
  const bonus: Record<string, number> = { ...(o.fixed ?? {}) }
  for (const p of candidate.value.picks) bonus[p] = (bonus[p] ?? 0) + (o.choose?.amount ?? 0)
  return Object.entries(bonus).map(([k, v]) => {
    const cur = props.abilityScores[k] ?? 10
    const next = Math.max(cur, Math.min(cur + v, max))
    return { key: k, cur, next, capped: next < cur + v, max }
  })
})

function confirm() {
  if (valid.value) emit('select', candidate.value)
}
</script>

<template>
  <BaseModal
    :open="isOpen && !!feature"
    :title="`${feature?.title ?? 'Feat'}: Ability Score Increase`"
    size="md"
    @close="emit('close')"
  >
    <div class="flex flex-col gap-4" data-test="ability-increase-modal">
      <fieldset v-if="options.length > 1" class="flex flex-col gap-2">
        <legend class="text-sm font-bold mb-1">Choose one</legend>
        <label
          v-for="(_, i) in options"
          :key="i"
          class="flex items-center gap-2 p-2 rounded border border-outline-variant cursor-pointer"
        >
          <input v-model="option" type="radio" name="ability-option" :value="i" />
          <span>{{ optionLabel(i) }}</span>
        </label>
      </fieldset>
      <p v-else-if="active" class="text-sm text-on-surface-variant">{{ optionLabel(0) }}</p>

      <div v-for="slot in slots" :key="slot" class="flex flex-col gap-1">
        <label :for="`ability-pick-${slot}`" class="text-sm font-bold">
          Ability {{ slots.length > 1 ? slot + 1 : '' }}
        </label>
        <select
          :id="`ability-pick-${slot}`"
          v-model="picks[slot]"
          class="w-full bg-background border border-outline-variant rounded p-2 text-on-surface"
        >
          <option value="">Select ability...</option>
          <option v-for="a in available(slot)" :key="a" :value="a">{{ a.toUpperCase() }}</option>
        </select>
      </div>

      <ul v-if="preview.length" class="text-sm flex flex-col gap-1" aria-label="Preview">
        <li v-for="row in preview" :key="row.key">
          <span class="font-bold uppercase">{{ row.key }}</span>: {{ row.cur }} → {{ row.next }}
          <span v-if="row.capped" class="text-error"> (capped at {{ row.max }})</span>
        </li>
      </ul>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <PressableButton variant="ghost" @click="emit('close')">Cancel</PressableButton>
        <PressableButton variant="primary" :disabled="!valid" data-test="ability-increase-confirm" @click="confirm">
          Apply
        </PressableButton>
      </div>
    </template>
  </BaseModal>
</template>
