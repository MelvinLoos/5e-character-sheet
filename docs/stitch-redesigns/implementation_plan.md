# Midnight Scholar Redesign Implementation Plan

This plan details how we will integrate the "Midnight Scholar" design system and the downloaded redesigned screens into your existing Vue.js codebase.

## User Review Required

> [!WARNING]
> This is a major structural and visual overhaul. The app will change from a light "parchment" theme to a deep dark "Modern Cozy Study" theme. 
> Please review the steps below and approve before I begin writing code.

## Open Questions

> [!IMPORTANT]
> 1. The new design relies heavily on dark mode (`class="dark"`). Should we enforce dark mode permanently, or do you want to keep a toggle to switch between a light mode (if one exists) and the Midnight Scholar dark mode? (I recommend enforcing the new dark mode permanently for the best experience).
> 2. The designs introduce several new Google Fonts (EB Garamond, Manrope). Is it okay to add these via `<link>` tags in `index.html`?

## Proposed Changes

### Configuration & Global Styles

#### [MODIFY] `tailwind.config.js`
- Replace the existing `sheet-*` colors with the new "Midnight Scholar" color tokens (`surface`, `surface-dim`, `primary`, `primary-container`, `secondary`, `tertiary`, etc.).
- Update typography configurations to include `EB Garamond` for headings and `Manrope` for UI/body text.
- Configure border radius and spacing tokens to match the new design system.

#### [MODIFY] `index.html`
- Inject the Google Fonts for `EB Garamond` and `Manrope`.
- Set the base `class="dark"` on the `<html>` tag to enforce the dark mode theme.

#### [MODIFY] `src/assets/base.css` & `main.css`
- Apply the base background color (`bg-background` or `#15130b`) and default text color (`on-surface`).
- Remove any lingering references to the old parchment background styles.

### Component Refactoring

I will extract the exact HTML structure and Tailwind classes from the downloaded Stitch screens and merge them into the respective Vue components, maintaining your existing Vue reactivity and stores.

#### [MODIFY] `src/App.vue` & `src/components/CharacterSheet.vue`
- Restructure the main layout containers to match the 12-column grid and fluid container spacing from the "Midnight Scholar Character Manager" screen.
- Move away from the basic paper layout to the new dark dashboard layout.

#### [MODIFY] `src/components/sheet/AbilityScores.vue` & `SheetHeader.vue`
- **Source Screen:** `Midnight Scholar Character Manager.html`
- Implement the "Stat Orbs" with the wood-texture gradient and gold inset border for ability scores.
- Update the header to feature the classical serif fonts.

#### [MODIFY] `src/components/sheet/SkillsList.vue`
- **Source Screen:** `The Ledger of Expertise Skills.html`
- Update the skills layout to the new dark list format, utilizing `Manrope` for maximum legibility.

#### [MODIFY] `src/components/sheet/EquipmentBlock.vue`
- **Source Screen:** `The Survival Engine Inventory Workspace.html`
- Refactor the inventory list to match the new container style with 16px corner radii and soft shadows.

#### [MODIFY] `src/components/sheet/PersonalityBlock.vue`
- **Source Screen:** `The Narrative Canvas Lore & Identity.html`
- Update the backstory and personality trait sections.

#### [MODIFY] `src/components/sheet/FeaturesList.vue`
- **Source Screen:** `The Archive of Talents Feats.html`
- Apply the new "Chips/Tags" styling for traits.

#### [MODIFY] `src/components/sheet/SpellcastingBlock.vue` & `AttacksList.vue`
- **Source Screen:** `The Grimoire Arcane Study.html`

## Verification Plan

### Automated Tests
- We will run existing tests via `npm run test` or `vitest` to ensure component refactoring doesn't break data bindings.

### Manual Verification
- After updating the configuration, I will verify the base layout renders correctly.
- I will incrementally update components, checking them against the reference screenshots downloaded in `docs/stitch-redesigns/` to ensure visual fidelity.
