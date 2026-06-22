<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'

const store = useCharacterStore()
</script>

<template>
  <section class="bg-surface-container-high rounded-lg border border-outline-variant p-6 shadow-sm h-full flex flex-col mb-4">
    <div class="flex items-center gap-3 mb-6 border-b border-tertiary/30 pb-3">
      <span class="material-symbols-outlined text-tertiary">psychology</span>
      <h3 class="font-headline-md text-headline-md text-tertiary">Lore &amp; Identity</h3>
    </div>
    <div class="space-y-6 flex-1">
      <!-- Personality Traits -->
      <div class="group">
        <label class="font-label-md text-label-md text-on-surface-variant mb-2 block uppercase tracking-wider group-focus-within:text-primary transition-colors flex items-center justify-between">
          Personality Traits
          <span class="material-symbols-outlined text-xs opacity-50">edit_note</span>
        </label>
        <textarea v-if="store.isEditing" v-model="store.currentCharacterData.personality.traits" class="w-full bg-surface-dim border border-outline-variant rounded p-3 text-on-surface font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all h-24" placeholder="I am incredibly awkward in social situations, preferring books to people."></textarea>
        <p v-else class="text-on-surface font-body-md italic">{{ store.currentCharacterData.personality.traits || 'None' }}</p>
      </div>
      <!-- Ideals -->
      <div class="group">
        <label class="font-label-md text-label-md text-on-surface-variant mb-2 block uppercase tracking-wider group-focus-within:text-tertiary transition-colors flex items-center justify-between">
          Ideals
          <span class="material-symbols-outlined text-xs opacity-50">star</span>
        </label>
        <textarea v-if="store.isEditing" v-model="store.currentCharacterData.personality.ideal" class="w-full bg-surface-dim border border-outline-variant rounded p-3 text-on-surface font-body-md focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none transition-all h-24" placeholder="Knowledge. The path to power and self-improvement is through knowledge."></textarea>
        <p v-else class="text-on-surface font-body-md italic">{{ store.currentCharacterData.personality.ideal || 'None' }}</p>
      </div>
      <!-- Bonds -->
      <div class="group">
        <label class="font-label-md text-label-md text-on-surface-variant mb-2 block uppercase tracking-wider group-focus-within:text-primary-fixed-dim transition-colors flex items-center justify-between">
          Bonds
          <span class="material-symbols-outlined text-xs opacity-50">link</span>
        </label>
        <textarea v-if="store.isEditing" v-model="store.currentCharacterData.personality.bond" class="w-full bg-surface-dim border border-outline-variant rounded p-3 text-on-surface font-body-md focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary-fixed-dim outline-none transition-all h-24" placeholder="I sold my soul for knowledge. I hope to do great deeds and win it back."></textarea>
        <p v-else class="text-on-surface font-body-md italic">{{ store.currentCharacterData.personality.bond || 'None' }}</p>
      </div>
      <!-- Flaws -->
      <div class="group">
        <label class="font-label-md text-label-md text-on-surface-variant mb-2 block uppercase tracking-wider group-focus-within:text-error transition-colors flex items-center justify-between">
          Flaws
          <span class="material-symbols-outlined text-xs opacity-50">broken_image</span>
        </label>
        <textarea v-if="store.isEditing" v-model="store.currentCharacterData.personality.flaw" class="w-full bg-surface-dim border border-outline-variant rounded p-3 text-on-surface font-body-md focus:border-error focus:ring-1 focus:ring-error outline-none transition-all h-24" placeholder="I am easily distracted by the promise of information."></textarea>
        <p v-else class="text-on-surface font-body-md italic">{{ store.currentCharacterData.personality.flaw || 'None' }}</p>
      </div>
      <!-- Notes -->
      <div class="group" v-if="store.isEditing || store.currentCharacterData.personality.notes">
        <label class="font-label-md text-label-md text-on-surface-variant mb-2 block uppercase tracking-wider group-focus-within:text-secondary-fixed transition-colors flex items-center justify-between">
          Notes
          <span class="material-symbols-outlined text-xs opacity-50">notes</span>
        </label>
        <textarea v-if="store.isEditing" v-model="store.currentCharacterData.personality.notes" class="w-full bg-surface-dim border border-outline-variant rounded p-3 text-on-surface font-body-md focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed outline-none transition-all h-24" placeholder="Additional personality notes or roleplaying cues..."></textarea>
        <p v-else class="text-on-surface font-body-md italic">{{ store.currentCharacterData.personality.notes }}</p>
      </div>
    </div>
  </section>
</template>
