<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCharacterStore } from '@/stores/character'
import { EQUIPMENT_CATALOG } from '@/data/equipment-items'
import { CLASS_BUNDLES, BACKGROUND_EQUIPMENT, CLASS_FOCUS_MAP } from '@/data/equipment-bundles'
import {
  getClassBundle,
  getBackgroundEquipment,
  getTrinketList,
  calculateTotalGold,
} from '@/utils/equipmentResolver'
import type { ClassEquipmentBundle, BackgroundEquipment, EquipmentChoice, EquipmentOption } from '@/types/equipment'

const store = useCharacterStore()

// ──── Wizard Step Tracking ────
const currentStep = ref(1)

// Step 1: Class Option Selection
const selectedClassOption = ref<'A' | 'B' | 'C' | null>(null)

// Step 2: Class Equipment Choices (if bundle has choices[])
const choiceSelections = ref<Record<number, string>>({})  // choiceIndex → itemId

// Step 3: Background Option Selection
const selectedBackgroundOption = ref<'A' | 'B' | null>(null)

// Step 4: Trinket Selection
const selectedTrinketId = ref<string | null>(null)

// Completion flag
const isComplete = ref(false)

// ──── Computed Data ────
const className = computed(() => store.currentCharacterData.class)
const backgroundName = computed(() => store.currentCharacterData.background)

const hasClassAndBg = computed(() => {
  return !!className.value && !!backgroundName.value
})

const noEquipmentYet = computed(() => {
  return (
    store.currentCharacterData.equippedGear.length === 0 &&
    store.currentCharacterData.consumables.length === 0
  )
})

const showWizard = computed(() => {
  return (
    hasClassAndBg.value &&
    store.currentCharacterData.equippedGear.length === 0 &&
    store.currentCharacterData.consumables.length === 0 &&
    store.currentCharacterData.gold === 0 &&
    !isComplete.value
  )
})

// Class bundles for current class
const classBundles = computed(() => {
  if (!className.value) return null
  return CLASS_BUNDLES[className.value] ?? null
})

const bundleA = computed(() => classBundles.value?.optionA ?? null)
const bundleB = computed(() => classBundles.value?.optionB ?? null)
const bundleC = computed(() => classBundles.value?.optionC ?? null)

// Current selected class bundle
const selectedBundle = computed<ClassEquipmentBundle | null>(() => {
  if (!selectedClassOption.value || !className.value) return null
  return getClassBundle(className.value, selectedClassOption.value)
})

// Background equipment
const bgEquipment = computed<BackgroundEquipment | null>(() => {
  if (!backgroundName.value) return null
  return getBackgroundEquipment(backgroundName.value)
})

const showTrinketStep = computed(() => {
  return bgEquipment.value?.trinket === true
})

const trinketList = computed(() => getTrinketList())

// Gold preview
const goldPreview = computed(() => {
  if (!selectedClassOption.value || !backgroundName.value || !selectedBackgroundOption.value) return null
  return calculateTotalGold(
    selectedClassOption.value,
    className.value!,
    selectedBackgroundOption.value,
    bgEquipment.value,
  )
})

// Focus information
const focusType = computed(() => {
  if (!className.value) return null
  return CLASS_FOCUS_MAP[className.value] ?? null
})

// ──── Actions ────

function selectClassOption(option: 'A' | 'B' | 'C') {
  selectedClassOption.value = option
  store.selectClassEquipmentOption(option)
}

function goToStep2() {
  if (!selectedClassOption.value) return

  // If the bundle has equipment choices, go to step 2. Otherwise go to step 3 (background).
  if (selectedBundle.value?.choices && selectedBundle.value.choices.length > 0) {
    currentStep.value = 2
  } else {
    currentStep.value = 3
  }
}

function resolveChoice(choiceIndex: number, itemId: string, quantity: number) {
  choiceSelections.value[choiceIndex] = itemId
  store.resolveEquipmentChoice(choiceIndex, itemId, quantity)
}

