<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCharacterStore } from '@/stores/character'
import { useRulesStore } from '@/stores/rulesStore'

const store = useCharacterStore()
const rulesStore = useRulesStore()

const searchQuery = ref('')
const activeCategory = ref('All Forms')

const categories = ['All Forms', 'Combat', 'Magic', 'Utility']

// Interface matching rulesStore feats
interface LocalFeature {
  title: string
  desc: string
  key?: boolean
  source?: string
  featureType?: string
  actionType?: string
  prerequisite?: string
  casterType?: string | null
  uses?: { total: number; per: string } | null
  [key: string]: unknown
}

// Available features from rulesStore
const availableFeats = computed(() => {
  return (rulesStore.allFeats as LocalFeature[]) || []
})

// Filtered feats
const filteredFeats = computed(() => {
  let filtered = availableFeats.value

  if (activeCategory.value !== 'All Forms') {
    filtered = filtered.filter(
      (f) => f.category === activeCategory.value || f.featureType === activeCategory.value,
    )
  }

  if (searchQuery.value.trim()) {
    const search = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (f: LocalFeature) =>
        f.title.toLowerCase().includes(search) || (f.desc && f.desc.toLowerCase().includes(search)),
    )
  }

  return filtered.sort((a, b) => a.title.localeCompare(b.title))
})

const myFeatsCount = computed(() => store.currentCharacterData?.features.length || 0)

function addFeat(feat: LocalFeature) {
  const newFeat = { ...feat, key: false } // ensure key is handled

  if (!store.currentCharacterData.features) {
    store.currentCharacterData.features = []
  }

  store.currentCharacterData.features.push(newFeat)
  store.recalculateAbilityScores()
}

function removeFeat(index: number) {
  if (store.currentCharacterData.features && store.currentCharacterData.features.length > index) {
    store.currentCharacterData.features.splice(index, 1)
    store.recalculateAbilityScores()
  }
}

function setActiveCategory(cat: string) {
  activeCategory.value = cat
}
</script>

