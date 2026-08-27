<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCharacterStore } from '@/stores/character'
import { useRulesStore } from '@/stores/rulesStore'
import { useCharacterCompletion } from '@/composables/useCharacterCompletion'
import FeatureEditorModal from '@/components/modals/FeatureEditorModal.vue'
import FeatureChoiceModal from '@/components/modals/FeatureChoiceModal.vue'
import ActionBadge from '@/components/ui/ActionBadge.vue'
import type { CharacterFeature } from '@/types/character'
import type { FeatureChoice } from '@/types/rules'
import {
  eligibleFeatureChoices as eligibleFeatureChoicesHelper,
  effectiveMaxCountForChoice as effectiveMaxCountForChoiceHelper,
} from '@/utils/featureChoiceRules'

const store = useCharacterStore()
const rulesStore = useRulesStore()
const { badges } = useCharacterCompletion()

// --- State ---
const searchFilter = ref('')
const activeCategory = ref('All Forms')
const showFeatLibrary = ref(false)
const expandedFeatures = ref<Set<string>>(new Set())

// Feature editor modal state
const isEditorOpen = ref(false)
const editingFeatureData = ref<Record<string, unknown>>({})
const isNewFeature = ref(false)
const editingFeatureRef = ref<CharacterFeature | null>(null)

const categories = ['All Forms', 'Combat', 'Magic', 'Utility']

// --- Feature choice modal state ---
const isFeatureChoiceOpen = ref(false)
const activeFeatureChoice = ref<FeatureChoice | null>(null)

// --- Eligible feature choices based on character's class ---
const eligibleFeatureChoices = computed<FeatureChoice[]>(() => {
  return eligibleFeatureChoicesHelper(
    store.currentCharacterData?.class,
    store.currentCharacterData?.renownTier,
  )
})

function currentFeatureChoiceSelections(choiceId: string): string[] {
  return store.currentCharacterData?.featureChoices?.[choiceId] ?? []
}

/** Compute the effective max count for a feature choice, accounting for tier scaling. */
function effectiveMaxCountForChoice(fc: FeatureChoice): number {
  return effectiveMaxCountForChoiceHelper(fc, store.currentCharacterData?.renownTier)
}

function openFeatureChoiceModal(choice: FeatureChoice) {
  activeFeatureChoice.value = choice
  isFeatureChoiceOpen.value = true
}

function handleFeatureChoiceSelect(optionIds: string[]) {
  if (activeFeatureChoice.value) {
    store.applyFeatureChoice(activeFeatureChoice.value.id, optionIds)
  }
}

// --- Available feats from rulesStore ---
interface LocalFeat {
  title: string
  desc: string
  key?: boolean
  source?: string
  featureType?: string
  actionType?: string
  prerequisite?: string
  casterType?: string | null
  uses?: { total: number; per: string } | null
  category?: string
  [key: string]: unknown
}

const availableFeats = computed<LocalFeat[]>(() => {
  return (rulesStore.allFeats as LocalFeat[]) || []
})

// --- Selected feats from character ---
const selectedFeats = computed<CharacterFeature[]>(() => {
  return store.currentCharacterData?.features || []
})

// --- Library feats (filtered) ---
const libraryFeats = computed(() => {
  let filtered = availableFeats.value

  if (activeCategory.value !== 'All Forms') {
    filtered = filtered.filter(
      (f) => f.category === activeCategory.value || f.featureType === activeCategory.value,
    )
  }

  if (searchFilter.value.trim()) {
    const search = searchFilter.value.toLowerCase()
    filtered = filtered.filter(
      (f) =>
        f.title.toLowerCase().includes(search) ||
        (f.desc && f.desc.toLowerCase().includes(search)),
    )
  }

  return filtered.sort((a, b) => a.title.localeCompare(b.title))
})

// --- Toggle expand/collapse ---
function toggleExpand(title: string) {
  if (expandedFeatures.value.has(title)) {
    expandedFeatures.value.delete(title)
  } else {
    expandedFeatures.value.add(title)
  }
}

// --- Add feat from library ---
function addFeatFromLibrary(feat: LocalFeat) {
  if (!store.currentCharacterData.features) {
    store.currentCharacterData.features = []
  }

  const newFeat = {
    ...feat,
    key: false,
  }

  store.currentCharacterData.features.push(
    newFeat as unknown as (typeof store.currentCharacterData.features)[number],
  )
  store.recalculateAbilityScores()
}

