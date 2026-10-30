<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import { useProgressionStore } from '@/stores/progression'
import { computed, ref, watch } from 'vue'
import { useCombat } from '@/composables/useCombat'
import type { RollMode } from '@/domain'
import ElevatedCard from '@/components/ui/ElevatedCard.vue'
import IconButton from '@/components/ui/IconButton.vue'
import UsageTracker from '@/components/ui/UsageTracker.vue'
import RestActions from '@/components/sheet/RestActions.vue'

const store = useCharacterStore()
const progression = useProgressionStore()
const { initiativeMod, clampCurrentHp, isDowned, hitDie, hitDiceTotal, hitDiceRemaining, takeDamage, heal } =
  useCombat()

const amount = ref<number | null>(null)

function applyAmount(kind: 'damage' | 'heal'): void {
  const n = Math.floor(Number(amount.value))
  if (!Number.isFinite(n) || n <= 0) return
  if (kind === 'damage') takeDamage(n)
  else heal(n)
  amount.value = null
}

const rollModes: { value: RollMode; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'advantage', label: 'Adv' },
  { value: 'disadvantage', label: 'Dis' },
]
const rollMode = ref<RollMode>('normal')
const initiativePulsing = ref(false)

function rollInitiative(): void {
  store.rollInitiative(rollMode.value)
  initiativePulsing.value = false
  requestAnimationFrame(() => {
    initiativePulsing.value = true
  })
}

function onInitiativeInput(e: Event): void {
  const raw = (e.target as HTMLInputElement).value
  store.setInitiative(raw === '' ? null : Number(raw))
}

const initiativeBreakdown = computed(() => {
  const r = store.lastInitiativeRoll
  if (!r) return ''
  const dice = r.rolls.length > 1 ? `d20 (${r.rolls.join(', ')}) → ${r.kept}` : `d20 ${r.kept}`
  const mod = r.mod === 0 ? '' : ` ${r.mod > 0 ? '+' : '−'} ${Math.abs(r.mod)}`
  return `${dice}${mod} = ${r.total}`
})

/** Re-triggers the CSS pulse on restored values after each rest or undo. */
const pulsing = ref(false)
watch(
  () => store.lastRestAt,
  () => {
    pulsing.value = false
    requestAnimationFrame(() => {
      pulsing.value = true
    })
  },
)
</script>

