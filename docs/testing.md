# Testing

## Tiers

Default runs are the fast **smoke** tier; the **full** tier keeps the exhaustive coverage and is run on demand. `TEST_DEPTH=full` selects full; anything else is smoke. Tests choose their depth with `depth(smokeValue, fullValue)` from `tests/helpers/depth.ts` (importable from game tests).

| | Smoke (default) | Full |
|---|---|---|
| Unit | `npm test` | `npm run test:full` |
| Contract | idle seeds 1-2; fuzz seed 1 x speeds {1, 2.5} x levels {1, 3}; determinism seed 1 | idle seeds 1-5; fuzz seeds 1-10 (40 runs); determinism seeds 1-3 |
| Jump | 10 seeds, speeds {1, 2.5}, levels {1, 3} | 200 seeds, 4 speeds, 3 levels |
| E2E | `npm run test:e2e`: smoke specs except `@full`, plus a round of `jump` and games named in `GAMES` | `npm run test:e2e:full`: a round of every game, `@full` tests and every `src/games/*/*.e2e.ts` |
| One game | `npm run verify:game -- <id>` | `npm run verify:game -- <id> --full` |
| Everything | `npm run verify` | `npm run verify:full` |

Tag a slow Playwright test by putting `@full` in its title. CI runs smoke E2E and sets `GAMES` to the game ID for game PRs; deployment runs smoke unit and contract tests. Locally, `GAMES` accepts a comma-separated list of additional game IDs. `GAME` selects only one game for per-game E2E, even in the full tier. The full tier runs in `.github/workflows/full-tests.yml`, which is `workflow_dispatch` only (Actions -> Full tests -> Run workflow). Run `verify:game -- <id> --full` once before a PR if you changed a game's difficulty or tuning.

## Layers

| Layer | Location | Command | Purpose |
|---|---|---|---|
| Unit (framework) | `tests/unit/` | `npm test` | rng, difficulty, input, clock, round-runner (every phase, abort), session, storage, manifest schema, registry, scripts, contract harness |
| Unit (game) | `src/games/<id>/*.test.ts` | `npm test` | game logic and full rounds via `runEntry` |
| Contract | `tests/contract/games.contract.test.ts` | `npm test` | runs against every game in `src/games/` automatically |
| E2E smoke | `tests/e2e/smoke.spec.ts` | `npm run test:e2e` | lobby focus, route fallback, gallery vs registry, not-found, pause, stage fit, first round of a session; the full idle session to game over with persistence is `@full` |
| E2E per game | `tests/e2e/games.spec.ts` | `npm run test:e2e` / `npm run test:e2e:full` | one test per selected game (`jump` and `GAMES` in smoke, every game in full): opens `#/play/<id>?seed=1`, waits for `__ARCADE__.lastRound`, asserts `kind !== 'error'` and no page or console errors, attaches a mid-round screenshot |
| E2E game-specific | `src/games/<id>/*.e2e.ts` | `npm run test:e2e:full` | full tier only; optional, e.g. Jump idle -> `lose` |

The `microgames.md` catalogue test (`tests/unit/microgames-spec.test.ts`) checks that there are 50 specs, that ids and titles are unique, that each spec's fields are valid, and that an existing `src/games/<id>` with a catalogue id has the spec's `manifest.id` and `manifest.title`.

Unit tests run in Vitest with jsdom and a no-op 2D canvas (`tests/setup/canvas-stub.ts`). E2E needs `npx playwright install chromium`; Playwright builds nothing, so run `npm run build` first (CI does). It serves `dist/` with `vite preview` on port 3457 at `/agentic-arcade/`.

