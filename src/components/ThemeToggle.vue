<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { STORAGE_KEYS } from '../constants/storage-keys'

const isDark = ref(true)

const THEME_COLORS = { dark: '#1a3c40', light: '#fdf6e3' } as const

function loadTheme(): string | null {
  const legacyTheme = localStorage.getItem('heroes-guild-theme')
  if (legacyTheme) {
    localStorage.setItem(STORAGE_KEYS.APP_THEME, legacyTheme)
    localStorage.removeItem('heroes-guild-theme')
    return legacyTheme
  }
  return localStorage.getItem(STORAGE_KEYS.APP_THEME)
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
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? THEME_COLORS.dark : THEME_COLORS.light)
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
    isDark.value = !(window.matchMedia?.('(prefers-color-scheme: light)').matches ?? false)
  }

  applyTheme(isDark.value)
})
</script>

<template>
  <button
    type="button"
    :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    :title="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
    class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-on-surface-variant transition-colors duration-150 hover:bg-surface-variant hover:text-on-surface active:scale-95 print:hidden select-none"
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
