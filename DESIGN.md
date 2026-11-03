# Burrowkeep design system

## Overview

Burrowkeep is a small browser mining-and-raising game. Its visual idea is a **pixel wooden burrow on a warm paper interface**: the original room is the focus, and restrained controls let the player feed, build and furnish it. The calm green Start button is the primary action. Decorative art belongs to the game, not behind interface text.

The implementation uses React and TypeScript with plain CSS. The source of truth is [src/styles.css](src/styles.css); application patterns live in [src/App.tsx](src/App.tsx). There is one page, no route rewriting and no separate marketing screen. English and simplified Chinese share the layout.

## Colors

Colors use hex primitives and semantic aliases in `:root`. The semantic tokens, not primitive names, are used by interface components.

| Semantic token         | Primitive / value        | Purpose                                                              |
| ---------------------- | ------------------------ | -------------------------------------------------------------------- |
| `--bg`                 | `--paper-100`, `#f6f3eb` | Page background                                                      |
| `--surface`            | `--paper-50`, `#fffdf8`  | Mining controls, dialog and enabled outlined actions                 |
| `--surface-soft`       | `--paper-200`, `#eeeadf` | Item illustration wells and segmented control tracks                 |
| `--ink`                | `--paper-900`, `#342f26` | Headings, primary text and values                                    |
| `--muted`              | `--paper-700`, `#716957` | Hints, secondary labels and captions                                 |
| `--line`               | `--paper-300`, `#ded8c9` | Structural separators and disabled outlines                          |
| `--control-border`     | `--paper-500`, `#9c9381` | Enabled field and secondary action borders                           |
| `--accent`             | `--moss-600`, `#516647`  | Start button, progress and food fill                                 |
| `--accent-hover`       | `--moss-700`, `#405637`  | Primary hover                                                        |
| `--accent-pressed`     | `--moss-900`, `#2e4029`  | Running primary action                                               |
| `--on-accent`          | `--paper-50`, `#fffdf8`  | Text and icons on the primary button                                 |
| `--selected-bg`        | `--moss-50`, `#eaf0e3`   | Purchase confirmation and personal leaderboard row                   |
| `--selected-text`      | `--moss-700`, `#405637`  | Success and selected-state text                                      |
| `--focus`, `--warning` | `--clay-800`, `#8a4d33`  | Focus outline and explanatory warnings, with separate semantic roles |
| `--warning-bg`         | `--clay-50`, `#f6e7dc`   | Notice background                                                    |

Measured rendered text ratios: ink on page **11.98:1**, muted on page **4.91:1**, muted on surface **5.35:1**, primary text on its green fill **6.18:1**. These pairs were measured in Chromium; the probe also checks resolved solid backgrounds. Pixel-art colors are separate from UI tokens. No dark theme or image-overlay text is implemented.

## Typography

Local variable WOFF2 fonts are in `src/assets/fonts/`, with OFL notices in `public/fonts/`. Both faces were observed loaded in the production page.

- `--font-display`: **Fraunces**, then Songti SC, SimSun, serif. Headings and ore totals use weight 600; the wordmark uses 700.
- `--font-body`: **DM Sans**, then PingFang SC, Microsoft YaHei, sans-serif. Interface text uses 400 or 600. Chinese glyphs use installed system fallbacks.
- There are six size tokens: `--text-xs` 12 px, `--text-sm` 14 px, `--text-base` 16 px, `--text-lg` 20 px, `--text-xl` 28 px, `--text-display` 40 px at the default 16 px root. They are declared in rem so text enlargement works.
- The main heading is 40 px, 1.15 line height, −0.04em tracking. It becomes 28 px, −0.035em at 600 px and below. Section titles are 20 px; dialogs use 28 px desktop and 20 px phone. Card titles are 16 px, 1.4 line height.
- Body line height is 1.5; dialog prose is 1.6. Compact UI hints are 12 or 14 px. Form inputs/selects remain 16 px, including on phones.
- Numeric controls, progress, prices, totals and tables use tabular digits. Long values wrap; scores and IDs are not ellipsized. Headings use balanced wrapping, prose uses pretty wrapping, and important values remain selectable.

The rendered first screen uses five sizes at 390 px and six including one-offs at 1440 px. There are no tracked uppercase kicker labels, synthesized light weights or monospace prose.

## Layout

The shared shell has a 1248 px maximum width, including 32 px inline padding. It shares edges across the header, main content and footer. The introductory copy is short enough to keep the game and Start action on the first phone screen.

The spacing tokens are 4, 8, 12, 16, 24, 32, 48 and 64 px. Component-specific 20, 28, 30, 36 and 40 px spacings are also used in `styles.css`; these are real implementation values, not a second token system.

| Width            | Behavior                                                                                                                                                                                                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Above 1100 px    | Room and 326 px mining panel sit side by side with a 32 px gap. Care has two columns; shop has four.                                                                                                                                                                                                  |
| 851–1100 px      | Mining panel becomes 300 px, gap 24 px. Care illustrations and spacing become more compact.                                                                                                                                                                                                           |
| 601–850 px       | Shell padding is 24 px. Room and mining panel stack. The panel internally uses two columns, with shared progress below. Shop has three columns. Footer stacks.                                                                                                                                        |
| 600 px and below | Shell padding is 16 px; header minimum height 72 px. The mining panel uses an explicit inventory grid followed by a full-width action. Care and exchange become single columns; shop has two. Tabs retain four visible choices with icons above labels. Header help becomes an explicitly named icon. |

