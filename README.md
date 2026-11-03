# Burrowkeep

A cozy, playable browser mining game based on [beibei030/burrowkeep at a836815](https://github.com/beibei030/burrowkeep/tree/a83681574244d391a94e7f3389ce1e6ae7abd021). Real SHA-256 work becomes ore; feed and raise your hamster, expand the rig, exchange materials and furnish its pixel burrow.

The finished static site is included in **`dist/`**, together with its source and npm lockfile. Serve the entire directory unchanged. Assets and worker URLs are relative (`base: './'`), so the site works at a gateway subpath as well as a domain root. There are no server-side routes, build-time secrets, wallet requirements or remotely loaded fonts.

## Install, preview and rebuild

Use Node 22.12+ (validated with Node 24) and npm.

```sh
npm ci
npm run dev
```

The development site opens at `http://127.0.0.1:8765`. To check the shipped production build:

```sh
npm run preview
```

To regenerate the complete export:

```sh
npm run typecheck
npm test
npm run build
npm run preview
```

`npm run build` replaces `dist/`. Keep the regenerated export in the submission along with `src/`, `public/`, the manifests and configuration. Do not add dependency trees, package caches or browser binaries. The explicit ignore-file and deliverable budgets are in [artifacts/path-budget.json](artifacts/path-budget.json).

## Playing

- **Start mining** creates real SHA-256 Web Workers. Gentle mode uses one thread; Full power uses the unlocked rigs up to the device's available cores, with an absolute cap of 32. Stop terminates the workers. Leaving the tab pauses mining; it never resumes without Start.
- **Care** buys food, hamster levels, rigs and snacks. Unaffordable or capped actions are disabled. A snack tin unlocks the snack action.
- **Home shop** contains all 17 original decorations, material filters and three upgrade levels per decoration. Purchases appear in the room.
- **Exchange** trades 100 ore for 1 iron, 10 iron for 1 silver, and 10 silver for 1 gold, one transaction per press.
- **Leaderboard** reads the original shared API, with explicit loading, empty, populated, unavailable and retry states. **Invite a friend** creates an actual referral link and checks server rewards.
- Chinese and English are supported. The initial language follows the browser, then the saved selection. This is a usability change from the original Chinese default.

Progress is local to this browser under the original `burrowkeep-cpu-v1` key. Valid original v1/v2 saves are supported. The anonymous keeper ID is generated locally, and the first-visit referral is retained. Use one tab per burrow. There is no cloud save, cross-device synchronization or offline mining. Local play works with the shared API unavailable; initial loading of the static files still needs a host or a local server.

## Preserved economy and API

The economy, SHA-256 implementation, worker batch size and pixel-room drawing come from the pinned commit. TypeScript annotations and presentation changes do not change the prices. [src/economy.ts](src/economy.ts) is the source of truth.

| Hamster transition | Cost      |
| ------------------ | --------- |
| 1 → 2              | 200 ore   |
| 2 → 3              | 800 ore   |
| 3 → 4              | 8 silver  |
| 4 → 5              | 25 silver |
| 5 → 6              | 70 silver |
| 6 → 7              | 4 gold    |
| 7 → 8              | 12 gold   |

Rig upgrades use the **current** level: levels 1–3 cost **200, 500, 1,200 ore**; levels 4–8 cost **6, 12, 24, 48, 80 silver**; levels 9–31 cost **`1 + floor((level - 9) / 3)` gold**. Level 32 is the cap. Food costs **8 ore**; snacks cost **6 ore**. The original exchange, hunger, oil, snack, referral and decoration formulas are preserved.

The unchanged API origin is:

```text
https://burrowkeep-api.46.250.250.111.sslip.io
```

The client uses `/api/hello`, `/api/pulse`, `/api/bonus` and `/api/board` with the original request shapes. The original conditional origin was made explicit for static hosting; its address is unchanged. No proxy or replacement server is included. The source server permits only specific CORS origins, including the original Burrowkeep hosting names and localhost port 8765. Other hosting origins may be unable to access shared rankings and rewards. This does not block local gameplay. There are no invented leaderboard entries or offline referral rewards.

The API was observed returning HTTP 200 and empty wealth/decor lists. Live GET and CORS reads were checked; automated mutation tests used intercepted responses to avoid adding test scores to the real service. Live multi-player referrals, score acceptance delays and eventual availability are not certified by these checks.

## Validation

Actual worker results on 2026-11-03:

| Check                                                | Result                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| Clean `npm ci`, `npm run typecheck`, `npm run build` | Passed; clean build byte-identical to the included export          |
| `npm test`                                           | 12 tests passed                                                    |
| Direct comparison with original economy              | 960 matching outcomes                                              |
| `npm run test:browser`                               | Chromium interactions and WebKit real mining passed                |
| Automated accessibility                              | No axe violations on the initial mobile view or any workshop panel |
| Responsive layout                                    | Checked at 320, 390, 600, 768, 850, 1024 and 1440 px               |
| 390 × 844 first screen                               | Product visible; Start button ends at approximately 627 px         |
| Pinned taste@1 probe                                 | 16/16 checks passed                                                |
| Better Interface review                              | All six domains reviewed; applicable findings fixed                |

[artifacts/validation.md](artifacts/validation.md) records coverage, corrections and limitations. [DESIGN.md](DESIGN.md) documents the final design tokens and components. The report is a worker self-check, not independent behavior certification.

To rerun browser checks:

```sh
npx playwright install --with-deps chromium webkit
npm run build
npm run test:browser
```

The script serves `dist/` itself under `/preview/`, closes its server and browsers, and writes only to `test/scratch/interaction/`. It exercises real mining, exact purchases, exchanges, snack cooldown, persistence, language selection, keyboard/dialog behavior, accessibility, reduced motion, text enlargement, failure recovery and the unchanged API request shapes. Test balances and leaderboard responses are explicitly isolated test fixtures, never shipped in the app or written to the live service. Hunger uses a virtual clock; clipboard permissions and unavailable capabilities are simulated. Browser binaries and native libraries are development tools, not runtime assets. Missing WebKit infrastructure is reported as a limitation rather than a pass.

For this assignment, dependencies and browser libraries were installed outside the repository. A separate clean copy ran the normal commands above without special Vite aliases or TypeScript path settings; every exported file matched. The final export was also inspected with the supplied browser tool. Physical phones, screen readers, native browser zoom and live cross-user payouts were not tested.

The PNG share card and touch icon can be regenerated from the actual game canvas with a running production preview:

```sh
node scripts/render-share.mjs http://127.0.0.1:8765/
npm run build
```

## Delivery and hosting

`dist/index.html`, its hashed JS/CSS/font/worker assets, favicon, touch icon, share card and runtime licenses are complete. The submission system publishes the committed static export after this task and assigns its public address. This repository does not contain publishing credentials or a guessed deployment URL, and no remote repository or hosting account was mutated during local validation.

See [THIRD_PARTY.md](THIRD_PARTY.md) for source and asset attribution.
