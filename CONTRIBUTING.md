# Contributing & Architectural Conventions

Welcome! This document outlines the architectural patterns, state management rules, and quality assurance workflows required when developing or using AI coding agents on this D&D Character Sheet application.

---

## 1. Directory Structure & Layers

We maintain a strict separation between business logic, third-party infrastructure, and UI presentation:

- `src/domain/`: Core D&D rules, schema validation, and local library persistence (`characterService.ts`, `schemaService.ts`). Import using `import { ... } from '@/domain'`.
- `src/infra/`: External third-party integrations, API clients, and network communication (`aiService.ts`, `apiService.ts`, `sharingService.ts`). Import using `import { ... } from '@/infra'`.
- `src/stores/`: Pinia state stores. Divided into single-responsibility domain stores.
- `src/composables/`: Reusable Vue 3 composables containing stateless D&D domain math (`useSkills`, `useCombat`, `useSpellcasting`, `useInventory`).
- `src/constants/storage-keys.ts`: Centralized registry for all `localStorage` and `sessionStorage` keys.
- `src/components/`: Reusable UI components. **Automatically imported** via `unplugin-vue-components`.

---

## 2. AI Coding Agent Protocol

When using AI coding assistants (Cursor, GitHub Copilot, local LLMs) to modify this codebase, the agent MUST adhere to these non-negotiable rules:

1. **No Implicit Watchers in Stores:** Never use Pinia `watch()` blocks inside store factories to trigger side effects. Always create and call **explicit actions** (e.g., `applyClassChange()`, `recalculateAll()`).
2. **Domain Math Extracted:** Never write complex D&D calculation math directly inside `.vue` components. Extract calculations into composables or pure utility functions (`src/utils/characterMutations.ts`).
3. **No Manual UI Component Imports:** Do not add `import MyComponent from '@/components/MyComponent.vue'` inside Vue files. Reusable components under `src/components/` are auto-imported.
4. **No Magic Storage Strings:** Never hardcode browser storage key strings. Always import and use `STORAGE_KEYS` or `SESSION_KEYS` from `@/constants/storage-keys`.
5. **Strict Type Safety:** Never use `any` or `unknown` to bypass TypeScript rules. All character models must align with `@/types/character`.

---

## 3. State Management Architecture

Our Pinia state is split into core stores:

- `useCharacterStore`: Manages core character identity (`currentCharacterData`), library CRUD, file I/O, modal states, and explicit mutation triggers.
- `useProgressionStore`: Manages leveling math, proficiency bonuses, Hit Points, ability modifiers, and point-buy calculator state.
- `useSpellStore`: Manages spellcasting ability modifiers, spell save DCs, attack bonuses, and feature usage limits.

**Rule:** UI components should import `useProgressionStore` or `useSpellStore` for derived stats, and only import `useCharacterStore` when mutating core character identity or invoking explicit actions.

---

## 4. Mandatory Quad-Check Verification Pipeline

Before committing any code or submitting a pull request, you MUST run our complete quality assurance pipeline and achieve a 100% green pass:

1. **TypeScript Type Check:**
   ```bash
   npm run type-check
   ```
   *Must report ZERO compilation errors.*

2. **Vitest Unit Tests:**
   ```bash
   npm run test:unit
   ```
   *All unit tests (263+ tests across 23+ files) must pass.*

3. **Playwright E2E Tests:**
   ```bash
   npm run test:e2e
   ```
   *All browser end-to-end user journeys must pass.*

4. **Code Linting:**
   ```bash
   npm run lint
   ```
   *Must report zero linting or formatting errors.*