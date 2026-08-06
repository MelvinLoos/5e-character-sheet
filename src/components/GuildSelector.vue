<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useGuildStore } from '@/stores/guildStore'

const authStore = useAuthStore()
const guildStore = useGuildStore()

const selectedGuildId = computed<string | null>({
  get: () => guildStore.activeGuildId,
  set: (value) => guildStore.setActiveGuild(value || null),
})

onMounted(() => {
  if (authStore.isAuthenticated) {
    guildStore.initialize()
  }
})
</script>

<template>
  <div v-if="authStore.isAuthenticated" class="guild-selector px-6 py-3 border-t border-outline-variant/30">
    <!-- Loading -->
    <div v-if="guildStore.isLoading" class="flex items-center justify-center gap-2 py-2">
      <span class="material-symbols-outlined animate-spin text-sm">progress_activity</span>
      <span class="text-on-surface-variant font-label-sm text-label-sm">Loading guilds…</span>
    </div>

    <!-- Error -->
    <div v-else-if="guildStore.error" class="text-error font-label-sm text-label-sm py-1">
      {{ guildStore.error }}
    </div>

    <!-- Guild Selector -->
    <div v-else class="flex flex-col gap-2">
      <label class="block font-label-md text-label-md text-tertiary">Active Server</label>
      <select
        v-model="selectedGuildId"
        class="w-full bg-surface-variant border border-outline-variant rounded p-2 text-on-surface font-body-md text-sm focus:border-tertiary focus:ring-1 focus:ring-tertiary"
        :disabled="guildStore.isLoading"
      >
        <option :value="null">All Guilds</option>
        <option
          v-for="guild in guildStore.visibleGuilds"
          :key="guild.id"
          :value="guild.id"
        >
          {{ guild.name }}
        </option>
      </select>
    </div>
  </div>
</template>