# Dice assets

`@3d-dice/dice-box-threejs` can load die textures and roll sounds from an
`assetPath` (default `./`). **No assets are shipped here** because the tray uses
the engine's default theme:

| Setting | Value | Assets required |
| --- | --- | --- |
| `theme_colorset` | `white` → texture `none` (no `source`) | none |
| `theme_material` | `glass` | none |
| `theme_surface` | `green-felt` (surface sounds only) | none |
| `sounds` | `false` | none |

The `none` texture has no `source`, so `ImageLoader` never issues a request, and
sound loading is skipped entirely while `sounds` is off. Keeping the 2.4 MB of
textures/sounds out of the repo keeps the PWA install lean.

If a future theme sets `theme_texture` (e.g. `marble`, `ice`, `wood`) or enables
sounds, copy the matching files from the package's `public/` folder into this
directory (preserving the `textures/` and `sounds/` sub-folders) and pass
`assetPath: '/dice/'` to the engine in `src/composables/useDiceRoller.ts`.
Remember to add `webp`/`mp3` to `workbox.globPatterns` in `vite.config.ts` so the
assets are precached for offline use.
