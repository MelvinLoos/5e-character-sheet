<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '@/stores/character'
import { useSpellcasting } from '@/composables/useSpellcasting'

import draggable from 'vuedraggable'

const store = useCharacterStore()
const {
  showSpellLibrary,
  searchFilter,
  filterByLevel,
  spellSortMode,
  hasSpellcasting,
  displaySpellSlots,
  maxSpellSlotLevel,
  getSpent,
  setSpent,
  editableSpells,
  characterClass,
  librarySpells,
  filteredActiveSpells,
  toggleSpellLibrary,
  addSpellFromLibrary,
  addManualSpell,
  addSpell,
  removeSpell,
  togglePrepared,
  clearFilters,
  formatLevel,
} = useSpellcasting()

/** Controls whether drag-and-drop reordering is active (manual sort mode, editing, no search filter). */
const isDraggable = computed(() => {
  return spellSortMode.value === 'manual' && store.isEditing && !searchFilter.value
})

const allowedLevels = computed(() => {
  const max = maxSpellSlotLevel.value
  // Generate array [0, 1, 2, ..., max] — cantrip is always shown
  return Array.from({ length: max + 1 }, (_, i) => i)
})
</script>

<template>
  <div v-if="hasSpellcasting" class="flex flex-col gap-card-gap w-full text-sm">
    <!-- Spell Grimoire -->
    <section
      class="bg-surface-container rounded-lg p-6 border border-outline-variant shadow-sm flex-1"
    >
      <div class="flex justify-between items-end border-b border-surface-variant pb-4 mb-6">
        <h3 class="font-headline-lg text-headline-lg text-tertiary flex items-center gap-2">
          <span class="material-symbols-outlined text-3xl">menu_book</span> Spell Grimoire
        </h3>
        <div class="text-right">
          <span
            class="font-label-md text-label-md text-on-surface-variant block uppercase tracking-wider mb-1"
            >Spell Attack / DC</span
          >
          <div class="flex gap-4">
            <div class="bg-surface-container-high px-3 py-1 rounded border border-outline-variant">
              <span class="text-tertiary font-bold"
                >{{ store.spellAttack >= 0 ? '+' : '' }}{{ store.spellAttack }}</span
              >
              ATK
            </div>
            <div class="bg-surface-container-high px-3 py-1 rounded border border-outline-variant">
              <span class="text-tertiary font-bold">{{ store.spellSaveDC }}</span> DC
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col md:flex-row gap-4 mb-6 items-center">
        <div class="relative flex-1 w-full">
          <span
            class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            >search</span
          >
          <input
            v-model="searchFilter"
            class="w-full bg-surface-container-high border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-on-surface focus:ring-tertiary focus:border-tertiary"
            placeholder="Search Spells..."
            type="text"
          />
        </div>
        <button
          v-if="store.isEditing"
          @click="addSpell"
          class="bg-primary-container text-primary border border-primary/30 px-4 py-2 rounded-lg font-label-md flex items-center gap-2 hover:bg-surface-variant transition-colors whitespace-nowrap"
        >
          <span class="material-symbols-outlined">add_circle</span> Add Spell
        </button>
      </div>

      <!-- Spell Slot Counters -->
      <div
        v-if="Object.keys(displaySpellSlots).length > 0"
        class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
      >
        <div
          v-for="[levelKey, max] in Object.entries(displaySpellSlots)"
          :key="levelKey"
          class="bg-surface-container-high rounded p-3 border border-outline-variant flex flex-col items-center"
        >
          <span class="font-label-md text-label-md text-primary mb-2"
            >{{ formatLevel(parseInt(levelKey.replace('level', ''))) }} Level</span
          >
          <div class="flex items-center gap-2">
            <button
              @click="
                setSpent(
                  parseInt(levelKey.replace('level', '')),
                  getSpent(parseInt(levelKey.replace('level', ''))) - 1,
                )
              "
              class="w-8 h-8 rounded-full border border-tertiary flex items-center justify-center font-bold text-tertiary bg-surface-container hover:bg-tertiary/10 transition-colors cursor-pointer"
              title="Click to decrement used slots"
            >
              {{ max - getSpent(parseInt(levelKey.replace('level', ''))) }}
            </button>
            <span class="text-outline-variant">/</span>
            <div
              class="w-8 h-8 rounded-full border border-outline flex items-center justify-center font-bold text-on-surface bg-surface-variant select-none"
            >
              {{ max }}
            </div>
          </div>
          <button
            @click="
              setSpent(
                parseInt(levelKey.replace('level', '')),
                getSpent(parseInt(levelKey.replace('level', ''))) + 1,
              )
            "
            class="mt-2 text-[10px] uppercase font-bold text-tertiary/60 hover:text-tertiary transition-colors cursor-pointer"
          >
            Spend Slot
          </button>
        </div>
      </div>

      <!-- Sort Mode Toggle -->
      <div
        v-if="!searchFilter"
        class="flex items-center gap-2 mb-4 flex-wrap"
      >
        <span class="text-xs font-label-md text-on-surface-variant uppercase tracking-wider mr-1">Sort:</span>
        <button
          v-for="mode in ([
            { key: 'level', label: 'Level' },
            { key: 'name', label: 'Name' },
            { key: 'school', label: 'School' },
            { key: 'prepared', label: 'Prepared' },
            { key: 'manual', label: 'Manual' },
          ] as const)"
          :key="mode.key"
          @click="spellSortMode = mode.key"
          :class="[
            'px-3 py-1 text-xs rounded-full border transition-all font-bold',
            spellSortMode === mode.key
              ? 'bg-tertiary text-on-tertiary border-tertiary shadow-sm'
              : 'bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-tertiary/50',
          ]"
        >
          {{ mode.label }}
        </button>
      </div>

      <!-- Spell Cards Grid (draggable when manual sort, editing, and no search) -->
      <draggable
        v-if="isDraggable"
        v-model="editableSpells"
        item-key="id"
        tag="div"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        handle=".spell-drag-handle"
        ghost-class="opacity-50"
      >
        <template #item="{ element: spell }">
          <div
            :class="[
              'rounded border p-4 relative overflow-hidden transition-all group duration-200',
              spell.prepared
                ? 'parchment-bg border-secondary-container shadow-[0_4px_10px_rgba(0,0,0,0.2)] hover:-translate-y-1'
                : 'bg-primary-container border-outline-variant hover:-translate-y-1',
            ]"
          >
            <!-- Preparation Toggle Gradient/Corner -->
            <div
              v-if="spell.prepared"
              class="absolute top-0 right-0 w-16 h-16 bg-tertiary/20 rounded-bl-full border-l border-b border-tertiary/30"
            ></div>

            <div class="flex justify-between items-start mb-2 relative z-10">
              <div class="flex items-center">
                <!-- Drag handle -->
                <span
                  class="spell-drag-handle material-symbols-outlined text-sm cursor-move opacity-0 group-hover:opacity-50 mr-1 text-inherit"
                  >drag_indicator</span
                >

                <button
                  @click="togglePrepared(spell)"
                  :class="[
                    'transition-colors mr-2',
                    spell.prepared
                      ? 'text-on-secondary-fixed-variant hover:text-on-secondary-fixed'
                      : 'text-on-surface-variant hover:text-primary',
                  ]"
                  :title="spell.prepared ? 'Unprepare Spell' : 'Prepare Spell'"
                >
                  <span
                    class="material-symbols-outlined"
                    :style="spell.prepared ? 'font-variation-settings: \'FILL\' 1' : ''"
                  >
                    {{ spell.prepared ? 'check_circle' : 'radio_button_unchecked' }}
                  </span>
                </button>
              </div>

              <h4
                class="font-headline-md text-headline-md flex-grow"
                :class="spell.prepared ? 'text-on-secondary-fixed' : 'text-primary'"
              >
                {{ spell.name }}
              </h4>
              <span
                class="bg-surface-container text-tertiary px-2 py-0.5 rounded text-xs font-bold border border-tertiary-container shadow-sm"
              >
                Lvl {{ spell.level }}
              </span>
            </div>

            <p
              class="font-label-md text-label-md italic mb-3"
              :class="
                spell.prepared ? 'text-on-secondary-fixed-variant' : 'text-on-primary-container'
              "
            >
              {{ spell.school || 'General' }} <span v-if="spell.ritual">(Ritual)</span>
            </p>

            <div
              class="grid grid-cols-2 gap-2 mb-4 text-sm font-label-md border-y py-2"
              :class="spell.prepared ? 'border-outline/30' : 'border-outline-variant/50'"
            >
              <div :class="spell.prepared ? 'text-on-secondary-fixed' : 'text-on-surface'">
                <span class="opacity-70">Time:</span> {{ spell.castingTime || '1 Action' }}
              </div>
              <div :class="spell.prepared ? 'text-on-secondary-fixed' : 'text-on-surface'">
                <span class="opacity-70">Range:</span> {{ spell.range || 'Touch' }}
              </div>
              <div :class="spell.prepared ? 'text-on-secondary-fixed' : 'text-on-surface'">
                <span class="opacity-70">Comp:</span> {{ spell.components || 'V, S' }}
              </div>
              <div :class="spell.prepared ? 'text-on-secondary-fixed' : 'text-on-surface'">
                <span class="opacity-70">Dur:</span> {{ spell.duration || 'Instant' }}
              </div>
            </div>

            <p
              class="font-body-md text-body-md leading-snug line-clamp-4"
              :class="spell.prepared ? 'text-on-secondary-fixed' : 'text-on-surface'"
            >
              {{ spell.desc }}
            </p>

            <!-- Delete button -->
            <button
              v-if="store.isEditing"
              @click="removeSpell(spell.id!)"
              class="absolute bottom-2 right-2 text-error opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-error/10 rounded"
              title="Remove Spell"
            >
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </template>
      </draggable>

      <!-- Static sorted grid (when not draggable — auto-sorted or searching) -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="spell in filteredActiveSpells"
          :key="spell.id"
          :class="[
            'rounded border p-4 relative overflow-hidden transition-all group duration-200',
            spell.prepared
              ? 'parchment-bg border-secondary-container shadow-[0_4px_10px_rgba(0,0,0,0.2)] hover:-translate-y-1'
              : 'bg-primary-container border-outline-variant hover:-translate-y-1',
          ]"
        >
          <!-- Preparation Toggle Gradient/Corner -->
          <div
            v-if="spell.prepared"
            class="absolute top-0 right-0 w-16 h-16 bg-tertiary/20 rounded-bl-full border-l border-b border-tertiary/30"
          ></div>

          <div class="flex justify-between items-start mb-2 relative z-10">
            <div class="flex items-center">
              <button
                @click="togglePrepared(spell)"
                :class="[
                  'transition-colors mr-2',
                  spell.prepared
                    ? 'text-on-secondary-fixed-variant hover:text-on-secondary-fixed'
                    : 'text-on-surface-variant hover:text-primary',
                ]"
                :title="spell.prepared ? 'Unprepare Spell' : 'Prepare Spell'"
              >
                <span
                  class="material-symbols-outlined"
                  :style="spell.prepared ? 'font-variation-settings: \'FILL\' 1' : ''"
                >
                  {{ spell.prepared ? 'check_circle' : 'radio_button_unchecked' }}
                </span>
              </button>
            </div>

            <h4
              class="font-headline-md text-headline-md flex-grow"
              :class="spell.prepared ? 'text-on-secondary-fixed' : 'text-primary'"
            >
              {{ spell.name }}
            </h4>
            <span
              class="bg-surface-container text-tertiary px-2 py-0.5 rounded text-xs font-bold border border-tertiary-container shadow-sm"
            >
              Lvl {{ spell.level }}
            </span>
          </div>

          <p
            class="font-label-md text-label-md italic mb-3"
            :class="
              spell.prepared ? 'text-on-secondary-fixed-variant' : 'text-on-primary-container'
            "
          >
            {{ spell.school || 'General' }} <span v-if="spell.ritual">(Ritual)</span>
          </p>

          <div
            class="grid grid-cols-2 gap-2 mb-4 text-sm font-label-md border-y py-2"
            :class="spell.prepared ? 'border-outline/30' : 'border-outline-variant/50'"
          >
            <div :class="spell.prepared ? 'text-on-secondary-fixed' : 'text-on-surface'">
              <span class="opacity-70">Time:</span> {{ spell.castingTime || '1 Action' }}
            </div>
            <div :class="spell.prepared ? 'text-on-secondary-fixed' : 'text-on-surface'">
              <span class="opacity-70">Range:</span> {{ spell.range || 'Touch' }}
            </div>
            <div :class="spell.prepared ? 'text-on-secondary-fixed' : 'text-on-surface'">
              <span class="opacity-70">Comp:</span> {{ spell.components || 'V, S' }}
            </div>
            <div :class="spell.prepared ? 'text-on-secondary-fixed' : 'text-on-surface'">
              <span class="opacity-70">Dur:</span> {{ spell.duration || 'Instant' }}
            </div>
          </div>

          <p
            class="font-body-md text-body-md leading-snug line-clamp-4"
            :class="spell.prepared ? 'text-on-secondary-fixed' : 'text-on-surface'"
          >
            {{ spell.desc }}
          </p>

          <!-- Delete button -->
          <button
            v-if="store.isEditing"
            @click="removeSpell(spell.id!)"
            class="absolute bottom-2 right-2 text-error opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-error/10 rounded"
            title="Remove Spell"
          >
            <span class="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>

      <div
        v-if="filteredActiveSpells.length === 0"
        class="text-center py-12 text-on-surface-variant italic"
      >
        No spells found matching your search.
      </div>
    </section>

    <!-- Spell Library Modal -->
    <div
      v-if="showSpellLibrary && store.isEditing"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="toggleSpellLibrary"
    >
      <div
        class="bg-surface-container rounded-lg p-6 max-w-4xl max-h-[85vh] overflow-hidden flex flex-col w-full border border-outline-variant shadow-xl"
      >
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-headline-lg text-tertiary">Spell Library</h3>
          <button
            @click="toggleSpellLibrary"
            class="p-2 hover:bg-surface-variant rounded-full transition-colors"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div
          v-if="characterClass"
          class="bg-primary-container/30 border border-primary/20 rounded-lg p-3 mb-6"
        >
          <p class="text-sm text-primary">
            Showing spells available to the
            <strong class="uppercase tracking-wider">{{ characterClass }}</strong> class.
          </p>
        </div>

        <!-- Library Controls -->
        <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="relative">
            <span
              class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
              >search</span
            >
            <input
              v-model="searchFilter"
              type="text"
              placeholder="Filter by name, description, or school..."
              class="w-full bg-surface-container-high border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-on-surface focus:ring-tertiary focus:border-tertiary"
            />
          </div>

          <div class="flex gap-1 flex-wrap items-center">
            <button
              v-for="level in allowedLevels"
              :key="level"
              @click="filterByLevel = filterByLevel === level ? null : level"
              :class="[
                'px-3 py-1 text-xs rounded border transition-all font-bold',
                filterByLevel === level
                  ? 'bg-tertiary text-on-tertiary border-tertiary shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant border-outline-variant hover:border-tertiary/50',
              ]"
            >
              {{ level === 0 ? 'C' : level }}
            </button>
            <button
              v-if="searchFilter || filterByLevel !== null"
              @click="clearFilters"
              class="ml-2 text-xs text-primary hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        <!-- Library Scroll Area -->
        <div class="flex-grow overflow-y-auto pr-2 custom-scrollbar">
          <div
            v-if="librarySpells.length === 0"
            class="text-center text-on-surface-variant py-12 italic border border-dashed border-outline-variant rounded-xl"
          >
            No spells found matching your criteria.
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="spell in librarySpells"
              :key="spell.name"
              class="bg-surface-container-high border border-outline-variant rounded-lg p-4 hover:border-tertiary/50 transition-colors group relative"
            >
              <div class="flex justify-between items-start mb-1">
                <h5 class="font-bold text-on-surface group-hover:text-tertiary transition-colors">
                  {{ spell.name }}
                </h5>
                <span class="text-xs font-bold text-tertiary">{{
                  spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`
                }}</span>
              </div>
              <p class="text-xs text-on-surface-variant line-clamp-2 mb-3">{{ spell.desc }}</p>

              <div class="flex justify-between items-end">
                <div
                  class="flex gap-2 text-[10px] text-primary/70 uppercase font-bold tracking-tighter"
                >
                  <span v-if="spell.school">{{ spell.school }}</span>
                  <span v-if="spell.castingTime">{{ spell.castingTime }}</span>
                </div>
                <button
                  @click="addSpellFromLibrary(spell)"
                  class="bg-tertiary text-on-tertiary text-xs px-3 py-1 rounded font-bold hover:bg-tertiary-fixed transition-colors shadow-sm"
                >
                  Learn
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-6 pt-4 border-t border-outline-variant flex justify-between items-center">
          <div class="text-xs text-on-surface-variant font-medium">
            Found {{ librarySpells.length }} potential spells
          </div>
          <button
            @click="addManualSpell"
            class="text-primary font-bold text-sm flex items-center gap-2 hover:bg-primary-container/20 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <span class="material-symbols-outlined text-base">edit_note</span>
            Custom Spell
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-else>
    <div
      class="bg-secondary-container rounded-lg p-5 border border-tertiary-container/30 flex items-start gap-4 shadow-md w-full wood-bg text-on-surface"
    >
      <span
        class="material-symbols-outlined text-tertiary text-3xl shrink-0 mt-1"
        style="font-variation-settings: 'FILL' 1"
        >info</span
      >
      <div>
        <h4 class="font-headline-md text-headline-md text-on-surface mb-1">
          No Spellcasting Ability
        </h4>
        <p class="font-body-md text-body-md text-on-surface/90 leading-relaxed">
          You do not posses any spellcasting abilities
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wood-bg {
  background-color: var(--color-secondary-container);
  background-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.3));
}

.parchment-bg {
  background-color: var(--color-surface-container-high);
  color: var(--color-on-background);
}

/* Custom scrollbar for library */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--md-sys-color-outline-variant);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--md-sys-color-outline);
}

.spell-drag-handle {
  transition: opacity 0.2s ease;
}

.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