// --- Remove feat ---
function removeFeat(index: number) {
  if (
    store.currentCharacterData.features &&
    store.currentCharacterData.features.length > index
  ) {
    store.currentCharacterData.features.splice(index, 1)
    store.recalculateAbilityScores()
  }
}

// --- Open library ---
function openFeatLibrary() {
  searchFilter.value = ''
  activeCategory.value = 'All Forms'
  showFeatLibrary.value = true
}

// --- Custom feat (manual entry via FeatureEditorModal) ---
function addManualFeat() {
  editingFeatureData.value = {}
  editingFeatureRef.value = null
  isNewFeature.value = true
  isEditorOpen.value = true
  showFeatLibrary.value = false
}

function editFeature(feature: CharacterFeature) {
  editingFeatureData.value = { ...feature }
  editingFeatureRef.value = feature
  isNewFeature.value = false
  isEditorOpen.value = true
}

function handleEditorSave(featureData: CharacterFeature) {
  if (isNewFeature.value) {
    store.currentCharacterData.features = store.currentCharacterData.features || []
    const normalized = {
      ...featureData,
      uses: featureData.uses
        ? {
            total: (featureData.uses.total as number) || 0,
            per: (featureData.uses.per as string) || '',
          }
        : undefined,
    } as unknown as (typeof store.currentCharacterData.features)[number]
    store.currentCharacterData.features.push(normalized)
  } else if (editingFeatureRef.value) {
    const allFeatures = store.currentCharacterData.features || []
    const featureIndex = allFeatures.findIndex(
      (f: CharacterFeature) => f === editingFeatureRef.value,
    )
    if (featureIndex !== -1) {
      const normalized = {
        ...featureData,
        uses: featureData.uses
          ? {
              total: (featureData.uses.total as number) || 0,
              per: (featureData.uses.per as string) || '',
            }
          : undefined,
      } as unknown as (typeof store.currentCharacterData.features)[number]
      allFeatures[featureIndex] = normalized
    }
  }

  isEditorOpen.value = false
  editingFeatureRef.value = null
  store.recalculateAbilityScores()
}

function handleEditorCancel() {
  isEditorOpen.value = false
  editingFeatureRef.value = null
}

function handleEditorDelete() {
  if (!isNewFeature.value && editingFeatureRef.value) {
    const allFeatures = store.currentCharacterData.features || []
    const featureIndex = allFeatures.findIndex(
      (f: CharacterFeature) => f === editingFeatureRef.value,
    )
    if (featureIndex !== -1) {
      allFeatures.splice(featureIndex, 1)
    }
    store.recalculateAbilityScores()
  }
  isEditorOpen.value = false
  editingFeatureRef.value = null
}

// --- Set active category ---
function setActiveCategory(cat: string) {
  activeCategory.value = cat
}
</script>