Ports: `npm run dev` and `npm run preview` use 3456; Playwright starts its own preview server on 3457, so a running dev server does not collide with E2E. Only stop processes this repository started; never kill node/vite processes by name or in bulk. See [AGENTS.md section 9](../AGENTS.md#9-local-servers-and-processes).

## Commands

```bash
npm test                                         # all unit + contract tests
npx vitest run src/games/<id>                    # one game's unit tests
GAME=<id> npx vitest run tests/contract          # contract suite for one game
npm run test:e2e                                 # smoke E2E (after npm run build)
GAMES=a,b npm run test:e2e                       # include additional games in smoke
npm run test:e2e:full                            # all E2E
TEST_DEPTH=full npx playwright test tests/e2e/games.spec.ts  # every game's round
GAME=<id> npx playwright test tests/e2e/games.spec.ts        # one game's round
npm run verify                                   # lint, typecheck, check:games, tests, build, check:budget
npm run verify:game -- <id>                      # the full gate for one game, including its E2E
```

`verify:game` runs, in order: eslint on the game, typecheck, `check:games --only`, `GAME=<id> vitest run tests/contract src/games/<id>`, build, `check:budget --only`, then one Playwright run: `games.spec.ts` filtered to the game with `GAME=<id>` (plus the game's `*.e2e.ts` with `--full`). The e2e step is skipped with a notice if Chromium is not installed.

## What the contract suite checks

Seed counts below are the full tier; smoke uses fewer (see Tiers).

Implemented in `tests/helpers/contract.ts` (`checkGame`), driven by `ManualClock`, with an unattached `InputController`.

| Check | Verifies |
|---|---|
| `manifest` | `validateManifest` passes; titles are unique (registry-level test) |
| `module` | default export has `contractVersion === 1` and `create` |
| `preload` | if present, resolves within 3000 ms with a stubbed `loadImage` |
| `create` | returns synchronously, with a `tick` function, and leaves at least one child in `root` |
| `idle` | no input, speed 1, seeds 1-5: result is `win`/`lose`, never `error`, reached within the time limit |
| `fuzz` | seeded random presses, taps, releases and pointer moves; speeds {1, 2.5} x levels {1, 3} x seeds 1-10: never `error` |
| `determinism` | the same seed and input script twice gives the same `RoundResult`; DOM games also give the same `root.innerHTML` after 30 frames (skipped if the root has a canvas) |
| `hygiene` | zero calls to `window`/`document.addEventListener`, `requestAnimationFrame`, `setTimeout`, `setInterval`, `Math.random`, `Date.now`, `performance.now` from `create` to teardown |
| `teardown` | root is empty afterwards and `ctx.signal.aborted` |

### Debugging a failure

1. Run `GAME=<id> npx vitest run tests/contract`; each failure names the check and the seed/speed/level.
2. `idle`/`fuzz` with "error in <phase>": the message is the thrown error; fix that hook.
3. `hygiene`: the message names the API and call count. Use `frame.dt`, `ctx.rng`, and listeners on elements inside `ctx.root` with `{ signal: ctx.signal }`. Libraries you import count too.
4. `determinism`: something depends on wall-clock time, unseeded randomness, or module-level state that survives between rounds. Keep per-round state inside `create`.
5. Reproduce in the browser at the same seed: `#/play/<id>?seed=<n>&speed=<x>&level=<1-3>`.

## Determinism and seeds

Everything random uses `ctx.rng` (seeded per round) and everything time-based uses `frame.dt`/`frame.elapsed`, so a seed plus an input script reproduces a round exactly. A session seed (`#/session?seed=<n>`) fixes the game order and every round seed.

## Fixtures

`tests/fixtures/games/<name>/{manifest.ts,index.ts}` are intentionally broken or edge-case games (`always-win`, `timeout-lose`, `throws-on-tick`, `throws-in-create`, `leaky`, `nondeterministic`, `bad-manifest`). `tests/helpers/fixtures.ts` builds a registry from them (`fixture(name)`, `makeEntry(game, manifest overrides)`) for framework tests; they are never part of the real registry.

## Helpers

`tests/helpers/fake-host.ts`: `createFakeHost`, `runEntry`, `makeGameEntry`, `createRng`. `tests/helpers/contract.ts`: `checkGame`, `fuzzScript`.

## Budgets

`npm run check:games` checks structure, import boundaries, CSS prefixes and source assets (see [game-contract.md](game-contract.md#budgets)). `npm run check:budget` needs a build and checks gzip code size per game.
