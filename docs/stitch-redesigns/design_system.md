---
name: Midnight Scholar
colors:
  surface: '#15130b'
  surface-dim: '#15130b'
  surface-bright: '#3c392f'
  surface-container-lowest: '#100e07'
  surface-container-low: '#1e1c13'
  surface-container: '#222017'
  surface-container-high: '#2c2a21'
  surface-container-highest: '#37352b'
  on-surface: '#e8e2d4'
  on-surface-variant: '#c1c8c9'
  inverse-surface: '#e8e2d4'
  inverse-on-surface: '#333027'
  outline: '#8b9293'
  outline-variant: '#414849'
  surface-tint: '#aacdd1'
  primary: '#aacdd1'
  on-primary: '#123539'
  primary-container: '#1a3c40'
  on-primary-container: '#84a6ab'
  inverse-primary: '#436468'
  secondary: '#e7bdb1'
  on-secondary: '#442a22'
  secondary-container: '#5d4037'
  on-secondary-container: '#d4aca0'
  tertiary: '#e9c349'
  on-tertiary: '#3c2f00'
  tertiary-container: '#cca72f'
  on-tertiary-container: '#4e3d00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c5e9ee'
  primary-fixed-dim: '#aacdd1'
  on-primary-fixed: '#001f23'
  on-primary-fixed-variant: '#2b4c50'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#e7bdb1'
  on-secondary-fixed: '#2c160e'
  on-secondary-fixed-variant: '#5d4037'
  tertiary-fixed: '#ffe088'
  tertiary-fixed-dim: '#e9c349'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#15130b'
  on-background: '#e8e2d4'
  surface-variant: '#37352b'
typography:
  display-lg:
    fontFamily: EB Garamond
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: EB Garamond
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  gutter: 16px
  card-gap: 20px
---

## Brand & Style

This design system embodies the **Modern Cozy Study** aesthetic, blending the intellectual rigor of a private library with the warmth of a candlelit workspace. It is designed for creators, writers, and players who value deep focus and tactical richness.

The style is a fusion of **Modern Corporate** structure and **Tactile** warmth. It avoids the coldness of traditional SaaS by using organic wood tones and deep, atmospheric teals. The emotional response is one of safety, sophistication, and immersion. Visuals are grounded in physical metaphors—parchment-like surfaces, inlaid gold accents, and heavy wooden containers—while maintaining the functional efficiency of a modern digital tool.

## Colors

The palette is anchored by **Deep Teal** and **Midnight Green**, creating a low-energy, high-focus environment. 

- **Primary (Deep Teal):** Used for main surfaces and structural containers. It provides a calm, receding background that allows content to pop.
- **Secondary (Warm Wood):** Applied to interactive elements that require a sense of "weight" and physical presence, like circular stat blocks or primary navigation headers.
- **Tertiary (Soft Gold):** Reserved for highlights, active states, and critical information. It mimics the look of embossed foil or metallic inlays.
- **Neutral (Parchment):** A warm off-white used for text and high-contrast card backgrounds to prevent the eye strain associated with pure white on dark backgrounds.

## Typography

The typography strategy employs a high-contrast pairing to reinforce the "writing" and "scholarly" vibe.

- **Headlines (EB Garamond):** A sophisticated, classical serif that evokes the feeling of a printed manuscript. It should be used for section titles, character names, and major stat headings.
- **UI & Body (Manrope):** A clean, modern sans-serif that ensures maximum legibility for data-heavy sheets and long-form backstory text.
- **Labels:** Use Manrope with increased letter-spacing and uppercase styling for a disciplined, organized appearance in small spaces (e.g., table headers or stat abbreviations).

## Layout & Spacing

The layout utilizes a **Fixed Grid** philosophy within fluid containers. On desktop, content is organized into a 12-column grid with generous margins to mimic the layout of a physical ledger.

- **Spacing Rhythm:** Based on an 8px scale.
- **Mobile:** Transitions to a single column with 16px side margins. Elements like stat circles should reflow into a 2x3 or 3x2 grid.
- **Density:** Medium-high. While the aesthetic is "cozy," the functional requirement of a sheet generator necessitates efficient use of space. Use 20px gaps between primary cards to allow the background teal to act as a visual "breather."

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Soft Ambient Shadows**.

- **Level 0 (Background):** Midnight Green (#0D1F22).
- **Level 1 (Main Containers):** Deep Teal (#142E31) with a 1px inner border of a lighter teal to simulate a beveled edge.
- **Level 2 (Cards/Modules):** Soft shadows (Offset 0, 8, 24; Opacity 0.3, Color: Black) are used to lift cards off the teal surface.
- **Level 3 (Interactive/Overlays):** These use the Wood or Parchment colors, creating a strong "stacking" effect. 

Shadows should be diffused and colored with a hint of the background teal to avoid looking "muddy."

## Shapes

The shape language is dominated by generous, friendly curves that soften the "technical" nature of the data.

- **Cards & Primary Containers:** Use a minimum radius of **16px** (`rounded-lg`). 
- **Buttons & Inputs:** Use **8px** (`rounded-md`) to maintain a sense of precision within the softer environment.
- **Stat Blocks:** Use **Circular** shapes for core attributes to create a distinct visual rhythm compared to the rectangular info-cards.

## Components

- **Cards:** Defined by a 16px corner radius, a subtle 1px border (#1A3C40), and a soft shadow. Backgrounds can be either a darker teal (for layout) or Parchment (for featured content).
- **Buttons:** Primary buttons use the Wood (#5D4037) or Gold (#D4AF37) fill with Parchment or Midnight Green text. Secondary buttons should be "ghost" style with a Gold border.
- **Input Fields:** Recessed appearance using a slightly darker teal than the card background. Use a Gold focus ring.
- **Chips/Tags:** Small, pill-shaped elements with a Wood-tone background and Gold text, used for traits or status effects.
- **Stat Orbs:** Circular containers with a Wood-texture-inspired gradient and a Gold inset border. The primary value (e.g., "18") uses the serif font, while the modifier uses the sans-serif.
- **Lists:** Clean, sans-serif text with Gold bullet points or dividers to maintain the scholarly theme.