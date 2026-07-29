<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'

const store = useCharacterStore()
</script>

<template>
  <!-- Left Column (Wider, takes lg:col-span-2) -->
  <div class="lg:col-span-2 space-y-card-gap">
    <!-- Job In The Party -->
    <section
      class="bg-surface-container-high rounded-lg border border-outline-variant p-6 shadow-sm"
    >
      <div class="flex items-center gap-3 mb-4 border-b border-outline-variant/50 pb-3">
        <span class="material-symbols-outlined text-tertiary">group_work</span>
        <h3 class="font-headline-md text-headline-md text-on-background">Job In The Party</h3>
      </div>

      <textarea
        v-model="store.currentCharacterData.jobInParty"
        class="w-full bg-surface-dim border border-outline-variant rounded p-4 text-on-surface font-body-md focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all textarea-styled"
        placeholder="e.g., The arcane researcher who provides historical context and ritual support..."
      ></textarea>
    </section>

    <!-- Backstory -->
    <section
      class="parchment-texture rounded-lg border border-[#cca72f] p-8 shadow-md relative overflow-hidden"
    >
      <!-- Decorative corners -->
      <div class="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#574400]"></div>
      <div class="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#574400]"></div>
      <div class="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#574400]"></div>
      <div class="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#574400]"></div>

      <div class="flex items-center gap-3 mb-6">
        <span
          class="material-symbols-outlined text-[#574400] text-3xl"
          style="font-variation-settings: 'FILL' 1"
          >menu_book</span
        >
        <h3
          class="font-display-lg text-headline-lg text-[#241a00] border-b-2 border-[#cca72f] pb-1 inline-block"
        >
          Backstory
        </h3>
      </div>

      <textarea
        v-model="store.currentCharacterData.personality.notes"
        class="w-full bg-transparent border border-[#cca72f]/30 rounded p-4 text-[#241a00] font-headline-md text-lg leading-relaxed focus:border-[#574400] outline-none transition-all"
        placeholder="Begin your tale here... Where were you born? What drove you to the life of an aspirant?"
        style="min-height: 400px; font-family: 'EB Garamond', serif"
      ></textarea>
    </section>
  </div>

  <!-- Right Column (Lore & Identity, takes lg:col-span-1) -->
  <div class="lg:col-span-1 space-y-gutter">
    <section
      class="bg-surface-container-high rounded-lg border border-outline-variant p-6 shadow-sm h-full flex flex-col"
    >
      <div class="flex items-center gap-3 mb-6 border-b border-tertiary/30 pb-3">
        <span class="material-symbols-outlined text-tertiary">psychology</span>
        <h3 class="font-headline-md text-headline-md text-tertiary">Lore &amp; Identity</h3>
      </div>

      <div class="space-y-6 flex-1">
        <!-- Personality Traits -->
        <div class="group">
          <label
            class="font-label-md text-label-md text-on-surface-variant mb-2 block uppercase tracking-wider group-focus-within:text-primary transition-colors flex items-center justify-between"
          >
            Personality Traits
            <span class="material-symbols-outlined text-xs opacity-50">edit_note</span>
          </label>
          <textarea
            v-if="store.isEditing"
            v-model="store.currentCharacterData.personality.traits"
            class="w-full bg-surface-dim border border-outline-variant rounded p-3 text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all h-24"
            placeholder="I am incredibly awkward in social situations, preferring books to people."
          ></textarea>
          <p
            v-else
            class="text-on-surface font-body-md italic bg-surface-dim border border-outline-variant rounded p-3"
          >
            {{ store.currentCharacterData.personality.traits || 'None' }}
          </p>
        </div>

        <!-- Ideals -->
        <div class="group">
          <label
            class="font-label-md text-label-md text-on-surface-variant mb-2 block uppercase tracking-wider group-focus-within:text-tertiary transition-colors flex items-center justify-between"
          >
            Ideals
            <span class="material-symbols-outlined text-xs opacity-50">star</span>
          </label>
          <textarea
            v-if="store.isEditing"
            v-model="store.currentCharacterData.personality.ideal"
            class="w-full bg-surface-dim border border-outline-variant rounded p-3 text-on-surface font-body-md focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all h-24"
            placeholder="Knowledge. The path to power and self-improvement is through knowledge."
          ></textarea>
          <p
            v-else
            class="text-on-surface font-body-md italic bg-surface-dim border border-outline-variant rounded p-3"
          >
            {{ store.currentCharacterData.personality.ideal || 'None' }}
          </p>
        </div>

        <!-- Bonds -->
        <div class="group">
          <label
            class="font-label-md text-label-md text-on-surface-variant mb-2 block uppercase tracking-wider group-focus-within:text-primary-fixed-dim transition-colors flex items-center justify-between"
          >
            Bonds
            <span class="material-symbols-outlined text-xs opacity-50">link</span>
          </label>
          <textarea
            v-if="store.isEditing"
            v-model="store.currentCharacterData.personality.bond"
            class="w-full bg-surface-dim border border-outline-variant rounded p-3 text-on-surface font-body-md focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary-fixed-dim outline-none transition-all h-24"
            placeholder="I sold my soul for knowledge. I hope to do great deeds and win it back."
          ></textarea>
          <p
            v-else
            class="text-on-surface font-body-md italic bg-surface-dim border border-outline-variant rounded p-3"
          >
            {{ store.currentCharacterData.personality.bond || 'None' }}
          </p>
        </div>

        <!-- Flaws -->
        <div class="group">
          <label
            class="font-label-md text-label-md text-on-surface-variant mb-2 block uppercase tracking-wider group-focus-within:text-error transition-colors flex items-center justify-between"
          >
            Flaws
            <span class="material-symbols-outlined text-xs opacity-50">broken_image</span>
          </label>
          <textarea
            v-if="store.isEditing"
            v-model="store.currentCharacterData.personality.flaw"
            class="w-full bg-surface-dim border border-outline-variant rounded p-3 text-on-surface font-body-md focus:border-error focus:ring-1 focus:ring-error outline-none transition-all h-24"
            placeholder="I am easily distracted by the promise of information."
          ></textarea>
          <p
            v-else
            class="text-on-surface font-body-md italic bg-surface-dim border border-outline-variant rounded p-3"
          >
            {{ store.currentCharacterData.personality.flaw || 'None' }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
