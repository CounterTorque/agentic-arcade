# Architecture

How Agentic Arcade works as built. Where this differs from [PLAN.md](PLAN.md), this document is correct.

## Component map

```
index.html -> src/main.ts            publishes window.__ARCADE__.games, mounts App.svelte
src/app/                             Svelte 5 shell (runes)
  App.svelte                         header + route switch, {#key route.key} remounts per hash
  router.svelte.ts                   hash router: parseHash(), router.route, numParam()
  play-round.ts                      shared round controller (Practice and Session both use it)
  save.ts                            single SaveStore instance, reducedMotionEnabled(), countRound()
  util.ts                            sleep(ms, signal), isAbort(), randomSeed(), focusOnMount
  components/GameStage.svelte        scaled 4:3 stage, game root + overlay layer
  components/Hud.svelte              lives, score, speed, timer bar
  components/RoundOverlays.svelte    VERB! intro and PAUSED overlays
  routes/Lobby|Gallery|Practice|Session.svelte
src/framework/
  registry.ts                        import.meta.glob discovery, buildRegistry()
  manifest-schema.ts                 validateManifest(), findDuplicateTitles()
  storage.ts                         versioned localStorage (see storage.md)
  debug.ts                           publishDebug() -> window.__ARCADE__
  runtime/round-runner.ts            runRound(): one game, full lifecycle
  runtime/session.ts                 Session: bag, lives, score, bench
  runtime/difficulty.ts              difficultyForRound(), computeTimeLimit()
  runtime/clock.ts                   RafClock (prod), ManualClock (tests)
  runtime/input.ts                   InputController
  runtime/rng.ts                     createRng() (mulberry32)
src/sdk/                             public surface, imported as "@arcade/sdk"
  types.ts  math.ts  index.ts        canvas.ts is internal (reached via ctx.createCanvas)
src/games/<id>/                      one directory per game (manifest.ts, index.ts, ...)
templates/game/                      scaffold used by `npm run new:game`
scripts/                             check-games, check-budget, check-pr-scope, new-game, verify-game (+ lib/)
tests/                               unit/, contract/, e2e/, helpers/, fixtures/, setup/
```

Games are discovered at build time: `src/games/*/manifest.ts` is imported eagerly, `src/games/*/index.ts` lazily (one chunk per game). `registry.entries` is sorted by title; invalid games end up in `registry.problems` (listed in the Gallery in dev builds only). No file outside a game directory is edited to add a game.

## Routes

| Hash | Component | Notes |
|---|---|---|
| `#/` | Lobby | best score, game count, Play, Gallery, reduce-motion setting |
| `#/session?seed=<n>` | Session | endless mode; random seed (`crypto.getRandomValues`) if omitted |
| `#/play/<id>?seed=&speed=&level=` | Practice | one round then a result card; defaults seed 1, speed 1, level 1, clamped to seed 0..2^32-1, speed 1..2.5, level 1..3 |
| `#/gallery` | Gallery | every registry entry, with local stats |
| anything else | - | replaced with `#/` |

`App.svelte` keys the route on the full hash, so changing the query (for example "Again" in Practice, `seed+1`) remounts the route.

## Round lifecycle (`runRound`)

| Step | Detail |
|---|---|
| load | `entry.load()` (dynamic import) |
| preload | optional; capped at `PRELOAD_TIMEOUT_MS` = 3000 ms; `loadImage` rejects on abort |
| create | synchronous; game builds DOM in `ctx.root` and draws frame 0 |
| intro | `INTRO_MS` = 700 ms, owned by the shell (`play-round.ts` shows the verb); no ticks run and input is ignored |
| start | `input.reset()`, then `instance.start()` |
| play | `tick({phase:'play'})` every frame until `ctx.resolve()` or `remaining` hits 0 |
| end | `instance.end(outcome, via)` exactly once; `via` is `'game'` or `'timeout'` (outcome = `manifest.outcomeOnTimeout`) |
| settle | `tick({phase:'settle'})` for `SETTLE_MS` = 800 ms; `elapsed` is frozen and `remaining` is 0 |
| destroy | `instance.destroy()`; then `ctx.signal` is aborted and `root.replaceChildren()` |

