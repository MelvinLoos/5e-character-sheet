import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import pluginPlaywright from 'eslint-plugin-playwright'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  // Migrated from legacy .eslintignore
  globalIgnores([
    '**/node_modules/**',
    '**/dist/**',
    '**/dist-ssr/**',
    '**/.netlify/**',
    '**/.cache/**',
    '**/.vite/**',
    '**/coverage/**',
    '**/.vscode/**',
    '**/*.log',
  ]),

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  // Project defaults; keep strict but allow targeted relaxations in overrides below
  {
    name: 'app/rules',
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'vue/multi-word-component-names': 'off',
    },
  },

  // Tests often use `any` for emitted payloads/shorthand and assertion-style
  // expressions; relax those rules for test files (migrated from .eslintrc.cjs).
  {
    name: 'app/test-overrides',
    files: ['test/**', 'test/**/*.ts', '**/*.spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-expressions': 'off',
    },
  },

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*', 'test/**/*.{test,spec}.{ts,js}'],
  },
  
  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
  skipFormatting,
)