<template>
  <section class="flex flex-col gap-6">
    <h3
      class="font-headline-md text-headline-md text-primary border-b border-primary-container pb-2 select-none"
    >
      Combat Vitals
    </h3>
    <div class="grid grid-cols-2 gap-4">
      <!-- AC Card -->
      <ElevatedCard :elevation="2">
        <div
          class="rounded-lg p-4 flex flex-col items-center justify-center relative overflow-hidden group"
        >
          <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          <span
            class="material-symbols-outlined text-4xl text-tertiary mb-2 relative z-10"
            style="font-variation-settings: 'FILL' 1"
             aria-hidden="true">shield</span
          >
          <span
            class="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider relative z-10 select-none"
            >Armor Class</span
          >
          <div class="font-headline-lg text-headline-lg text-on-surface mt-1 relative z-10 font-bold">
            <input
              v-if="store.isEditing && store.currentCharacterData.combat.isAcOverride"
              v-model.number="store.currentCharacterData.combat.ac"
              type="number"
              class="w-16 bg-transparent border-none focus:ring-0 text-center font-headline-lg text-headline-lg text-on-surface font-bold p-0"
            />
            <span v-else>
              {{ store.computedArmorClass }}
            </span>
          </div>
          <label
            class="relative z-10 mt-2 inline-flex items-center gap-2 cursor-pointer font-body-sm text-body-sm text-on-surface-variant select-none"
          >
            <input
              v-model="store.currentCharacterData.combat.isAcOverride"
              type="checkbox"
              class="form-checkbox h-4 w-4 rounded border-outline-variant bg-surface-container text-primary focus:ring-primary"
            />
            <span>Override AC</span>
          </label>
        </div>
      </ElevatedCard>

      <!-- HP Card -->
      <ElevatedCard :elevation="2">
        <div
          class="rounded-lg p-4 flex flex-col justify-between"
        >
          <div class="flex justify-between items-center mb-2">
            <span
              class="font-label-md text-label-md text-on-surface-variant uppercase flex items-center gap-1 select-none"
              ><span class="material-symbols-outlined text-sm" aria-hidden="true">favorite</span> HP</span
            >
          </div>
          <div class="flex items-end gap-2 border-b border-surface-variant pb-2 mb-2">
            <input
              class="w-16 bg-transparent border-none text-right font-headline-lg text-headline-lg text-on-surface p-0 focus:ring-0"
              :class="{ 'rest-pulse': pulsing }"
              type="number"
              min="0"
              aria-label="Current hit points"
              data-testid="hp-current"
              v-model.number="store.currentCharacterData.combat.hp_current"
              @input="clampCurrentHp()"
            />
            <span class="font-body-md text-body-md text-on-surface-variant pb-1 whitespace-nowrap select-none"
              >/ {{ progression.maxHp }}</span
            >
          </div>
          <div class="flex justify-between items-center">
            <span class="font-label-md text-label-md text-on-surface-variant select-none">Temp</span>
            <input
              v-model.number="store.currentCharacterData.combat.hp_temp"
              :class="{ 'rest-pulse': pulsing }"
              class="w-12 bg-surface-container rounded border border-outline-variant text-center font-body-md text-on-surface p-1 focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="0"
              type="number"
              inputmode="numeric"
              min="0"
              aria-label="Temporary hit points"
            />
          </div>
          <div class="mt-3 flex items-center gap-1">
            <input
              v-model.number="amount"
              type="number"
              inputmode="numeric"
              min="1"
              placeholder="0"
              aria-label="Damage or healing amount"
              data-testid="hp-amount"
              class="min-h-11 w-0 min-w-0 flex-1 bg-surface-container rounded border border-outline-variant text-center font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
              @keydown.enter="applyAmount('damage')"
            />
            <IconButton icon="heart_minus" label="Damage" variant="danger" data-testid="hp-damage" @click="applyAmount('damage')" />
            <IconButton icon="heart_plus" label="Heal" data-testid="hp-heal" @click="applyAmount('heal')" />
          </div>
          <div
            v-if="isDowned && store.currentCharacterData.combat.death_saves"
            class="mt-3 flex flex-col gap-1 border-t border-surface-variant pt-2"
            data-testid="death-saves"
          >
            <span class="font-label-md text-label-md text-error uppercase select-none">Downed — Death Saves</span>
            <div class="flex items-center justify-between gap-2">
              <span class="font-label-md text-label-md text-on-surface-variant">Successes</span>
              <UsageTracker v-model="store.currentCharacterData.combat.death_saves.successes" :total="3" label="Death save successes" />
            </div>
            <div class="flex items-center justify-between gap-2">
              <span class="font-label-md text-label-md text-on-surface-variant">Failures</span>
              <UsageTracker v-model="store.currentCharacterData.combat.death_saves.failures" :total="3" label="Death save failures" />
            </div>
          </div>
        </div>
      </ElevatedCard>

      <!-- Hit Dice -->
      <ElevatedCard :elevation="1" class="col-span-2 sm:col-span-1">
        <div
          class="rounded-lg p-4 flex flex-col items-center justify-center"
        >
          <span
            class="font-label-md text-label-md text-on-surface-variant uppercase mb-2 flex items-center gap-1 select-none"
            ><span class="material-symbols-outlined text-sm" aria-hidden="true">casino</span> Hit Dice</span
          >
          <div class="flex items-center gap-3">
            <div
              class="font-headline-md text-headline-md text-on-surface"
              :class="{ 'rest-pulse': pulsing }"
              data-testid="hit-dice-pool"
            >
              {{ hitDiceRemaining }}<span class="text-on-surface-variant text-lg">/{{ hitDiceTotal }}d{{ hitDie }}</span>
            </div>
          </div>
        </div>
      </ElevatedCard>

      <ElevatedCard :elevation="1" class="col-span-2 sm:col-span-1">
        <div
          class="rounded p-3 flex flex-col items-center justify-center h-full"
        >
          <span class="font-label-md text-label-md text-on-surface-variant text-[10px] uppercase select-none"
            >Speed</span
          >
          <input
            v-if="store.isEditing"
            v-model="store.currentCharacterData.combat.speed"
            class="w-full bg-transparent border-b border-surface-variant focus:border-tertiary focus:ring-0 text-center font-headline-md text-on-surface p-0 pb-1"
          />
          <span v-else class="font-headline-md text-headline-md text-on-surface">
            <template
              v-for="(part, i) in store.currentCharacterData.combat.speed.split(/(ft)/)"
              :key="i"
            >
              <span v-if="part === 'ft'" class="text-base">ft</span>
              <template v-else>{{ part }}</template>
            </template>
          </span>
        </div>
      </ElevatedCard>

      <!-- Initiative -->
      <ElevatedCard :elevation="1" class="col-span-2">
        <div class="rounded p-3 flex flex-col items-center gap-2">
          <span class="font-label-md text-label-md text-on-surface-variant text-[10px] uppercase select-none"
            >Initiative</span
          >
          <div class="flex items-center gap-3">
            <input
              :value="store.currentCharacterData.combat.initiative ?? ''"
              :class="{ 'rest-pulse': initiativePulsing }"
              type="number"
              inputmode="numeric"
              placeholder="—"
              aria-label="Initiative"
              data-testid="initiative-value"
              class="w-20 bg-transparent border-b border-surface-variant focus:border-tertiary focus:ring-0 text-center font-headline-md text-headline-md text-on-surface p-0 pb-1"
              @change="onInitiativeInput"
            />
            <span class="font-body-md text-body-md text-on-surface-variant select-none" data-testid="initiative-mod"
              >{{ initiativeMod >= 0 ? '+' : '' }}{{ initiativeMod }} mod</span
            >
            <IconButton icon="casino" label="Roll initiative" data-testid="initiative-roll" @click="rollInitiative" />
          </div>
          <div class="flex gap-1" role="radiogroup" aria-label="Initiative roll mode">
            <button
              v-for="m in rollModes"
              :key="m.value"
              type="button"
              role="radio"
              :aria-checked="rollMode === m.value"
              :data-testid="`initiative-mode-${m.value}`"
              class="min-h-9 px-3 rounded border font-label-md text-label-md select-none"
              :class="rollMode === m.value ? 'bg-primary-container text-primary border-primary' : 'border-outline-variant text-on-surface-variant'"
              @click="rollMode = m.value"
            >
              {{ m.label }}
            </button>
          </div>
          <p class="font-body-sm text-body-sm text-on-surface-variant min-h-5" aria-live="polite" data-testid="initiative-breakdown">
            {{ initiativeBreakdown }}
          </p>
        </div>
      </ElevatedCard>
    </div>
    <RestActions />
  </section>
</template>
