---
name: Character Sheet
description: A 5e (2024) character sheet for Heroes Guild players, built to be read at a phone-sized table or on printed A4.
colors:
  dark-background: "#15130b"
  dark-surface-container: "#222017"
  dark-surface-container-high: "#2c2a21"
  dark-on-surface: "#e8e2d4"
  dark-on-surface-variant: "#c1c8c9"
  dark-outline-variant: "#414849"
  dark-primary-teal: "#aacdd1"
  dark-primary-container: "#1a3c40"
  dark-tertiary-gold: "#eac249"
  dark-on-tertiary: "#3d2f00"
  dark-secondary-rose: "#e7bdb1"
  dark-error: "#f05252"
  dark-error-solid: "#dc2626"
  light-background: "#fdf6e3"
  light-surface-container: "#f4ecd8"
  light-surface-container-high: "#efe5cf"
  light-on-surface: "#3a2d21"
  light-on-surface-variant: "#5c4d3d"
  light-outline: "#6f6556"
  light-outline-variant: "#c9b7a2"
  light-primary-brown: "#5c4d3d"
  light-secondary-oxblood: "#8c1d1d"
  light-tertiary-bronze: "#6e5214"
  light-on-tertiary: "#fdf6e3"
  light-error-container: "#ffdad6"
typography:
  display-lg:
    fontFamily: "EB Garamond, serif"
    fontSize: "48px"
    fontWeight: 600
    lineHeight: "56px"
    letterSpacing: "-0.02em"
  headline-lg:
    fontFamily: "EB Garamond, serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: "40px"
  headline-md:
    fontFamily: "EB Garamond, serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: "32px"
  headline-sm:
    fontFamily: "EB Garamond, serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: "28px"
  body-lg:
    fontFamily: "Manrope, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "28px"
  body-md:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  body-sm:
    fontFamily: "Manrope, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  label-lg:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "24px"
    letterSpacing: "0.05em"
  label-md:
    fontFamily: "Manrope, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "20px"
    letterSpacing: "0.05em"
  label-sm:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
    letterSpacing: "0.05em"
rounded:
  DEFAULT: "4px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  unit: "8px"
  gutter: "16px"
  card-gap: "20px"
  container-padding: "24px"
  touch-target: "44px"
components:
  button-primary:
    backgroundColor: "{colors.dark-tertiary-gold}"
    textColor: "{colors.dark-on-tertiary}"
    rounded: "{rounded.DEFAULT}"
    typography: "{typography.label-md}"
    padding: "8px 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.dark-surface-container-high}"
    textColor: "{colors.dark-on-surface-variant}"
    rounded: "{rounded.DEFAULT}"
    typography: "{typography.label-md}"
    padding: "8px 16px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.dark-error-solid}"
    textColor: "#ffffff"
    rounded: "{rounded.DEFAULT}"
    height: "44px"
  radio-card:
    backgroundColor: "{colors.dark-surface-container}"
    textColor: "{colors.dark-on-surface}"
    rounded: "{rounded.xl}"
    padding: "16px"
  text-field:
    backgroundColor: "{colors.dark-surface-container-high}"
    textColor: "{colors.dark-on-surface}"
    rounded: "{rounded.DEFAULT}"
    padding: "8px 12px"
    height: "44px"
  modal:
    backgroundColor: "{colors.dark-surface-container}"
    textColor: "{colors.dark-on-surface}"
    padding: "16px 24px"
  stat-orb:
    backgroundColor: "{colors.dark-surface-container-high}"
    textColor: "{colors.dark-on-surface}"
    rounded: "{rounded.full}"
---

# Design System: Character Sheet

This file records the system as it ships in `src/assets/main.css`, `tailwind.config.js` and `src/components/**`. It documents what is in the code, including its inconsistencies. Component token entries use dark-theme values (the `:root` default); the light theme redefines the same CSS variables.

## Open decisions (read first)

These are unresolved. Do not treat any of them as settled when generating new UI.

