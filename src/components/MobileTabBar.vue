<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import CompletionBadge from './ui/CompletionBadge.vue'
import { useCharacterCompletion } from '@/composables/useCharacterCompletion'
import { NAV_LINKS } from '@/constants/navigation'

const route = useRoute()

defineEmits<{
  showMore: []
}>()

const { badges } = useCharacterCompletion()

const navEntries = computed(() =>
  NAV_LINKS.map((link) => ({
    ...link,
    badge: badges.value[link.name],
  })),
)

const queryParams = computed(() => {
  return route.query.id ? { query: { id: route.query.id } } : {}
})
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 h-16 box-content pb-[env(safe-area-inset-bottom)] bg-surface-container/95 backdrop-blur-md border-t border-outline-variant shadow-[0_-4px_20px_rgba(0,0,0,0.25)] z-50 md:hidden"
  >
    <div class="flex items-center justify-around h-full max-w-lg mx-auto">
      <router-link
        v-for="entry in navEntries.slice(0, 3)"
        :key="entry.name"
        :to="{ name: entry.name, ...queryParams }"
        class="flex flex-col items-center justify-center flex-1 gap-0.5 py-2 transition-all duration-200 ease-out active:scale-95 select-none"
        :class="
          route.name === entry.name
            ? 'text-tertiary'
            : 'text-on-surface-variant hover:text-on-surface'
        "
        :aria-label="entry.badge ? `${entry.label} — ${entry.badge.label}` : undefined"
        :title="entry.badge?.label"
      >
        <span class="relative">
          <span class="material-symbols-outlined text-[1.35rem]" aria-hidden="true">{{ entry.icon }}</span>
          <CompletionBadge
            v-if="entry.badge"
            :badge="entry.badge"
            class="absolute -top-1.5 -right-2"
          />
        </span>
        <span class="text-[10px] font-label-md leading-none">{{ entry.label }}</span>
      </router-link>

      <button
        @click="$emit('showMore')"
        class="relative -top-3 flex flex-col items-center justify-center w-14 h-14 rounded-full bg-tertiary text-on-tertiary shadow-[0_4px_14px_rgba(0,0,0,0.35)] hover:bg-tertiary-fixed hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(0,0,0,0.4)] active:translate-y-0 active:scale-95 transition-all duration-200 ease-out select-none"
        title="More Actions"
        aria-label="More Actions"
      >
        <span class="material-symbols-outlined text-[1.6rem]" aria-hidden="true">more_horiz</span>
      </button>

      <router-link
        v-for="entry in navEntries.slice(3)"
        :key="entry.name"
        :to="{ name: entry.name, ...queryParams }"
        class="flex flex-col items-center justify-center flex-1 gap-0.5 py-2 transition-all duration-200 ease-out active:scale-95 select-none"
        :class="
          route.name === entry.name
            ? 'text-tertiary'
            : 'text-on-surface-variant hover:text-on-surface'
        "
        :aria-label="entry.badge ? `${entry.label} — ${entry.badge.label}` : undefined"
        :title="entry.badge?.label"
      >
        <span class="relative">
          <span class="material-symbols-outlined text-[1.35rem]" aria-hidden="true">{{ entry.icon }}</span>
          <CompletionBadge
            v-if="entry.badge"
            :badge="entry.badge"
            class="absolute -top-1.5 -right-2"
          />
        </span>
        <span class="text-[10px] font-label-md leading-none">{{ entry.label }}</span>
      </router-link>
    </div>
  </nav>
</template>
