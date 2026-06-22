<script setup lang="ts">
import CombatStats from '@/components/sheet/CombatStats.vue'
import AttacksList from '@/components/sheet/AttacksList.vue'
import DeathSaves from '@/components/sheet/DeathSaves.vue'
</script>

<template>
  <div class="flex-grow flex flex-col gap-8 w-full max-w-7xl mx-auto items-stretch">
    <!-- Component Abstraction Banner Example (Optional/Placeholder if needed) -->
    <!-- 
    <div class="bg-secondary-container rounded-lg p-5 border border-tertiary-container/30 flex items-start gap-4 shadow-md w-full">
      <span class="material-symbols-outlined text-tertiary text-3xl shrink-0 mt-1" style="font-variation-settings: 'FILL' 1;">info</span>
      <div>
        <h4 class="font-headline-md text-headline-md text-on-surface mb-1">Combat Notice</h4>
        <p class="font-body-md text-body-md text-on-surface/90 leading-relaxed">
           Manage your combat vitals, death saves, and available attacks below.
        </p>
      </div>
    </div>
    -->

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start w-full">
      <!-- Left Column: Combat Vitals & Death Saves -->
      <div class="flex flex-col gap-8 w-full">
        <CombatStats class="w-full" />
        <DeathSaves class="w-full" />
      </div>

      <!-- Right Column: Attacks -->
      <div class="flex flex-col gap-8 w-full">
        <!-- Wrap AttacksList in a stylized container to match Grimoire style if desired -->
        <div
          class="bg-surface-container rounded-lg p-6 border border-outline-variant shadow-sm w-full"
        >
          <AttacksList class="w-full" />
        </div>
      </div>
    </div>
  </div>
</template>