<template>
  <div class="flex flex-col gap-8 w-full max-w-7xl mx-auto">
    <header class="mb-8 flex justify-between items-end border-b border-surface-variant pb-4">
      <div>
        <h2 class="font-display-lg text-display-lg text-tertiary mb-2">Feats &amp; Talents</h2>
        <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Select exceptional abilities that define your character
        </p>
      </div>
    </header>
    <!-- Top Section: Title & Filters -->
    <section class="flex flex-col gap-6">
      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container-low p-4 rounded-lg border border-outline-variant/30"
      >
        <!-- Search Bar -->
        <div class="relative w-full md:max-w-md">
          <span
            class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            >search</span
          >
          <input
            v-model="searchQuery"
            class="w-full bg-surface-container border border-outline-variant rounded py-2 pl-10 pr-4 text-on-surface focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none font-body-md text-body-md placeholder:text-outline-variant transition-colors shadow-sm"
            placeholder="Search the archives..."
            type="text"
          />
        </div>
        <!-- Category Filters -->
        <div class="flex flex-wrap gap-2">
          <button
            v-for="cat in categories"
            :key="cat"
            @click="setActiveCategory(cat)"
            :class="[
              'px-4 py-1.5 rounded-full border font-label-md text-label-md transition-colors shadow-sm',
              activeCategory === cat
                ? 'border-tertiary text-tertiary bg-tertiary/10'
                : 'border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary bg-surface-container',
            ]"
          >
            {{ cat }}
          </button>
        </div>
      </div>
    </section>

    <!-- Main Layout: Two Columns -->
    <section
      class="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-card-gap flex-1 items-start pb-12"
    >
      <!-- Left Column: Available Feats Library -->
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between border-b border-outline-variant/50 pb-2">
          <h2 class="font-headline-md text-headline-md text-primary flex items-center gap-2">
            <span class="material-symbols-outlined">library_books</span>
            Available Archives
          </h2>
          <span class="font-label-md text-label-md text-on-surface-variant"
            >Showing {{ filteredFeats.length }} entries</span
          >
        </div>

        <!-- Scrollable List of Cards -->
        <div
          class="flex flex-col gap-4 overflow-y-auto pr-2"
          style="max-height: calc(100vh - 300px)"
        >
          <div
            v-for="(feat, index) in filteredFeats"
            :key="index"
            class="bg-surface-container border border-primary-container p-5 rounded-lg flex flex-col sm:flex-row gap-4 hover:border-tertiary/50 transition-colors group relative shadow-sm"
          >
            <div class="flex-1">
              <h3 class="font-headline-md text-headline-md text-tertiary mb-1">{{ feat.title }}</h3>
              <div
                v-if="feat.prerequisite"
                class="inline-block bg-primary-container/30 border border-primary/20 px-2 py-0.5 rounded text-secondary-fixed-dim font-label-md text-[12px] mb-3"
              >
                Prerequisite: {{ feat.prerequisite }}
              </div>
              <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                {{ feat.desc }}
              </p>
            </div>

            <div class="flex items-start sm:justify-end mt-2 sm:mt-0">
              <button
                @click="addFeat(feat)"
                class="w-10 h-10 rounded-full bg-primary-container border border-primary/50 text-primary flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors group-hover:scale-105 active:scale-95 shadow-sm"
                title="Transcribe Feat"
              >
                <span class="material-symbols-outlined">add</span>
              </button>
            </div>
          </div>

          <div
            v-if="filteredFeats.length === 0"
            class="text-center py-8 text-on-surface-variant font-body-md"
          >
            No archives match your inquiry.
          </div>
        </div>
      </div>

      <!-- Right Column: My Feats (Ledger) -->
      <div
        class="bg-surface-container-low border border-outline-variant rounded-lg p-6 shadow-md h-full flex flex-col relative overflow-hidden"
      >
        <!-- Decorative corner inset -->
        <div
          class="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-tertiary/20 rounded-tr-lg pointer-events-none"
        ></div>

        <div class="flex justify-between items-end border-b border-tertiary/30 pb-3 mb-6">
          <h2 class="font-headline-md text-headline-md text-tertiary flex items-center gap-2">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1"
              >menu_book</span
            >
            Transcribed Feats
          </h2>
          <div
            class="font-label-md text-label-md bg-tertiary/10 text-tertiary px-3 py-1 rounded-full border border-tertiary/20"
          >
            {{ myFeatsCount }} Active
          </div>
        </div>

        <div class="flex flex-col gap-6 overflow-y-auto pr-2 flex-1 pt-2">
          <div
            v-for="(feat, index) in store.currentCharacterData?.features"
            :key="index"
            class="relative pl-5 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-tertiary/50"
          >
            <div class="flex justify-between items-start mb-2 group">
              <h3 class="font-headline-md text-[20px] text-inverse-surface">{{ feat.title }}</h3>
              <button
                @click="removeFeat(index)"
                class="text-outline-variant hover:text-error transition-colors flex items-center justify-center p-1 rounded hover:bg-error/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
                title="Remove Feat"
              >
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div class="font-body-md text-body-md text-on-surface-variant space-y-3">
              <div
                v-html="
                  feat.desc
                    .replace(
                      /<li>/g,
                      '<li class=\'pl-4 relative before:content-[&quot;&quot;] before:absolute before:left-0 before:top-2.5 before:w-1.5 before:h-1.5 before:bg-tertiary before:rounded-full\'>',
                    )
                    .replace(/<ul>/g, '<ul class=\'list-none space-y-2 relative\'>')
                "
              ></div>
            </div>
          </div>

          <div
            v-if="
              !store.currentCharacterData?.features ||
              store.currentCharacterData.features.length === 0
            "
            class="text-center font-body-md text-on-surface-variant italic py-8 border border-dashed border-outline-variant/30 rounded-lg mt-4"
          >
            No transcribed feats. Click the + icon on a feat in the archives to active it.
          </div>
        </div>

        <!-- Decorative bottom flourish -->
        <div class="w-full flex justify-center mt-4 opacity-30">
          <span class="material-symbols-outlined text-tertiary text-[16px]">horizontal_rule</span>
          <span class="material-symbols-outlined text-tertiary text-[16px] mx-1">diamond</span>
          <span class="material-symbols-outlined text-tertiary text-[16px]">horizontal_rule</span>
        </div>
      </div>
    </section>
  </div>
</template>
