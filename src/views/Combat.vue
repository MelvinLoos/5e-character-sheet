<script setup lang="ts">
import CombatStats from '@/components/sheet/CombatStats.vue'
import AttacksList from '@/components/sheet/AttacksList.vue'
import DeathSaves from '@/components/sheet/DeathSaves.vue'
</script>

<template>
  <div class="flex flex-col gap-8">
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
      <div class="flex flex-col gap-8">
        <CombatStats />
        <DeathSaves />
      </div>
      <div class="flex flex-col gap-8">
        <AttacksList />
      </div>
    </div>
  </div>
</template>

