<script setup lang="ts">
/**
 * ConcentrationTracker — the "concentrating on …" banner and spell picker.
 *
 * Rendered in the Combat Vitals and at the top of the Spells view. Concentration
 * is a *marker*, not casting automation: it records which spell is active, warns
 * before replacing one, surfaces the CON save DC after damage, and clears itself
 * when the character drops to 0 HP or takes a long rest (see `spellStore`).
 */
import { computed, ref } from 'vue'
import { useSpellStore } from '@/stores/spellStore'
import { useConfirm } from '@/composables/useConfirm'
import { formatLevel } from '@/domain'
import ElevatedCard from '@/components/ui/ElevatedCard.vue'
import IconButton from '@/components/ui/IconButton.vue'
import PressableButton from '@/components/ui/PressableButton.vue'
import type { CharacterSpell } from '@/types/character'

const spellStore = useSpellStore()
const { confirm } = useConfirm()

/** Currently highlighted picker entry ('' = nothing chosen yet). */
const selectedId = ref('')

/** Stable key for a spell: its id, falling back to the name for id-less spells. */
function spellKey(spell: CharacterSpell): string {
  return spell.id ?? spell.name
}

const candidates = computed(() => spellStore.concentrationSpells)

/** Start concentrating, confirming first if it would replace an active effect. */
async function startConcentration(): Promise<void> {
  const spell = candidates.value.find((s) => spellKey(s) === selectedId.value)
  if (!spell) return

  const active = spellStore.activeConcentration
  if (active && active.spellName !== spell.name) {
    const ok = await confirm({
      title: 'Replace concentration?',
      message: `You are already concentrating on ${active.spellName}. Concentrating on ${spell.name} ends it.`,
      confirmLabel: 'Replace',
      danger: true,
    })
    if (!ok) return
  }

  spellStore.startConcentration(spell)
  selectedId.value = ''
}
</script>

<template>
  <ElevatedCard
    v-if="spellStore.activeConcentration || candidates.length"
    :elevation="1"
    class="w-full"
    data-testid="concentration-tracker"
  >
    <div class="rounded p-3 flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <span
          class="font-label-md text-label-md text-on-surface-variant uppercase flex items-center gap-1 select-none"
        >
          <span class="material-symbols-outlined text-sm" aria-hidden="true">psychology</span>
          Concentration
        </span>
      </div>

      <!-- Active banner -->
      <div
        v-if="spellStore.activeConcentration"
        data-testid="concentration-banner"
        class="flex items-center justify-between gap-3 rounded border border-tertiary/40 bg-tertiary/10 px-3 py-2"
      >
        <span class="font-body-md text-body-md text-on-surface">
          Concentrating on
          <strong class="text-tertiary" data-testid="concentration-name">{{
            spellStore.activeConcentration.spellName
          }}</strong>
          <span
            v-if="spellStore.activeConcentration.level !== undefined"
            class="text-on-surface-variant"
          >
            ({{ formatLevel(spellStore.activeConcentration.level) }})
          </span>
        </span>
        <PressableButton
          variant="ghost"
          size="sm"
          data-testid="concentration-end"
          @click="spellStore.endConcentration()"
        >
          End
        </PressableButton>
      </div>

      <!-- CON save reminder after taking damage -->
      <div
        v-if="spellStore.lastConcentrationCheck !== null"
        data-testid="concentration-dc"
        class="flex items-center justify-between gap-2 rounded border border-error/40 bg-error/10 px-3 py-2"
      >
        <span class="font-body-sm text-body-sm text-on-surface">
          Concentration check — CON save DC
          <strong data-testid="concentration-dc-value">{{ spellStore.lastConcentrationCheck }}</strong>
        </span>
        <IconButton
          icon="close"
          size="sm"
          label="Dismiss concentration reminder"
          @click="spellStore.clearConcentrationCheck()"
        />
      </div>

      <!-- Picker (only concentration spells from the spellbook) -->
      <div v-if="candidates.length" class="flex items-center gap-2">
        <select
          v-model="selectedId"
          data-testid="concentration-select"
          aria-label="Concentrate on a spell"
          class="min-h-11 flex-1 rounded border border-outline-variant bg-surface-container px-2 text-on-surface"
        >
          <option value="" disabled>Choose a spell…</option>
          <option v-for="spell in candidates" :key="spellKey(spell)" :value="spellKey(spell)">
            {{ spell.name }}{{ spell.level ? ` (L${spell.level})` : '' }}
          </option>
        </select>
        <PressableButton
          variant="secondary"
          :disabled="!selectedId"
          data-testid="concentration-start"
          @click="startConcentration"
        >
          Concentrate
        </PressableButton>
      </div>
    </div>
  </ElevatedCard>
</template>
