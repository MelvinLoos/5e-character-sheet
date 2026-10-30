# Heroes Guild Character Sheet

A responsive D&D 5e character sheet for the [Heroes Guild Westmarches](https://www.westmarches.games/communities/heroes-guild) community. Built with Vue 3 and optimized for both screen and print.

[![Netlify Status](https://api.netlify.com/api/v1/badges/b8a04a80-1349-4a79-a3ce-c1d997e3bc9d/deploy-status)](https://app.netlify.com/projects/5e-character-sheet/deploys)
[![CI](https://github.com/MelvinLoos/5e-character-sheet/actions/workflows/ci.yml/badge.svg)](https://github.com/MelvinLoos/5e-character-sheet/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

### Character management

- Point-buy ability score allocation
- Automatic proficiency bonus and hit point calculation
- Class, background, and species support with automatic skill proficiencies
- Spellcasting with automatic spell slot calculation
- Death save tracking

### AI generation

- Generate a full character from a natural-language prompt using Google Gemini
- Characters are generated against the bundled 5e (2024) rules catalogs

### Sharing and data

- Share characters online through Supabase-backed links
- JSON import and export, validated against a published schema
- Auto-save to browser storage
- A4 print layout

### Platform

- Touch-optimized layouts for mobile
- Light and dark themes
- Drag-and-drop reordering of features, spells, and attacks

## Tech stack

| Area | Technology |
| --- | --- |
| Frontend | Vue 3 (Composition API), Vite, TypeScript |
| State | Pinia |
| Styling | Tailwind CSS with a custom theme in `src/assets/main.css` |
| Backend | Supabase (sharing), Netlify Functions |
| AI | Google Gemini via a Netlify serverless function |
| Drag and drop | vuedraggable 4 |
| Icons | Feather Icons |
| Testing | Vitest (unit), Playwright (E2E) |

## Getting started

### Prerequisites

- Node.js `>= 26.0.0` (see `engines` in `package.json`)
- npm (this repository uses `package-lock.json`)

### Installation

```bash
git clone https://github.com/MelvinLoos/5e-character-sheet.git
cd 5e-character-sheet
npm install
cp .env.example .env   # fill in values, or set them in Netlify instead
npm run dev
```

### Environment variables

Copy `.env.example` to `.env` and fill in the values. `.env` is git-ignored; secrets must never be committed.

| Variable | Scope | Description |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Client | Supabase project URL used for online character sharing. |
| `VITE_SUPABASE_ANON_KEY` | Client | Supabase anonymous (public) client key. |
| `VITE_SUPABASE_REDIRECT_URL` | Client | OAuth redirect URL for the Discord sign-in flow. |
| `VITE_POSTHOG_PROJECT_TOKEN` | Client | PostHog project token for product analytics. |
| `VITE_POSTHOG_HOST` | Client | PostHog instance URL (defaults to `https://eu.i.posthog.com`). |
| `VITE_POSTHOG_DISABLED` | Client | Set to `true` to disable analytics, e.g. in tests. |
| `GEMINI_API_KEY` | Server (Netlify) | Gemini API key for AI character generation. Never sent to the browser. |
| `DISCORD_BOT_TOKEN` | Server (Netlify) | Bot token used to post in-app feedback threads to a Discord forum channel. |
| `DISCORD_FEEDBACK_CHANNEL_ID` | Server (Netlify) | ID of the Discord forum channel that receives feedback threads. |

When the Supabase variables are unset the app still runs; online sharing is disabled and a warning is logged to the console.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run type-check` | Run TypeScript type checking (`vue-tsc`) |
| `npm run lint` | Run ESLint with autofix |
| `npm run test:unit` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright end-to-end tests |

## Usage

### Creating a character

1. Use **AI Generate** to create a character from a description, or build one manually.
2. To build manually: allocate ability scores with point buy, choose a background to assign skill proficiencies automatically, then add class features, feats, and spells.

### Managing data

- **Share** publishes the character through a Supabase-backed link.
- **Export JSON** and **Import Character** round-trip characters through schema validation; imports are migrated and saved to the library.
- **Import Data** adds 5e.tools spell and feat JSON to the rules compendium.
- Changes are auto-saved to browser storage.

### JSON schemas and LLM authoring

The app ships these schemas in `public/`:

| Schema | Purpose |
| --- | --- |
| `character-schema.json` | Full persisted character shape. Accepts derived fields so exported characters round-trip losslessly. Used to validate imports. |
| `llm-character-schema.json` | Self-contained authoring schema with exhaustive enums. Provide it to an LLM to generate valid character JSON. |
| `schema.json`, `gemini-schema.json` | Sparse input schemas used by the built-in AI generator. |

To author a character with an LLM, provide it with `public/llm-character-schema.json` and a prompt such as *"Create a level-3 elven wizard named Elara using this schema."* Save the returned JSON and load it via **Import Character**.

## Deployment

The site is deployed to Netlify from `main`.

### In-app feedback (Discord)

The **Give Feedback** widget posts each submission as a new thread in a Discord forum channel through the bot REST API (`POST /channels/{channel.id}/threads`). To enable it:

1. Create a bot in the [Discord Developer Portal](https://discord.com/developers/applications) and reset its token.
2. Invite the bot with **Send Messages** permissions:
   `https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2048&scope=bot`
3. Create a forum channel on the server.
4. Copy the channel ID (enable Developer Mode, right-click the channel, **Copy Channel ID**).
5. Set `DISCORD_BOT_TOKEN` and `DISCORD_FEEDBACK_CHANNEL_ID` in the Netlify environment.

When either variable is unset, the feedback entry points are hidden and an explanation is logged to the browser console in development builds.

## Theming

Theme colors are defined as CSS custom properties (`--color-*`) in `src/assets/main.css` and mapped to Tailwind utilities (e.g. `bg-sheet-bg`, `text-sheet-red`) in `tailwind.config.js`. Override the custom properties to retheme the sheet.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for architecture conventions and the mandatory quality gate pipeline.

## License

This project is licensed under the [MIT License](LICENSE).

## Attribution

- RPG icons by [mj on Flaticon](https://www.flaticon.com/free-icons/rpg)
- Fonts: EB Garamond, IM Fell English SC, and Manrope

## Roadmap

- [x] AI character generation
- [x] Multiple character library
- [x] Online character sharing
- [x] Dark and light themes
- [x] A4 print layout
- [ ] Heroes Guild visual redesign (in progress)
- [ ] Accessibility pass (WCAG 2.1 AA)

## Known limitations

- Print layout targets A4 paper
- Very long character names can wrap awkwardly on small screens