<template>
  <div class="flex flex-col gap-8 w-full max-w-7xl mx-auto">
    <header class="mb-8 flex justify-between items-end border-b border-surface-variant pb-4">
      <div>
        <h2 class="font-display-lg text-display-lg text-tertiary mb-2">Feats & Talents</h2>
        <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Select exceptional abilities that define your character
        </p>
      </div>
      <div
        v-if="selectedFeats.length > 0"
        class="font-label-md text-label-md bg-tertiary/10 text-tertiary px-3 py-1 rounded-full border border-tertiary/20"
      >
        {{ selectedFeats.length }} Active
      </div>
    </header>

    <!-- Selected Feats Section -->
    <section
      class="bg-surface-container rounded-lg p-6 border border-outline-variant shadow-sm flex-1"
    >
      <div class="flex justify-between items-end border-b border-surface-variant pb-4 mb-6">
        <h3 class="font-headline-lg text-headline-lg text-tertiary flex items-center gap-2 m-0">
          <span class="material-symbols-outlined text-3xl">auto_awesome</span>
          Transcribed Feats
        </h3>
      </div>

      <!-- Search + Add Feats Button -->
      <div class="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <div class="relative flex-1 w-full">
          <span
            class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            >search</span
          >
          <input
            v-model="searchFilter"
            class="w-full bg-surface-container-high border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-on-surface focus:ring-tertiary focus:border-tertiary outline-none font-body-md text-body-md placeholder:text-outline-variant transition-colors shadow-sm"
            placeholder="Search my feats..."
            type="text"
          />
        </div>
        <button
          v-if="store.isEditing"
          @click="openFeatLibrary"
          class="bg-primary-container text-primary border border-primary/30 px-4 py-2 rounded-lg font-label-md flex items-center gap-2 hover:bg-surface-variant transition-colors whitespace-nowrap shadow-sm"
        >
          <span class="material-symbols-outlined">add_circle</span> Add Feats
        </button>
      </div>

      <!-- Selected Feat Cards Grid -->
      <div
        v-if="selectedFeats.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="(feat, index) in selectedFeats"
          :key="index"
          class="bg-surface-container-high border border-primary-container p-4 rounded-lg hover:border-tertiary/50 transition-colors group relative shadow-sm"
        >
          <!-- Header -->
          <div
            class="flex items-start justify-between cursor-pointer select-none mb-2"
            @click="toggleExpand(feat.title)"
          >
            <div class="flex items-center gap-2">
              <span
                class="material-symbols-outlined text-outline text-[20px] transition-transform"
                :class="{ 'rotate-90': expandedFeatures.has(feat.title) }"
                >chevron_right</span
              >
              <h4
                class="font-headline-md text-headline-md text-tertiary m-0 group-hover:text-tertiary-fixed transition-colors"
              >
                {{ feat.title }}
              </h4>
            </div>
            <button
              v-if="store.isEditing"
              @click.stop="removeFeat(index)"
              class="text-outline-variant hover:text-error transition-colors flex items-center justify-center p-1 rounded hover:bg-error/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Remove Feat"
            >
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <!-- Badges -->
          <div class="flex flex-wrap gap-2 pl-7 mb-2">
            <div
              v-if="feat.prerequisite"
              class="inline-block bg-primary-container/30 border border-primary/20 px-2 py-0.5 rounded text-secondary-fixed-dim font-label-md text-[12px]"
            >
              Prerequisite: {{ feat.prerequisite }}
            </div>
            <ActionBadge
              v-if="feat.actionType"
              :action-type="(feat.actionType as any)"
              size="sm"
              class="inline-block bg-primary-container/30 border border-primary/20 px-2 py-0.5 rounded text-secondary-fixed-dim font-label-md text-[12px]"
            />
            <div
              v-if="feat.source"
              class="inline-block bg-primary-container/30 border border-primary/20 px-2 py-0.5 rounded text-secondary-fixed-dim font-label-md text-[12px]"
            >
              {{ feat.source }}
            </div>

            <!-- Resource usage display -->
            <div
              v-if="feat.resource && (feat.used !== undefined ? feat.used : 0) < (store.getFeatureMaxUses(feat) || 0)"
              class="inline-flex items-center gap-1.5 bg-primary-container/30 border border-primary/20 px-2 py-0.5 rounded text-secondary-fixed-dim font-label-md text-[12px]"
            >
              <div class="flex items-center gap-1">
                <input
                  v-for="n in store.getFeatureMaxUses(feat)"
                  :key="n"
                  type="checkbox"
                  :checked="n <= (feat.used || 0)"
                  @change="feat.used = feat.used === n ? n - 1 : n"
                  class="usage-box w-3 h-3 appearance-none border border-secondary-fixed-dim/50 rounded-sm checked:bg-tertiary checked:border-tertiary focus:ring-1 focus:ring-tertiary focus:ring-offset-1 focus:ring-offset-surface-container-high"
                />
              </div>
              <span v-if="feat.resource.reset" class="opacity-80"
                >/ {{ feat.resource.reset }}</span
              >
            </div>
            <!-- Legacy uses format -->
            <div
              v-else-if="feat.uses"
              class="inline-flex items-center gap-1.5 bg-primary-container/30 border border-primary/20 px-2 py-0.5 rounded text-secondary-fixed-dim font-label-md text-[12px]"
            >
              <div class="flex items-center gap-1">
                <input
                  v-for="n in feat.uses.total"
                  :key="n"
                  type="checkbox"
                  :checked="n <= (feat.used || 0)"
                  @change="feat.used = feat.used === n ? n - 1 : n"
                  class="usage-box w-3 h-3 appearance-none border border-secondary-fixed-dim/50 rounded-sm checked:bg-tertiary checked:border-tertiary focus:ring-1 focus:ring-tertiary focus:ring-offset-1 focus:ring-offset-surface-container-high"
                />
              </div>
              <span v-if="feat.uses.per" class="opacity-80">/ {{ feat.uses.per }}</span>
            </div>
          </div>

          <!-- Description (expandable) -->
          <div
            v-show="expandedFeatures.has(feat.title)"
            class="pl-7 pt-2 font-body-md text-body-md text-on-surface-variant leading-relaxed"
          >
            <div v-html="formatFeatDesc(feat.desc)"></div>
          </div>

          <!-- Edit button -->
          <button
            v-if="store.isEditing"
            @click.stop="editFeature(feat)"
            class="absolute top-4 right-12 text-outline-variant hover:text-primary transition-colors flex items-center justify-center p-1 rounded hover:bg-surface-variant/50 opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Edit Feat"
          >
            <span class="material-symbols-outlined text-[16px]">edit</span>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="selectedFeats.length === 0"
        class="text-center py-12 text-on-surface-variant italic border border-dashed border-outline-variant/30 rounded-lg"
      >
        <p v-if="store.isEditing">
          No feats transcribed yet. Click <strong>Add Feats</strong> to browse the archives.
        </p>
        <p v-else>No feats available for this character.</p>
      </div>
    </section>

    <!-- Eligible Feature Choices Section -->
    <section
      v-if="eligibleFeatureChoices.length > 0"
      class="bg-surface-container rounded-lg p-6 border shadow-sm flex-1"
      :class="badges.feats ? 'border-red-600/50' : 'border-outline-variant'"
    >
      <div
        class="flex justify-between items-end border-b pb-4 mb-6"
        :class="badges.feats ? 'border-red-600/30' : 'border-surface-variant'"
      >
        <h3 class="font-headline-lg text-headline-lg text-tertiary flex items-center gap-2 m-0">
          <span class="material-symbols-outlined text-3xl">fact_check</span>
          Class Features &amp; Choices
        </h3>
        <span
          v-if="badges.feats"
          class="font-label-md text-label-md text-red-600 bg-red-600/10 px-3 py-1 rounded-full border border-red-600/30 select-none animate-pulse"
        >
          {{ badges.feats.label }}
        </span>
      </div>

      <div
        v-for="fc in eligibleFeatureChoices"
        :key="fc.id"
        class="bg-surface-container-high border border-primary-container p-4 rounded-lg hover:border-tertiary/50 transition-colors shadow-sm"
      >
        <div class="flex items-start justify-between">
          <div>
            <h4 class="font-headline-md text-headline-md text-tertiary mb-1">
              {{ fc.label }}
            </h4>
            <p class="text-sm text-on-surface-variant mb-2">
              {{ fc.description }}
            </p>
            <p class="text-xs text-on-surface-variant">
              Choose up to {{ effectiveMaxCountForChoice(fc) }} of {{ fc.options?.length ?? 0 }} options
            </p>
            <p
              v-if="currentFeatureChoiceSelections(fc.id).length > 0"
              class="text-xs text-tertiary mt-1 font-semibold"
            >
              {{ currentFeatureChoiceSelections(fc.id).length }} selected
            </p>
          </div>
          <button
            v-if="store.isEditing"
            :data-test="`feature-choice-manage-${fc.id}`"
            @click="openFeatureChoiceModal(fc)"
            class="bg-primary-container text-primary border border-primary/30 px-3 py-1.5 rounded-lg font-label-md flex items-center gap-1.5 hover:bg-surface-variant transition-colors whitespace-nowrap shadow-sm text-sm"
          >
            <span class="material-symbols-outlined text-base">edit</span>
            Manage
          </button>
        </div>
      </div>
    </section>

    <!-- Feat Library Modal -->
    <div
      v-if="showFeatLibrary && store.isEditing"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="showFeatLibrary = false"
    >
      <div
        class="bg-surface-container rounded-lg max-w-4xl max-h-[85vh] overflow-hidden flex flex-col w-full border border-outline-variant shadow-xl"
      >
        <!-- Modal Header -->
        <div
          class="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low rounded-t-lg"
        >
          <h3
            class="text-2xl font-headline-lg text-tertiary flex items-center gap-2 m-0 bg-transparent"
          >
            <span class="material-symbols-outlined">library_books</span>
            Feat Archives
          </h3>
          <button
            @click="showFeatLibrary = false"
            class="p-2 hover:bg-surface-variant rounded-full transition-colors text-on-surface-variant"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Library Controls -->
        <div class="p-4 bg-surface-container-low border-b border-outline-variant/30">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div class="relative">
              <span
                class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                >search</span
              >
              <input
                v-model="searchFilter"
                type="text"
                placeholder="Filter by name or description..."
                class="w-full bg-surface-container border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none font-body-md text-body-md placeholder:text-outline-variant transition-colors shadow-sm"
                autofocus
              />
            </div>
            <div class="flex gap-1 flex-wrap items-center">
              <button
                v-for="cat in categories"
                :key="cat"
                @click="setActiveCategory(cat)"
                :class="[
                  'px-3 py-1 text-xs rounded-full border transition-all font-bold',
                  activeCategory === cat
                    ? 'bg-tertiary text-on-tertiary border-tertiary shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-tertiary/50',
                ]"
              >
                {{ cat }}
              </button>
            </div>
          </div>
        </div>

        <!-- Library Scroll Area -->
        <div class="flex-grow overflow-y-auto p-6 custom-scrollbar">
          <div
            v-if="libraryFeats.length === 0"
            class="text-center py-12 text-on-surface-variant italic border border-dashed border-outline-variant rounded-xl"
          >
            No feats found matching your criteria.
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="(feat, index) in libraryFeats"
              :key="index"
              class="bg-surface-container-low border border-outline-variant rounded-lg p-4 hover:border-tertiary/50 transition-colors group relative"
            >
              <div class="flex justify-between items-start mb-1">
                <h5
                  class="font-headline-md text-on-surface group-hover:text-tertiary transition-colors m-0"
                >
                  {{ feat.title }}
                </h5>
                <span
                  v-if="feat.source"
                  class="text-[12px] bg-primary-container/30 border border-primary/20 px-2 py-0.5 rounded text-secondary-fixed-dim font-label-md ml-2 flex-shrink-0"
                >
                  {{ feat.source }}
                </span>
              </div>
              <div
                v-if="feat.prerequisite"
                class="inline-block bg-primary-container/30 border border-primary/20 px-2 py-0.5 rounded text-secondary-fixed-dim font-label-md text-[11px] mb-2"
              >
                Prerequisite: {{ feat.prerequisite }}
              </div>
              <p
                class="font-body-md text-body-md text-on-surface-variant leading-relaxed line-clamp-2 mb-3"
              >
                {{ feat.desc }}
              </p>

              <div class="flex justify-between items-end">
                <div
                  class="flex gap-2 text-[10px] text-primary/70 uppercase font-bold tracking-tighter"
                >
                  <span v-if="feat.actionType">{{ feat.actionType }}</span>
                  <span
                    v-if="feat.featureType && feat.featureType !== feat.actionType"
                    >{{ feat.featureType }}</span
                  >
                </div>
                <button
                  @click="addFeatFromLibrary(feat)"
                  class="bg-tertiary text-on-tertiary text-xs px-3 py-1 rounded font-bold hover:bg-tertiary-fixed transition-colors shadow-sm"
                >
                  Transcribe
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="p-4 border-t border-outline-variant bg-surface-container-low flex justify-between items-center rounded-b-lg"
        >
          <span class="font-label-md text-on-surface-variant"
            >Found {{ libraryFeats.length }} feats</span
          >
          <button
            @click="addManualFeat"
            class="text-primary font-bold text-sm flex items-center gap-2 hover:bg-primary-container/20 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">edit_note</span>
            Custom Entry
          </button>
        </div>
      </div>
    </div>

    <!-- Feature Choice Modal (for class-based selections like Eldritch Invocations) -->
    <FeatureChoiceModal
      :is-open="isFeatureChoiceOpen"
      :choice="activeFeatureChoice"
      :current-selections="activeFeatureChoice ? currentFeatureChoiceSelections(activeFeatureChoice.id) : []"
      :effective-max-count="activeFeatureChoice ? effectiveMaxCountForChoice(activeFeatureChoice) : 0"
      @select="handleFeatureChoiceSelect"
      @close="isFeatureChoiceOpen = false"
    />

    <!-- Feature Editor Modal (for custom/manual entries) -->
    <FeatureEditorModal
      :is-open="isEditorOpen"
      :feature="editingFeatureData"
      :is-new="isNewFeature"
      @save="handleEditorSave"
      @cancel="handleEditorCancel"
      @delete="handleEditorDelete"
    />
  </div>
</template>

<script lang="ts">
function formatFeatDesc(desc: string): string {
  if (!desc) return ''
  return desc
    .replace(
      /<li>/g,
      '<li class="pl-4 relative before:content-[\'\'] before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-tertiary before:rounded-full">',
    )
    .replace(/<ul>/g, '<ul class="list-none space-y-2 relative my-2">')
}
</script>

<style scoped>
/* Custom scrollbar for library — gold thumb matching the Heroes Guild tertiary accent */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--color-tertiary) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--color-tertiary);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--color-tertiary-fixed-dim);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>