The header wraps when text grows, tabs can wrap long text, and footer links wrap instead of escaping the viewport. Dialogs use native scrolling, `max-height: calc(100dvh - 48px)` (32 px phone inset) and `overscroll-behavior: contain`. Content remains in normal flow; there are no sticky elements covering the game.

Observed widths: 320, 390, 600, 768, 850, 1024 and 1440 px. At 390 × 844, the product and the Start button are visible; the button ends around 627 px. Twofold text enlargement was checked at 390 and 1440; this is distinct from native browser zoom.

## Elevation & Depth

The page uses spacing, flat tonal backgrounds and 1 px structural borders. The mining panel is a bordered surface without a shadow. Care rows are separated with a rule, not nested cards. Shop item art sits in a neutral well.

Only the native dialog uses an elevation shadow (`0 12px 64px #342f2630`) and a dim backdrop (`#342f2670`). It has no border. The game frame uses dark wood (`#34241a`) as part of its illustration treatment.

## Shapes

`--radius-sm` is 6 px, `--radius` is 12 px, and `--radius-lg` is 16 px. Buttons and inputs use 6 px, art wells use 12 px, the mining panel/dialog use 16 px. Segmented tracks use 8 px and their selections 5 px. The canvas frame has 8 px padding (6 px on phones) and preserves the room's 2:1 aspect ratio. Art is intentionally pixelated; UI text is not.

## Components

| Component / source                                             | Use and states                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Room` / `src/components/Room.tsx`, renderer in `src/scene.ts` | Original room, hamster wheel and purchased decorations. Canvas has a descriptive accessible name; resource/level state is also text outside it. Draws at most 20 fps, avoids drawing while hidden, respects reduced motion and a separate scene-pause button. Loading a saved balance does not produce a fake earning popup. |
| `Icon`, `HamsterMark`, `Mineral` / `src/components/Icon.tsx`   | Small consistent SVG UI symbols, wordmark mascot and ore/metal categories. UI strokes use `currentColor`; decorative artwork is hidden from accessibility APIs. Currency names and numbers accompany mineral art.                                                                                                            |
| `ItemArt` / `src/components/ItemArt.tsx`                       | All 17 decoration illustrations; this is a preview of an item, not a claim that it is owned. Actual placement and level are explicitly labeled.                                                                                                                                                                              |
| Primary action / `.start-button` in `App.tsx`                  | Starts or terminates actual workers. Visible text, accessible name and fill change together. Its nearby CPU line describes the consequence before pressing Start.                                                                                                                                                            |
| Power selector / `.power-control`                              | Native radios for Gentle and Full power, with the actual available thread counts. Arrow-key behavior comes from the platform. Selected fill and focus outline are separate states.                                                                                                                                           |
| Purchase pattern / `.purchase-button`                          | Item/action name and exact price; native disabled state for insufficient resources or caps. Placed/max/cooldown text remains visible. Success is announced in a stable polite status region.                                                                                                                                 |
| Workshop tabs / `App.tsx`                                      | Named tabs and panels with roving tabindex, Left/Right, Home/End, selected underline and normal click activation. Switching panels does not stop mining.                                                                                                                                                                     |
| Material filter                                                | A persistent `<label for="material-filter">` and native select. Changes the actual item list.                                                                                                                                                                                                                                |
| Leaderboard                                                    | Native table for real server rows, with distinct loading/empty/unavailable states and retry. Category buttons expose pressed state. No seeded production players.                                                                                                                                                            |
| `Dialog` / `src/components/Dialog.tsx`                         | Native `<dialog>` for help and invitations. `showModal()` provides inert background/focus containment; Escape and Close dismiss it, and focus returns to the opener. Clicking outside the dialog rectangle also dismisses it.                                                                                                |
| Referral copy/sync                                             | Read-only labeled link, clipboard success/error feedback and manual-copy fallback. Sync exposes pending, success, failure and retry states.                                                                                                                                                                                  |

All visible controls have keyboard paths. Focus uses a 2 px clay outline with a 4 px offset; radio labels use a 2 px offset. Forced colors uses the system Highlight color. Most controls are at least 44 px; the 32 px phone scene-pause control and spaced inline links remain above the minimum target threshold.

Hover effects are gated by `(hover: hover)`. Button transitions name their properties and last 150 ms; eligible press feedback scales to 0.96. CSS motion exists only under `prefers-reduced-motion: no-preference`. The canvas independently checks the same preference. No entrance choreography, autoplay audio or global theme transition exists.

## Do's and Don'ts

- Start with the shared shell and existing text/spacing tokens. Let content set the breakpoint rather than clipping labels.
- Give the single primary action the green fill. Use outlined purchases, a secondary button or text utilities for other actions.
- Keep prices and effects sourced from `economy.ts` and `items.ts`, and cap the rigs through `threadsFor`. Presentation must not change the economy.
- Keep functional data outside the canvas as text. Use illustrated wells for new decorative assets, not emoji or remote fonts.
- Add new game sections using the existing tab/panel, heading and action patterns; add both languages and exercise keyboard, error and mobile states.
- Do not add a marketing hero above the playable game, invent shared data, clip resource amounts, or silently resume CPU work.

See [artifacts/validation.md](artifacts/validation.md) for the six-domain review, corrected findings and the precise limits of the rendered checks. Design guidance attribution is in [THIRD_PARTY.md](THIRD_PARTY.md).
