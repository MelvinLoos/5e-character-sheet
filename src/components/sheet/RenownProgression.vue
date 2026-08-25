<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'

const store = useCharacterStore()

interface MilestoneData {
  tier: number
  maxMilestones: number
  title: string
  label: string
}

const renownMilestones: MilestoneData[] = [
  { tier: 1, maxMilestones: 3, title: 'Tier 1 Aspirant', label: 'Progress to Tier 2' },
  { tier: 2, maxMilestones: 4, title: 'Tier 2 Adept', label: 'Progress to Tier 3' },
  { tier: 3, maxMilestones: 5, title: 'Tier 3 Luminary', label: 'Progress to Tier 4' },
  { tier: 4, maxMilestones: 0, title: 'Tier 4 Paragon', label: 'Max Tier Reached' },
]

function getMilestoneData(): MilestoneData {
  const currentTier = store.currentCharacterData?.renownTier || 1
  return renownMilestones.find((m) => m.tier === currentTier) || renownMilestones[0]!
}

function incrementMilestones() {
  if (!store.isEditing || !store.currentCharacterData) return

  const currentData = getMilestoneData()
  let milestones = store.currentCharacterData.renownMilestones || 0
  const tier = store.currentCharacterData.renownTier || 1

  if (tier >= 4) return

  milestones++

  if (milestones >= currentData.maxMilestones) {
    if (tier < 4) {
      store.currentCharacterData.renownTier = tier + 1
      store.currentCharacterData.renownMilestones = 0
    }
  } else {
    store.currentCharacterData.renownMilestones = milestones
  }
}

function getProgressText(data: MilestoneData, milestones: number) {
  if (data.tier >= 4) return 'Maximum Renown Achieved'
  const left = data.maxMilestones - milestones
  return `Complete ${left} more major scholarly contribution${left > 1 ? 's' : ''} to ascend to the next Tier.`
}
</script>

<template>
  <section
    class="bg-surface-container-highest rounded-lg p-6 border border-outline-variant shadow-sm"
  >
    <div class="flex justify-between items-center border-b border-primary-container pb-3 mb-6">
      <h3 class="font-headline-md text-headline-md text-primary flex items-center gap-2">
        <span class="material-symbols-outlined">military_tech</span> Progression<InfoButton topic="renown-system" />
      </h3>
      <div class="flex flex-col items-end">
        <span class="font-label-md text-label-md text-tertiary uppercase tracking-widest">
          {{ getMilestoneData().title }}
        </span>
        <span class="text-[10px] font-body-md text-on-surface-variant italic">
          {{ getMilestoneData().label }}
        </span>
      </div>
    </div>
    <div class="max-w-2xl mx-auto w-full">
      <div class="flex justify-between items-center mb-4">
        <span class="font-label-md text-label-md text-on-surface-variant uppercase"
          >Great Works Completed</span
        >
        <span
          v-if="getMilestoneData().tier < 4"
          class="font-headline-md text-headline-md text-tertiary"
        >
          {{ store.currentCharacterData?.renownMilestones || 0 }} /
          {{ getMilestoneData().maxMilestones }}
        </span>
        <span v-else class="font-headline-md text-headline-md text-tertiary">MAX</span>
      </div>

      <div v-if="getMilestoneData().tier < 4" class="flex gap-4 mb-4">
        <div
          v-for="i in getMilestoneData().maxMilestones"
          :key="i"
          @click="store.isEditing ? incrementMilestones() : null"
          class="flex-1 h-4 rounded-full relative group transition-colors cursor-pointer"
          :class="[
            (store.currentCharacterData?.renownMilestones || 0) >= i
              ? 'bg-tertiary border border-tertiary shadow-[0_0_10px_rgba(234,194,73,0.3)]'
              : 'bg-surface-container border border-outline-variant hover:border-tertiary/50',
          ]"
        >
          <div
            class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span
              class="text-[8px] uppercase font-bold"
              :class="
                (store.currentCharacterData?.renownMilestones || 0) >= i
                  ? 'text-on-tertiary'
                  : 'text-on-surface-variant'
              "
            >
              Milestone {{ i }}
            </span>
          </div>
        </div>
      </div>

      <p class="text-center text-sm font-body-md text-on-surface-variant italic">
        {{ getProgressText(getMilestoneData(), store.currentCharacterData?.renownMilestones || 0) }}
      </p>
    </div>
  </section>
</template>