function goToBackgroundStep() {
  // Check for unresolved choices
  const bundle = selectedBundle.value
  if (bundle?.choices) {
    for (let i = 0; i < bundle.choices.length; i++) {
      if (!choiceSelections.value[i]) return // can't proceed
    }
  }
  currentStep.value = 3
}

function selectBackgroundOption(option: 'A' | 'B') {
  selectedBackgroundOption.value = option
  store.selectBackgroundEquipmentOption(option)
}

function goToTrinketOrPreview() {
  if (!selectedBackgroundOption.value) return
  currentStep.value = showTrinketStep.value ? 4 : 5
}

function selectTrinket(trinketId: string) {
  selectedTrinketId.value = trinketId
  store.selectTrinket(trinketId)
}

function goToPreview() {
  if (showTrinketStep.value && !selectedTrinketId.value) return
  currentStep.value = 5
}

function confirmEquipment() {
  store.confirmStartingEquipment()
  isComplete.value = true
  store.resetStartingEquipment()
}

function resetWizard() {
  selectedClassOption.value = null
  selectedBackgroundOption.value = null
  choiceSelections.value = {}
  selectedTrinketId.value = null
  isComplete.value = false
  currentStep.value = 1
  store.resetStartingEquipment()
}

// ──── Helpers for Rendering ────

function getItemDetail(itemId: string): { name: string; mastery?: string; dmgDie?: string; dmgType?: string; desc?: string } {
  const item = EQUIPMENT_CATALOG[itemId]
  if (!item) return { name: itemId }
  const result: ReturnType<typeof getItemDetail> = { name: item.name }
  if (item.weapon) {
    result.mastery = item.weapon.mastery
    result.dmgDie = item.weapon.damageDie
    result.dmgType = item.weapon.damageType
  }
  if (item.armor) {
    result.desc = `AC ${item.armor.baseAc}` + (item.armor.stealthDisadvantage ? ' (Stealth Disadv.)' : '')
  }
  return result
}

function formatChoiceOption(opt: EquipmentOption): string {
  const detail = getItemDetail(opt.itemId)
  let text = `${detail.name}${opt.quantity > 1 ? ` (×${opt.quantity})` : ''}`
  if (detail.mastery) text += ` — ${detail.mastery}`
  if (detail.dmgDie) text += `, ${detail.dmgDie} ${detail.dmgType ?? ''}`
  return text
}

const masteryDescriptions: Record<string, string> = {
  'Graze': 'Deal ability modifier damage on a miss',
  'Nick': 'Bonus action attack without using a Bonus Action',
  'Push': 'Push target up to 10 ft.',
  'Sap': 'Target has Disadvantage on next attack',
  'Slow': 'Reduce target speed by 10 ft.',
  'Topple': 'Target must save or fall Prone',
  'Vex': 'Gain Advantage on your next attack vs target',
  'Cleave': 'Deal damage to another target within 5 ft.',
}
</script>

