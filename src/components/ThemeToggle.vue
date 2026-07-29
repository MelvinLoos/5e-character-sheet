<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { STORAGE_KEYS } from '../constants/storage-keys'

const isDark = ref(true)

function loadTheme(): string {
  const legacyTheme = localStorage.getItem('heroes-guild-theme')
  if (legacyTheme) {
    localStorage.setItem(STORAGE_KEYS.APP_THEME, legacyTheme)
    localStorage.removeItem('heroes-guild-theme')
    return legacyTheme
  }
  return localStorage.getItem(STORAGE_KEYS.APP_THEME) || 'dark'
}

function applyTheme(dark: boolean) {
  const html = document.documentElement
  if (dark) {
    html.classList.add('dark')
    html.classList.remove('light')
  } else {
    html.classList.add('light')
    html.classList.remove('dark')
  }
}

function toggleTheme() {
  isDark.value = !isDark.value
  applyTheme(isDark.value)
  try {
    localStorage.setItem(STORAGE_KEYS.APP_THEME, isDark.value ? 'dark' : 'light')
  } catch {
    // Storage may be unavailable in private mode or restricted contexts.
  }
}

onMounted(() => {
  let preferred: string | null = null
  try {
    preferred = loadTheme()
  } catch {
    // Ignore storage errors.
  }

  if (preferred) {
    isDark.value = preferred !== 'light'
  } else {
    isDark.value = !window.matchMedia('(prefers-color-scheme: light)').matches
  }

  applyTheme(isDark.value)
})
</script>

<template>
  <button
    type="button"
    :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    class="fixed top-16 right-4 z-20 md:top-4 md:right-4 md:z-50 p-3 rounded-full border border-outline-variant bg-surface-container-high text-on-surface shadow-sm hover:bg-surface-container-highest focus:outline-none focus:ring-2 focus:ring-tertiary focus:ring-offset-2 focus:ring-offset-background transition-colors print:hidden flex items-center justify-center"
    @click="toggleTheme"
  >
    <svg
      v-if="isDark"
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      class="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  </button>
</template>