- **Brand hue is undecided.** Dark is teal primary plus gold tertiary on near-black olive. Light is parchment with brown primary, oxblood secondary and bronze tertiary. The two themes do not share a primary hue, and the role names (primary, secondary, tertiary) do not map to the same colours across themes. One brand identity has not been chosen.
- **MD3 token sprawl was not consolidated.** `tailwind.config.js` still maps about 50 Material Design 3 `--color-*` roles (`*-fixed`, `*-fixed-dim`, `inverse-*`, `surface-dim`, `surface-bright`, `surface-tint` and others) plus 7 legacy `sheet-*` tokens. Phase 1 fixed contrast and added `error-solid`, but did not merge or remove the surplus. New code should use only the roles listed under Colors.
- **Midnight Scholar (`docs/stitch-redesigns`) is not the approved direction.** It is an exploration, not a spec. Do not lift colours or layouts from it.
- **Raw colours remain in code.** Emblem SVGs (`src/data/optionEmblems.ts`) hard-code hex per class, species and background. Some glow and shadow values in `main.css` (`rgba(234,194,73,...)`, `rgba(139,69,19,...)`) and the print block are literals, not tokens.

## Overview

**Creative North Star: "The Table Ledger".** A parchment-and-ink character record that holds up under lamplight on a phone and in print on A4. The serif carries the fantasy; everything operational is plain, legible sans.

**Key Characteristics:**
- Two themes toggled by a `dark` / `light` class on `html`. Dark is the default and is where the gold accent lives.
- Fantasy lives in type (EB Garamond headings, IM Fell English SC section headers) and in emblem art, not in decoration around controls.
- Controls are flat, tonal and quiet. Gold (dark) or bronze (light) marks the one primary action and the focus ring.
- A real printed sheet (`PrintableSheet.vue`) is a first-class output and ignores the app theme.
- Play on a phone is a primary scene: large tap targets, a bottom tab bar, the character name in the header.

## Colors

Roles resolve from CSS variables (`--color-*`) in `src/assets/main.css` and are exposed as Tailwind colours of the same name. Use roles, never hex.

### Dark theme (default)
- **Olive Night** (`#15130b`): `background` and `surface`. The page.
- **Lamp Panel** (`#222017`, `#2c2a21`): `surface-container` and `surface-container-high`. Cards, modals, inputs.
- **Bone Ink** (`#e8e2d4`): `on-surface`, body text. `on-surface-variant` (`#c1c8c9`) is secondary text.
- **Muted Teal** (`#aacdd1`): `primary`, with `primary-container` `#1a3c40`. Tonal chrome and borders, not the main action.
- **Lamp Gold** (`#eac249`): `tertiary`. Primary button fill (text `on-tertiary` `#3d2f00`), focus ring, modal titles, selected radio-card border, section headers.
- **Dusty Rose** (`#e7bdb1`): `secondary`. Sparse.
- **Alarm Red** (`#f05252` text, `#dc2626` fill with white text): `error` and `error-solid`.

### Light theme
- **Parchment** (`#fdf6e3`): `background` and `surface`. Containers step through `#f7f0e0`, `#f4ecd8`, `#efe5cf`, `#eaddc7`.
- **Walnut Ink** (`#3a2d21`): `on-surface`. `on-surface-variant` is `#5c4d3d`.
- **Bronze** (`#6e5214`): `tertiary`. Keeps the dark theme's role (primary fill, focus ring, headings) at AA contrast on parchment, with `on-tertiary` `#fdf6e3`.
- **Oxblood** (`#8c1d1d`): `secondary`, `error`, `error-solid` and `sheet-red`. One colour does three jobs in light.
- **Brown** (`#5c4d3d`): `primary`.
- `outline` is `#6f6556` (darkened in phase 1 for 3:1 control borders); `outline-variant` is `#c9b7a2`.

**The Role Rule.** Pick a colour by its role (`tertiary` for the action and focus, `on-surface-variant` for secondary text, `error` for errors). A role that exists in the tailwind config but is not listed here is probably unused; do not reach for it.

**The Two-Theme Caveat.** `primary` is teal in dark and brown in light; `tertiary` is gold in dark and bronze in light. Design with the role, check both themes, and do not hard-code either hue. This is the open brand question above.

## Typography