<template>
  <div v-if="showWizard" class="flex flex-col gap-6 w-full max-w-5xl mx-auto">
    <!-- Header -->
    <header class="mb-4 border-b border-surface-variant pb-4">
      <h2 class="font-display-lg text-display-lg text-tertiary">Starting Equipment</h2>
      <p class="font-body-lg text-body-lg text-on-surface-variant mt-2">
        Choose how your {{ className }} acquired their gear.
      </p>
    </header>

    <!-- Progress Steps -->
    <div class="flex items-center justify-center gap-2 mb-6">
      <div
        v-for="step in 5"
        :key="step"
        class="flex items-center gap-2"
      >
        <div
          :class="[
            'w-8 h-8 rounded-full flex items-center justify-center font-label-md text-label-md border',
            currentStep >= step
              ? 'bg-tertiary text-on-tertiary border-tertiary'
              : 'bg-surface-container text-on-surface-variant border-outline-variant',
          ]"
        >
          {{ currentStep > step ? '✓' : step }}
        </div>
        <div v-if="step < 5" class="w-6 h-px" :class="currentStep > step ? 'bg-tertiary' : 'bg-outline-variant'"></div>
      </div>
    </div>

    <!-- ═══ STEP 1: Class Equipment Options (A/B/C) ═══ -->
    <section v-if="currentStep === 1 && classBundles" class="flex flex-col gap-6">
      <h3 class="font-headline-md text-headline-md text-on-surface">
        Step 1: Choose Your Class Equipment
        <span class="font-body-md text-body-md text-on-surface-variant ml-2">— {{ className }} Options</span>
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Option A -->
        <div
          v-if="bundleA"
          @click="selectClassOption('A')"
          :class="[
            'cursor-pointer rounded-lg border-2 p-5 transition-all hover:shadow-lg',
            selectedClassOption === 'A'
              ? 'border-tertiary bg-tertiary-container/20'
              : 'border-outline-variant bg-surface-container hover:border-tertiary/50',
          ]"
        >
          <div class="flex items-center gap-2 mb-3">
            <span class="font-headline-lg text-headline-lg text-tertiary">A</span>
            <span class="font-label-md text-label-md text-on-surface">Item Bundle</span>
          </div>
          <p class="font-body-md text-body-md text-on-surface-variant mb-3">{{ bundleA.description }}</p>
          <ul class="space-y-1 text-sm text-on-surface">
            <li v-for="item in bundleA.items" :key="item.itemId" class="flex items-start gap-1">
              <span class="text-tertiary mt-0.5">•</span>
              <span>
                {{ getItemDetail(item.itemId).name }}<template v-if="item.quantity > 1"> (×{{ item.quantity }})</template>
                <span v-if="getItemDetail(item.itemId).mastery" class="text-tertiary font-bold ml-1">[{{ getItemDetail(item.itemId).mastery }}]</span>
              </span>
            </li>
          </ul>
          <p class="mt-3 font-label-sm text-label-sm text-on-surface-variant">⚡ +0 GP from class</p>
        </div>

        <!-- Option B -->
        <div
          v-if="bundleB"
          @click="selectClassOption('B')"
          :class="[
            'cursor-pointer rounded-lg border-2 p-5 transition-all hover:shadow-lg',
            selectedClassOption === 'B'
              ? 'border-tertiary bg-tertiary-container/20'
              : 'border-outline-variant bg-surface-container hover:border-tertiary/50',
          ]"
        >
          <div class="flex items-center gap-2 mb-3">
            <span class="font-headline-lg text-headline-lg text-tertiary">B</span>
            <span class="font-label-md text-label-md text-on-surface">Item Bundle</span>
          </div>
          <p class="font-body-md text-body-md text-on-surface-variant mb-3">{{ bundleB.description }}</p>
          <ul class="space-y-1 text-sm text-on-surface">
            <li v-for="item in bundleB.items" :key="item.itemId" class="flex items-start gap-1">
              <span class="text-tertiary mt-0.5">•</span>
              <span>
                {{ getItemDetail(item.itemId).name }}<template v-if="item.quantity > 1"> (×{{ item.quantity }})</template>
                <span v-if="getItemDetail(item.itemId).mastery" class="text-tertiary font-bold ml-1">[{{ getItemDetail(item.itemId).mastery }}]</span>
              </span>
            </li>
          </ul>
          <p class="mt-3 font-label-sm text-label-sm text-on-surface-variant">⚡ +0 GP from class</p>
        </div>

        <!-- Option C -->
        <div
          v-if="bundleC"
          @click="selectClassOption('C')"
          :class="[
            'cursor-pointer rounded-lg border-2 p-5 transition-all hover:shadow-lg',
            selectedClassOption === 'C'
              ? 'border-tertiary bg-tertiary-container/20'
              : 'border-outline-variant bg-surface-container hover:border-tertiary/50',
          ]"
        >
          <div class="flex items-center gap-2 mb-3">
            <span class="font-headline-lg text-headline-lg text-tertiary">C</span>
            <span class="font-label-md text-label-md text-on-surface">Gold Buyout</span>
          </div>
          <p class="font-body-md text-body-md text-on-surface-variant mb-3">
            {{ bundleC.goldBuyout?.description ?? 'Gold buyout' }}
          </p>
          <div class="text-center py-4">
            <span class="font-display-lg text-display-lg text-tertiary">{{ bundleC.goldBuyout?.flatAmount }}</span>
            <span class="font-headline-md text-headline-md text-on-surface-variant ml-2">GP</span>
          </div>
          <p class="font-label-sm text-label-sm text-on-surface">Purchase your own weapons, armor, and gear</p>
          <p class="mt-2 font-label-sm text-label-sm text-on-surface-variant">⚡ +{{ bundleC.goldBuyout?.flatAmount }} GP from class</p>
        </div>
      </div>

      <div class="flex justify-end mt-4">
        <button
          @click="goToStep2"
          :disabled="!selectedClassOption"
          class="px-6 py-2 rounded font-label-md text-label-md bg-tertiary text-on-tertiary hover:bg-tertiary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue →
        </button>
      </div>
    </section>

    <!-- ═══ STEP 2: Class Equipment Choices ═══ -->
    <section v-if="currentStep === 2 && selectedBundle?.choices" class="flex flex-col gap-6">
      <h3 class="font-headline-md text-headline-md text-on-surface">
        Step 2: Make Your Equipment Choices
      </h3>

      <div
        v-for="(choice, choiceIndex) in selectedBundle.choices"
        :key="choiceIndex"
        class="bg-surface-container rounded-lg border border-outline-variant p-5"
      >
        <p class="font-label-lg text-label-lg text-on-surface mb-3">
          Pick {{ choice.pick }}:
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            v-for="opt in choice.options"
            :key="opt.itemId"
            @click="resolveChoice(choiceIndex, opt.itemId, opt.quantity)"
            :class="[
              'cursor-pointer rounded-lg border p-4 transition-all hover:shadow',
              choiceSelections[choiceIndex] === opt.itemId
                ? 'border-tertiary bg-tertiary-container/20'
                : 'border-outline-variant hover:border-tertiary/50 bg-surface-container-high',
            ]"
          >
            <p class="font-headline-sm text-headline-sm text-on-surface">
              {{ getItemDetail(opt.itemId).name }}
              <span v-if="opt.quantity > 1">(×{{ opt.quantity }})</span>
            </p>
            <p
              v-if="getItemDetail(opt.itemId).mastery"
              class="inline-block mt-1 px-2 py-0.5 rounded font-label-sm text-label-sm bg-tertiary/10 text-tertiary border border-tertiary/30"
            >
              {{ getItemDetail(opt.itemId).mastery }}
              <span class="text-on-surface-variant ml-1">— {{ masteryDescriptions[getItemDetail(opt.itemId).mastery!] ?? 'Mastery property' }}</span>
            </p>
            <p v-if="getItemDetail(opt.itemId).dmgDie" class="font-body-sm text-body-sm text-on-surface-variant mt-1">
              {{ getItemDetail(opt.itemId).dmgDie }} {{ getItemDetail(opt.itemId).dmgType }}
            </p>
            <p v-if="getItemDetail(opt.itemId).desc" class="font-body-sm text-body-sm text-on-surface-variant mt-1">
              {{ getItemDetail(opt.itemId).desc }}
            </p>
          </div>
        </div>
      </div>

      <div class="flex justify-between mt-4">
        <button
          @click="currentStep = 1"
          class="px-4 py-2 rounded font-label-md text-label-md bg-surface-variant text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          ← Back
        </button>
        <button
          @click="goToBackgroundStep"
          class="px-6 py-2 rounded font-label-md text-label-md bg-tertiary text-on-tertiary hover:bg-tertiary/90 transition-colors"
        >
          Continue →
        </button>
      </div>
    </section>

    <!-- ═══ STEP 3: Background Equipment Options (A/B) ═══ -->
    <section v-if="currentStep === 3 && bgEquipment" class="flex flex-col gap-6">
      <h3 class="font-headline-md text-headline-md text-on-surface">
        Step 3: Choose Your Background Equipment
        <span class="font-body-md text-body-md text-on-surface-variant ml-2">— {{ backgroundName }} Options</span>
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- Background Option A -->
        <div
          @click="selectBackgroundOption('A')"
          :class="[
            'cursor-pointer rounded-lg border-2 p-5 transition-all hover:shadow-lg',
            selectedBackgroundOption === 'A'
              ? 'border-tertiary bg-tertiary-container/20'
              : 'border-outline-variant bg-surface-container hover:border-tertiary/50',
          ]"
        >
          <div class="flex items-center gap-2 mb-3">
            <span class="font-headline-lg text-headline-lg text-tertiary">A</span>
            <span class="font-label-md text-label-md text-on-surface">Thematic Gear</span>
          </div>
          <p class="font-body-sm text-body-sm text-on-surface-variant mb-3">Background items + small coin pouch</p>
          <ul class="space-y-1 text-sm text-on-surface">
            <li v-for="item in bgEquipment.optionA.items" :key="item.itemId" class="flex items-start gap-1">
              <span class="text-tertiary mt-0.5">•</span>
              <span>{{ getItemDetail(item.itemId).name }}<template v-if="item.quantity > 1"> (×{{ item.quantity }})</template></span>
            </li>
          </ul>
          <p class="mt-3 font-label-sm text-label-sm text-on-surface-variant">
            ⚡ +{{ bgEquipment.optionA.currency.gp }} GP from background
            <template v-if="bgEquipment.optionA.currency.sp"> (+{{ bgEquipment.optionA.currency.sp }} SP)</template>
          </p>
          <p v-if="bgEquipment.trinket" class="mt-1 font-label-sm text-label-sm text-tertiary">🎲 Grants a trinket selection</p>
        </div>

        <!-- Background Option B -->
        <div
          @click="selectBackgroundOption('B')"
          :class="[
            'cursor-pointer rounded-lg border-2 p-5 transition-all hover:shadow-lg',
            selectedBackgroundOption === 'B'
              ? 'border-tertiary bg-tertiary-container/20'
              : 'border-outline-variant bg-surface-container hover:border-tertiary/50',
          ]"
        >
          <div class="flex items-center gap-2 mb-3">
            <span class="font-headline-lg text-headline-lg text-tertiary">B</span>
            <span class="font-label-md text-label-md text-on-surface">Gold Stipend</span>
          </div>
          <p class="font-body-md text-body-md text-on-surface-variant mb-3">{{ bgEquipment.optionB.description }}</p>
          <div class="text-center py-4">
            <span class="font-display-lg text-display-lg text-tertiary">50</span>
            <span class="font-headline-md text-headline-md text-on-surface-variant ml-2">GP</span>
          </div>
          <p class="font-label-sm text-label-sm text-on-surface">Purchase your own gear</p>
          <p class="mt-2 font-label-sm text-label-sm text-on-surface-variant">⚡ +50 GP from background</p>
        </div>
      </div>

      <div class="flex justify-between mt-4">
        <button
          @click="currentStep = selectedBundle?.choices?.length ? 2 : 1"
          class="px-4 py-2 rounded font-label-md text-label-md bg-surface-variant text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          ← Back
        </button>
        <button
          @click="goToTrinketOrPreview"
          :disabled="!selectedBackgroundOption"
          class="px-6 py-2 rounded font-label-md text-label-md bg-tertiary text-on-tertiary hover:bg-tertiary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue →
        </button>
      </div>
    </section>

    <!-- ═══ STEP 4: Trinket Selection ═══ -->
    <section v-if="currentStep === 4 && showTrinketStep" class="flex flex-col gap-6">
      <h3 class="font-headline-md text-headline-md text-on-surface">
        Step 4: Choose One Tiny Trinket
      </h3>
      <p class="font-body-md text-body-md text-on-surface-variant">
        Your background grants you one free trinket. Choose from the list below:
      </p>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2">
        <div
          v-for="trinket in trinketList"
          :key="trinket.id"
          @click="selectTrinket(trinket.id)"
          :class="[
            'cursor-pointer rounded-lg border p-3 transition-all hover:shadow text-sm',
            selectedTrinketId === trinket.id
              ? 'border-tertiary bg-tertiary-container/20'
              : 'border-outline-variant hover:border-tertiary/50 bg-surface-container-high',
          ]"
        >
          {{ trinket.name }}
        </div>
      </div>

      <p v-if="selectedTrinketId" class="font-label-md text-label-md text-tertiary">
        Selected: {{ trinketList.find(t => t.id === selectedTrinketId)?.name }}
      </p>

      <div class="flex justify-between mt-4">
        <button
          @click="currentStep = 3"
          class="px-4 py-2 rounded font-label-md text-label-md bg-surface-variant text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          ← Back
        </button>
        <button
          @click="goToPreview"
          :disabled="!selectedTrinketId"
          class="px-6 py-2 rounded font-label-md text-label-md bg-tertiary text-on-tertiary hover:bg-tertiary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue →
        </button>
      </div>
    </section>

    <!-- ═══ STEP 5: Equipment Summary & Confirm ═══ -->
    <section v-if="currentStep === 5" class="flex flex-col gap-6">
      <h3 class="font-headline-md text-headline-md text-on-surface">
        Equipment Summary
      </h3>

      <div class="bg-surface-container rounded-lg border border-outline-variant p-6 space-y-4">
        <!-- Class Source -->
        <div>
          <h4 class="font-label-lg text-label-lg text-tertiary mb-2">
            CLASS ({{ className }}) —
            <span v-if="selectedClassOption !== 'C'">Option {{ selectedClassOption }} — Items</span>
            <span v-else>Option C — Gold Buyout</span>
            <span class="text-on-surface-variant ml-2">⚡ +{{ selectedClassOption === 'C' ? (bundleC?.goldBuyout?.flatAmount ?? 0) : 0 }} GP</span>
          </h4>
          <template v-if="selectedClassOption !== 'C' && selectedBundle?.items">
            <ul class="space-y-0.5 text-sm text-on-surface ml-4">
              <li v-for="item in selectedBundle.items" :key="item.itemId" class="flex items-start gap-1">
                <span class="text-tertiary">•</span>
                <span>
                  {{ getItemDetail(item.itemId).name }}<template v-if="item.quantity > 1"> (×{{ item.quantity }})</template>
                  <span v-if="getItemDetail(item.itemId).mastery" class="text-tertiary font-bold ml-1">[{{ getItemDetail(item.itemId).mastery }}]</span>
                </span>
              </li>
            </ul>
            <!-- Add resolved choice items -->
            <ul v-if="selectedBundle.choices" class="space-y-0.5 text-sm text-on-surface ml-4 mt-1">
              <li v-for="(choice, ci) in selectedBundle.choices" :key="'c-' + ci" class="flex items-start gap-1">
                <span class="text-tertiary">•</span>
                <span>
                  {{ getItemDetail(choiceSelections[ci] || choice.options[0]?.itemId || '').name }}
                  <span class="text-on-surface-variant">(chosen)</span>
                  <span v-if="getItemDetail(choiceSelections[ci] || choice.options[0]?.itemId || '').mastery" class="text-tertiary font-bold ml-1">[{{ getItemDetail(choiceSelections[ci] || choice.options[0]?.itemId || '').mastery }}]</span>
                </span>
              </li>
            </ul>
          </template>
          <p v-else class="font-body-sm text-body-sm text-on-surface-variant ml-4">No items — gold only.</p>
        </div>

        <hr class="border-outline-variant" />

        <!-- Background Source -->
        <div>
          <h4 class="font-label-lg text-label-lg text-tertiary mb-2">
            BACKGROUND ({{ backgroundName }}) —
            <span v-if="selectedBackgroundOption === 'A'">Option A — Thematic Gear</span>
            <span v-else>Option B — Gold Stipend</span>
            <span class="text-on-surface-variant ml-2">
              ⚡ +{{ selectedBackgroundOption === 'A' ? (bgEquipment?.optionA.currency.gp ?? 0) : 50 }} GP
            </span>
          </h4>
          <template v-if="selectedBackgroundOption === 'A' && bgEquipment">
            <ul class="space-y-0.5 text-sm text-on-surface ml-4">
              <li v-for="item in bgEquipment.optionA.items" :key="item.itemId" class="flex items-start gap-1">
                <span class="text-tertiary">•</span>
                <span>{{ getItemDetail(item.itemId).name }}<template v-if="item.quantity > 1"> (×{{ item.quantity }})</template></span>
              </li>
            </ul>
          </template>
          <p v-else class="font-body-sm text-body-sm text-on-surface-variant ml-4">No items — gold only.</p>
        </div>

        <hr v-if="selectedTrinketId" class="border-outline-variant" />

        <!-- Trinket -->
        <div v-if="selectedTrinketId">
          <h4 class="font-label-lg text-label-lg text-tertiary mb-2">TRINKET</h4>
          <p class="font-body-sm text-body-sm text-on-surface ml-4">• {{ getItemDetail(selectedTrinketId).name }}</p>
        </div>

        <hr class="border-outline-variant" />

        <!-- Gold Total -->
        <div class="flex justify-between items-center">
          <span class="font-headline-md text-headline-md text-on-surface">TOTAL GOLD</span>
          <span class="font-display-md text-display-md text-tertiary">
            {{ goldPreview?.totalGold ?? 0 }} GP
          </span>
        </div>

        <!-- Focus Info -->
        <div v-if="focusType" class="bg-tertiary/5 rounded p-3 border border-tertiary/20">
          <p class="font-label-md text-label-md text-tertiary">
            🔮 Spellcasting Focus: {{ focusType.charAt(0).toUpperCase() + focusType.slice(1) }}
            <span class="text-on-surface-variant font-body-sm">— Required for Magic Actions with material components.</span>
          </p>
        </div>
      </div>

      <!-- Weapon Mastery Display -->
      <div
        v-if="selectedBundle?.items"
        class="bg-surface-container rounded-lg border border-outline-variant p-4"
      >
        <h4 class="font-label-lg text-label-lg text-on-surface mb-2">Weapons & Mastery Properties</h4>
        <div class="flex flex-wrap gap-2">
          <template v-for="item in selectedBundle.items" :key="'wm-' + item.itemId">
            <span
              v-if="getItemDetail(item.itemId).mastery"
              class="px-3 py-1 rounded-full font-label-sm text-label-sm bg-tertiary/10 text-tertiary border border-tertiary/30 flex items-center gap-1"
            >
              {{ getItemDetail(item.itemId).name }}:
              <strong>{{ getItemDetail(item.itemId).mastery }}</strong>
            </span>
          </template>
        </div>
      </div>

      <div class="flex justify-between mt-4">
        <button
          @click="currentStep = showTrinketStep ? 4 : 3"
          class="px-4 py-2 rounded font-label-md text-label-md bg-surface-variant text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          ← Back
        </button>
        <button
          @click="confirmEquipment"
          class="px-6 py-2 rounded font-label-md text-label-md bg-tertiary text-on-tertiary hover:bg-tertiary/90 transition-colors"
        >
          ✓ Confirm & Apply Equipment
        </button>
      </div>
    </section>

    <!-- Post-completion message -->
    <div
      v-if="isComplete && !showWizard"
      class="bg-tertiary-container/20 border border-tertiary rounded-lg p-6 text-center"
    >
      <span class="material-symbols-outlined text-4xl text-tertiary mb-2 block">check_circle</span>
      <h3 class="font-headline-md text-headline-md text-on-surface mb-2">Equipment Configured!</h3>
      <p class="font-body-md text-body-md text-on-surface-variant mb-4">
        Your starting equipment has been added to your inventory and attacks.
        You can view and edit it below.
      </p>
      <button
        @click="resetWizard"
        class="px-4 py-2 rounded font-label-md text-label-md bg-surface-variant text-on-surface-variant hover:bg-surface-container-high transition-colors"
      >
        Reconfigure Equipment
      </button>
    </div>
  </div>

  <!-- Reconfigure button when wizard is not shown but equipment exists -->
  <div
    v-else-if="isComplete && !noEquipmentYet"
    class="flex justify-center mb-4"
  >
    <button
      @click="resetWizard"
      class="px-4 py-2 rounded font-label-md text-label-md bg-surface-variant text-on-surface-variant hover:bg-surface-container-high transition-colors text-sm"
    >
      🔄 Reconfigure Starting Equipment
    </button>
  </div>
</template>