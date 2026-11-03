# Source and asset attribution

## Original game

This project adapts [Burrowkeep by beibei030](https://github.com/beibei030/burrowkeep/tree/a83681574244d391a94e7f3389ce1e6ae7abd021), commit `a83681574244d391a94e7f3389ce1e6ae7abd021`.

- `economy.js` → `src/economy.ts`: original economic formulas and constants, with TypeScript annotations and formatting.
- `hash.js`, `worker.js` → `src/hash.ts`, `src/worker.ts`: original SHA-256 algorithm, share predicate and 3,000-hash worker batches.
- `mill.js` → `src/items.ts`, `src/scene.ts`: original item data and pixel-room artwork, adapted to typed state and a bounded renderer. UI, lifecycle, persistence validation and service feedback are implemented in the new React source.

Original-file SHA-256 digests are recorded in [artifacts/upstream.json](artifacts/upstream.json). The source archive did not contain a LICENSE file; this submission does not assert a new license over the original author's game. Attribution is preserved in the derived source files and the page links to the original game.

## Fonts and runtime

- **DM Sans** and **Fraunces** are locally bundled under the SIL Open Font License 1.1. Original notices are included in `public/fonts/DM-Sans-LICENSE.txt` and `public/fonts/Fraunces-LICENSE.txt`, and copied into `dist/fonts/` by the build. The Latin variable WOFF2 files were retrieved from Google Fonts; Chinese uses system font fallbacks.
- **React**, **React DOM**, and **Scheduler** runtime licenses are in `public/licenses/` and `dist/licenses/`. Build/test tool licenses remain with their separately installed development packages.
- The SVG mascot, UI symbols, item illustrations, page design and share-card layout are project-specific code assets. The share card renders the original game's room and the new interface's local fonts.

## Design and documentation references

The six-domain review used the supplied pinned Better Interface material, adapted from [Jakub Krehel's Better Interface](https://github.com/jakubkrehel/skills/tree/267330e1adfc66a718fb65fa6918c1f06d0a689e/skills/better-interface), commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`, copyright 2026 Jakub Krehel, MIT.

The design documentation method is adapted from [Paul Bakaus's Impeccable documentation reference](https://github.com/pbakaus/impeccable/blob/9d715cc4f5564a990ca8345abfdd5df6dc9b41c8/skill/reference/document.md), commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`, copyright 2025 Paul Bakaus, Apache-2.0. This attribution records the documentation method; the final `DESIGN.md` describes this implementation rather than copying the guide.

Both supplied license notices are retained in [artifacts/licenses/design-guides.txt](artifacts/licenses/design-guides.txt). Each included work keeps its own license.