- **EB Garamond** (variable 400-800, italic): `display-*`, `headline-*`, ability scores, feature and spell titles. Alias `font-garamond`.
- **Manrope** (variable 200-800): `body-*` and `label-*`. All UI text, forms, buttons, tabs.
- **IM Fell English SC**: `font-fell`. Sheet section headers only (`.section-header`), in tertiary with a 2px `sheet-accent` underline.
- **Material Symbols Outlined**: the single icon family (variable font, `display=block`). Icons are `aria-hidden` and sit beside a text label or inside a labelled button.
- Scale: display 48/56, headline-lg 32/40, headline-md 24/32, headline-sm 20/28, body-lg 18/28, body-md 16/24, body-sm 14/20, label-lg 16/24, label-md 14/20, label-sm 12/16. Labels use `0.05em` tracking and weight 600.
- Mobile tab labels are 11px (`text-[11px]`), below `label-sm`. A known exception.
- Fonts load from Google Fonts in `index.html`; none are self-hosted.

**The Serif-Names, Sans-Does Rule.** Names, titles and numbers that feel like the character are serif. Anything the user taps, fills or reads as instruction is Manrope.

## Layout

- Spacing keys: `unit` 8px, `gutter` 16px, `card-gap` 20px, `container-padding` 24px; otherwise default Tailwind steps.
- Sheet content is capped at `max-w-4xl` (`.sheet-wrapper`). Desktop has a side panel (`ControlPanel`); below `md` the layout is a fixed mobile header, a fixed 64px bottom tab bar (`MobileTabBar`) and a "More" bottom sheet. Content gets `pb-mobile-safe` (6rem plus the safe-area inset).
- Mobile Play view (phase 2): character name in the header, vitals and tap-to-roll values on the first screen, Play separate from building.
- Create flow (phase 3): a stepped wizard (`CharacterCreationWizard.vue`) with a progress bar, one decision per step and a bottom action bar that is fixed on mobile and static from `md`.
- `scroll-padding-top: 5rem` and `scroll-padding-bottom: 6rem` keep focused controls clear of the fixed bars.
- Z-scale (tailwind `zIndex`): raised 10, sticky 20, nav 30, overlay 40, modal 50, toast 60. Older components still use literal `z-50` and `z-[100]` (grain overlay).
- `@tailwindcss/container-queries` is enabled.

## Elevation & Depth

Tonal layering first, shadow second. Depth in dark comes from stepping `surface-container-*`; shadows are soft.

- `elevation-1` to `elevation-4`: `0 1px 3px` up to `0 14px 28px`, black at 12-25%. Modals use `elevation-4`.
- The sheet container uses a warm shadow (`0 8px 32px rgba(139,69,19,.15)`) with an inset highlight. Stat orbs use `0 8px 24px rgba(0,0,0,.25)` plus an inset top highlight.
- The active edit toggle glows gold (`.edit-toggle-btn--active`, 2s pulse). It is the only looping animation.
- A viewport grain (`.grain`, 3% opacity, `print:hidden`) and a parchment noise texture (`.parchment-texture`, 8%) add paper feel; both are decorative and non-interactive.
- Modal backdrop is `bg-black/60` with `backdrop-blur-sm`; the tab bar is `bg-surface-container/95` with `backdrop-blur-md`. Blur keeps content legible behind fixed layers.

## Shapes

Gently rounded. Controls and buttons are 4px (`DEFAULT`). Cards, radio cards and panels are 8-12px (`lg`, `xl`). Orbs, pills, progress bars and dots are `full`. Selection is a border and tint change. Sheet inputs and checkboxes are squarer (`rounded-sm`), echoing the paper form.

## Components

### PressableButton
`src/components/ui/PressableButton.vue`. Variants `primary` (one per screen: `bg-tertiary text-on-tertiary`), `secondary` (`surface-variant` with `outline-variant` border), `ghost`, `danger` (`error-solid`) and `plain` (unstyled shell). Size `md` is `min-h-11` (44px); `sm` is `min-h-9` (36px, below the touch minimum, desktop-dense surfaces only). Hover lifts 2px only on `(hover: hover)`; press scales to 0.95; disabled is flat at 50% opacity. `loading` shows a spinner and sets `aria-busy`.

### Text and number fields
`fieldStyles.ts`: 44px minimum height, `surface-container-high` fill, `outline-variant` border that turns `tertiary` on focus, `error` border when invalid, placeholder in `on-surface-variant` at 80%. Wrap fields in `FormField` for a visible label.

