<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const navLinks = [
  { name: 'identity', label: 'Identity', icon: 'person' },
  { name: 'skills', label: 'Skills', icon: 'school' },
  { name: 'feats', label: 'Feats', icon: 'military_tech' },
  { name: 'spells', label: 'Spells', icon: 'auto_stories' },
  { name: 'inventory', label: 'Inventory', icon: 'backpack' },
  { name: 'narrative', label: 'Narrative', icon: 'history_edu' },
]

const queryParams = computed(() => {
  return route.query.id ? { query: { id: route.query.id } } : {}
})
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 h-16 bg-surface-container/95 backdrop-blur-md border-t border-outline-variant shadow-[0_-4px_20px_rgba(0,0,0,0.25)] z-50 md:hidden"
  >
    <div class="flex items-center justify-around h-full max-w-lg mx-auto">
      <router-link
        v-for="link in navLinks"
        :key="link.name"
        :to="{ name: link.name, ...queryParams }"
        class="flex flex-col items-center justify-center flex-1 gap-0.5 py-2 transition-all duration-200 ease-out active:scale-95 select-none"
        :class="
          route.name === link.name
            ? 'text-tertiary'
            : 'text-on-surface-variant hover:text-on-surface'
        "
      >
        <span class="material-symbols-outlined text-[1.35rem]">{{ link.icon }}</span>
        <span class="text-[10px] font-label-md leading-none">{{ link.label }}</span>
      </router-link>
    </div>
  </nav>
</template>