- **Frame timing.** `RafClock` clamps `dt` to (0, 50] ms; the first frame uses 16.67 ms. `ManualClock` (tests) uses a fixed `dt` (default 1000/60) and throws after 100 000 frames.
- **`ctx.resolve`** only counts during the `play` phase and the first call wins. A resolve and a timeout on the same frame resolve to the game's call.
- **`onFrame`** (optional) is called after every tick in play and settle; the shell uses it for the timer bar.
- **Time limit.** `computeTimeLimit = max(2000, round(baseDurationMs / speed))`.
- **Errors.** An exception in any phase (including a preload timeout) returns `{ kind: 'error', phase, error, elapsedMs, gameId }`. The runner still calls `destroy()` once (unless destroy itself threw), aborts the signal and empties the root.
- **Canvases.** `ctx.createCanvas()` canvases are resized by the runner when `stageScale()` changes; there are no window listeners in the runner.

### Cancellation

`RunRoundOptions.signal` cancels a round at any point (load, preload, intro, play, settle). The runner does full teardown (destroy if created, abort `ctx.signal`, empty the root) and then **rejects with `DOMException('Round aborted', 'AbortError')`**. It never returns an error `RoundResult` for cancellation, so a `Session` never benches a game because the player navigated away. `play-round.ts` swallows the AbortError and returns `null`; callers treat `null` as "ignore".

`ctx.signal` is aborted only after `destroy()`. The signal passed to `preload()`/`loadImage` is separate and is aborted immediately on cancellation.

## Pause

- **Esc** toggles pause while a round is attached (`play-round.ts` adds a `keydown` listener for the round's lifetime).
- **Tab hidden** (`visibilitychange`) pauses automatically through `RafClock`.
- While paused no steps run, so `elapsed` does not advance; the first frame after resume uses the 16.67 ms first-frame `dt`. The PAUSED overlay follows `RafClock.onPausedChange`. Resuming is by Esc only.

## Input

`InputController` is created per round. `attach(window, stageRoot, getScale)` is called by `play-round.ts` just before `runRound` and detached in `finally`, so Space/Enter work normally on shell buttons outside rounds. Attaching adds `keydown`/`keyup` (mapped keys call `preventDefault`; `event.repeat` ignored), `pointerdown`/`up`/`move`/`cancel`/`leave` on the stage root, and a window `blur`. `pointercancel` and `blur` call `reset()` so nothing stays held. The primary `pointerdown` calls `setPointerCapture` (guarded). The returned function removes every listener via one `AbortController`.

Presses are latched: `wasPressed` is true if any down-edge happened since the previous tick, so a quick tap is never lost. Several keys can map to one action; it stays down until all are released. `reset()` is called just before `start()`.

## Session (`framework/runtime/session.ts`)

Pure and DOM-free; the Session route drives it.

- **Lives:** 4. **Score:** number of wins. `round` counts finished non-error rounds.
- **Bag:** a seeded shuffle of enabled (`enabled !== false`), non-benched games. No repeats until the bag empties; the first game of a refill never equals the previous game unless only one game exists.
- **Record:** win -> score+1, round+1; lose -> lives-1, round+1; error -> the game is benched for the session, with no life or round change.
- **Over:** `lives === 0` or no playable games left.
- **Difficulty:** `speed = min(2.5, 1 + 0.25 * floor(round / 5))`; `level = round < 10 ? 1 : round < 20 ? 2 : 3`.
- **Seeds:** each round's seed is drawn from the session RNG, so a session seed fully determines the game order and round seeds.

Session route timing: intermission 1200 ms (hearts, score, "SPEED UP!" when the speed rose, next title and verb; the next game's chunk is warmed with `entry.load()`), the round, then a 600 ms WIN!/LOSE/GLITCH! flash. At game over it writes `highScore`, `sessionsPlayed` and per-game stats in one `save.update`. Leaving the route aborts the in-flight round.

Practice plays one round, records per-game stats (never the high score) and shows the result card. An error result shows "GLITCH!" with the message and phase.

## `window.__ARCADE__`

Read-only, frozen, exposed in all builds (used by E2E). Updated through `publishDebug()`.

```ts
{
  contractVersion: 1,
  games: string[],                       // registry entry ids (set in main.ts)
  phase: LifecyclePhase | 'idle',        // current runner phase, 'idle' between rounds
  lastRound: RoundResult | null,         // includes the Error object for error results
  rounds: number,                        // finished rounds in this page load
}
```

## Reduced motion

The Lobby setting (`system` | `on` | `off`, persisted) feeds `ctx.reducedMotion`; `system` follows `prefers-reduced-motion`.

## Stage

`GameStage.svelte` measures its container with a `ResizeObserver`, computes `scale = floor(min(w/960, h/720) * 1000) / 1000` (floored so the stage never overflows by a fractional pixel), and renders a `960*scale x 720*scale` frame with letterboxing. The game root is a logical 960x720 div under `transform: scale(s)` (`overflow: hidden; contain: strict`); overlays live in a sibling layer scaled the same way, never inside the game root.