### Radio cards (creation wizard)
`CharacterCreationWizard.vue` (`radioCard` plus `cardState`). A native `input[type=radio]` inside a `rounded-xl` label. Selected: `border-tertiary bg-tertiary/10`. Unselected: `border-outline-variant`, hover `border-tertiary/60`. Keyboard focus: 2px `tertiary` ring via `has-[:focus-visible]`. Each group is a `role="radiogroup"` with an `aria-label`; one column on phones, two from `sm`.

### OptionVisual and emblems
`OptionVisual.vue` with `src/data/optionEmblems.ts` renders an inline SVG emblem per class, species and background (each with its own accent). Without an emblem, a 56px tertiary-bordered circle holds a Garamond initial with the category as a `label-sm` caption. Emblems are illustration, the one place with a wide hard-coded palette.

### Stat orbs
`AbilityScores.vue`. Round (`aspect-[1]`, `rounded-full`) tiles with `stat-orb-gradient` (145deg, `surface-container-high` to `surface-container`), a `primary-container` border that turns `tertiary/50` on hover, the score in Garamond and the modifier beneath. Tap-to-roll on mobile Play.

### BaseModal
`src/components/ui/BaseModal.vue`. `z-modal`, blurred 60% black backdrop, `surface-container` panel with `outline-variant` border and `elevation-4`, `max-h-[85dvh]`, title in `headline-md` `tertiary`, scrolling body, footer with safe-area padding. Variant `sheet` is a bottom sheet on phones and a centered dialog from `md`. Transitions: `sheet-up` (300ms, `cubic-bezier(0.16,1,0.3,1)`) and `modal-fade` (150ms).

### Mobile tab bar and More sheet
`MobileTabBar.vue`: fixed, 64px plus safe-area, `md:hidden`, translucent `surface-container` with top border. Each tab is a flex column with a 1.35rem Material Symbol and an 11px label. "More" opens `MoreActionsMenu` as a bottom sheet and shows a red dot when something needs attention. Press scales to 0.95.

### Edit toggle and reveal-on-hover
`.edit-toggle-btn`: 44px minimum, bordered; inactive is tonal, active is solid gold with a glow. `.reveal-on-hover` hides row actions only on `(hover: hover) and (pointer: fine)` and restores them on hover, `:focus-within` and focus; on touch they stay visible.

### Printable sheet
`PrintableSheet.vue` with the `@media print` block: A4, `@page margin: 0`, forced white background and black text with `print-color-adjust: exact`, 10px base, a 3-column front page, `.no-print` on app chrome, `.page-break` between pages. The print layer is independent of the active theme and hard-codes its values.

### Focus, states and motion
- Global focus: `:where(a, button, input, select, textarea, summary, [role=button], [tabindex]):focus-visible` gets a 2px `tertiary` outline with 2px offset. Radio cards use a ring.
- Disabled is `opacity-50` with `cursor-not-allowed`. Error is `error` border plus text. Selected is `tertiary`.
- Text selection is disabled on buttons, nav and summaries and enabled on inputs and content.
- Motion is short and functional: 150-300ms ease-out for state changes, a `fade-slide` route transition (200ms, 12px), `sheet-up`, a 0.4s point-buy counter pop, a 1.2s `rest-pulse`, and the gold edit-toggle pulse. `prefers-reduced-motion: reduce` clamps animation and transition durations to 0.01ms.
- Touch targets: 44x44px minimum on touch, met by `PressableButton` md, fields, the edit toggle, radio cards and the tab bar. Some small controls (info buttons, a few pills) were below this at the time of writing; do not copy them.

## Do's and Don'ts

### Do
- Use role tokens (`bg-surface-container`, `text-on-surface-variant`, `bg-tertiary`) and check both themes.
- Keep one `primary` button per screen; gold (dark) or bronze (light) means the main action and focus.
- Give every control a visible label or an `aria-label`; wrap fields in `FormField`.
- Keep targets at least 44px on touch and keep the focus outline.
- Respect reduced motion, safe-area insets and the fixed header and tab bar clearances.
- Keep the print sheet independent of the app theme.

### Don't
- Do not choose or hard-code a brand hue. It is an open decision.
- Do not add new MD3 roles or `sheet-*` tokens; consolidation is pending.
- Do not use Midnight Scholar as a reference.
- Do not add decorative gradients, glows or glass beyond the existing grain, noise and edit-toggle glow.
- Do not use `PressableButton size="sm"` or icon-only buttons under 44px on a phone.
- Do not rely on colour alone for state (selected, error, proficiency).
