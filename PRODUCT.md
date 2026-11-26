# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** players in the Heroes Guild Westmarches community. They build characters at home, play from a phone at the table, and sometimes bring a printed A4 sheet.
- **Also served:** any D&D 5e (2024) player outside the guild. Everything except the guild-only content has to work without a guild account.
- **Secondary:** DMs and guild admins, who manage guild homebrew and look at players' characters. They don't drive the core design.

## Product Purpose

Create, manage, play and share 5e (2024) characters without an account. Characters are built against the bundled rules catalogs, so the rules hold: 27-point buy, background +2/+1, skill limits, class sub-choices and feature choices. Success means a player ends up with a legal, playable character and can use it at the table, on a screen or on paper.

## Positioning

What makes it different from D&D Beyond and other sheets:

- **Guild-native:** guild homebrew spells and feats, renown progression and Discord sign-in, built around Heroes Guild.
- **Agent and AI creation:** Gemini generates characters from a prompt, and a hosted MCP server lets external agents (Claude, ChatGPT and others) build, check and save characters in conversation. All of it is validated against the same creation rules.
- **Free and local-first:** no account is required, characters stay on the device unless shared, and the code is open source (MIT).
- **Print and table use:** a real A4 printed sheet alongside a touch-optimized mobile sheet.

## Operating Context

- Mobile at the table: a quick glance at stats, rolls (3D dice tray), tracking HP, death saves, concentration and rests.
- Desktop or home: character creation, point buy, starting equipment, and choosing features, feats and spells.
- Print: an A4 sheet with a share QR code (`docs/screenshots/printed-share-qr.png`).
- Sharing: Supabase-backed `?id=` links, and Save to library from a shared link.
- Data: JSON import and export validated against `public/character-schema.json`, plus 5e.tools spell and feat imports into the compendium.
- Guild: Discord sign-in, guild selector, synced guild homebrew content, and an OAuth consent page (`/oauth/consent`) for agents.
- Feedback: an in-app widget that posts to a Discord forum channel.

## Capabilities and Constraints

- Vue 3, Vite, TypeScript, Pinia and Tailwind, deployed on Netlify from `main`. Supabase handles sharing and auth; Netlify Functions handle Gemini and Discord.
- Routes: sheet (`/`), `/identity`, `/skills`, `/narrative`, `/inventory`, `/feats`, `/spells`, plus auth, OAuth consent, terms and privacy.
- The app has to keep working when Supabase or the Discord variables are unset. The features that depend on them get hidden or disabled.
- Characters auto-save to browser storage. Spells on a character are free-form, not checked against a catalog.
- Rules content: 5e 2024 rules catalogs bundled with the app.
- Terminology: "character", "library", "guild", "renown", "compendium", "feature choices", "sub-choices".
- Open: the Heroes Guild visual redesign is still in progress (roadmap). The "Midnight Scholar" explorations in `docs/stitch-redesigns/` are not approved as the direction.

## Brand Commitments

- Name: "Heroes Guild Character Sheet". **Heroes Guild** is the organisation and **Character Sheet** is the app. Compact lockups use "Heroes Guild" over "Character Sheet".
- Don't change `adventurersguild.nl` or the "Adventurers Guild Discord server" mention in the Terms without asking; they may refer to real entities.
- Light and dark themes both stay. Neither theme gets dropped.
- Attribution required: RPG icons by mj on Flaticon.

## Evidence on Hand

- JSON schemas in `public/`: `character-schema.json`, `llm-character-schema.json`, `schema.json`, `gemini-schema.json`.
- A printed share sheet with QR code: `docs/screenshots/printed-share-qr.png`.
- None of these exist, and none should be made up: testimonials, user or character counts, community metrics, endorsements from the guild or Wizards of the Coast.

## Product Principles

1. **Rules-correct by construction.** Every path into a character (manual, AI, MCP agent, import) is checked against the same creation rules.
2. **Playable at the table.** In-play use on a phone, and on paper, comes before builder polish.
3. **Guild-first, never guild-only.** Guild content and renown add on top of the base product, and the base product works for any 5e player without an account.
4. **Your character is yours.** It's local-first, accounts are optional, and import and export are open and schema-validated.

## Accessibility & Inclusion

WCAG 2.1 AA is a hard requirement for all UI work, in both light and dark themes. Known gaps to close: contrast, focus states and keyboard navigation, ARIA labelling of stat controls, and screen-reader live regions (issues #71, #72).
