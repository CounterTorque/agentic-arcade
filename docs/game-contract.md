# Game contract (v1)

The source of truth is [`src/sdk/types.ts`](../src/sdk/types.ts). This page explains it; if the two disagree, the types win. Games import everything from `@arcade/sdk`.

## Files

```
src/games/<id>/
  manifest.ts   export const manifest = defineManifest({...})   (imports only @arcade/sdk; loaded eagerly)
  index.ts      export default defineGame({...})                 (loaded lazily, one chunk per game)
  README.md     concept, controls, difficulty scaling, tuning, known issues
  *.test.ts     at least one unit test
  *.css, *.svelte, *.ts, assets/, *.e2e.ts   optional
```

## Manifest

| Field | Rule |
|---|---|
| `contractVersion` | `1` |
| `id` | equals the directory name; `/^[a-z][a-z0-9-]{1,30}$/` |
| `title` | 1-24 chars; unique across games (case-insensitive) |
| `verb` | `/^[A-Z][A-Z !?]{0,11}$/`, flashed before play |
| `description` | 1-140 chars |
| `controls` | non-empty, no duplicates, subset of `action`, `directions`, `pointer`; the declared input intent (not shown to players) |
| `controlHint` | required, 1-48 chars, player-facing controls line shown in the gallery: `<keys> (<action>)`, comma-separated, e.g. `Space/Click (Jump)` or `Arrows (Move), Space (Fire)`; matches `/^[^(),]+ \([^()]+\)(, [^(),]+ \([^()]+\))*$/` |
| `baseDurationMs` | integer 3000-8000; host divides by speed (minimum 2000) |
| `outcomeOnTimeout` | `'win'` (survive games) or `'lose'` (do-it games) |
| `tags` | optional, at most 5 kebab-case strings |
| `enabled` | optional boolean; `false` keeps a WIP game out of sessions (still in the gallery) |

## Module hooks

| Hook | Required | When | Notes |
|---|---|---|---|
| `preload(ctx)` | no | before create | async, capped at 3000 ms; use `ctx.loadImage(url)` for imported assets |
| `create(ctx, assets)` | yes | after preload | synchronous; build DOM in `ctx.root`, draw frame 0 (visible under the VERB! overlay) |
| `start()` | no | after the 700 ms intro | timer starts; input was just reset |
| `tick(frame)` | yes | every frame, play and settle | all simulation and rendering |
| `end(outcome, via)` | no | once, at resolution | show the freeze or celebration pose |
| `destroy()` | no | after the 800 ms settle, or on error | release anything not tied to `ctx.signal` or `ctx.root` |

`frame = { dt (ms, <= 50), elapsed, remaining, phase: 'play' | 'settle' }`. Settle ticks have frozen `elapsed` and `remaining === 0`. Any exception from a hook ends the round as an error ("GLITCH!"), and the game is benched for the rest of the session.

## Context (`ctx`)

| Member | Use |
|---|---|
| `root` | game-owned 960x720 logical container with `data-game="<id>"`; scaled and centered by the host. The only DOM you may touch |
| `stage` | `{ width: 960, height: 720, scale }` |
| `difficulty` | `{ speed 1-2.5, level 1-3, round }`; scale motion by `speed`, add content by `level` |
| `timeLimitMs` | round length, already speed-scaled |
| `input` | `isDown`, `wasPressed`, `wasReleased` for `action`/`up`/`down`/`left`/`right`; `pointer {x, y, down, inside}` in stage coordinates |
| `rng` | seeded: `next()`, `int(a,b)`, `range(a,b)`, `pick(arr)`, `chance(p)` |
| `signal` | aborted at teardown (after `destroy()`); pass it to every `addEventListener` |
| `resolve('win' \| 'lose')` | first call during `play` wins; later calls and calls outside `play` are ignored |
| `resolved` | current outcome or `null` |
| `createCanvas({ pixelArt? })` | full-stage canvas inside `root`; `g` is pre-transformed so you draw in 960x720 coordinates; HiDPI- and resize-aware |
| `reducedMotion` | skip shakes and flashes when true |

## Input map

| Action | Keys | Mouse |
|---|---|---|
| `action` | Space, Enter, Z, J | left button down on the stage |
| `up` `down` `left` `right` | Arrows, WASD | - |
| pointer | - | `input.pointer` in stage coordinates |

Desktop keyboard and mouse only. The host only listens while a round is running; held input is cleared on window blur or pointer cancel.

## MAY

- Create DOM, canvas or SVG inside `ctx.root`; mount Svelte components there with `mount()` and `unmount()` them in `destroy()`.
- Add listeners to elements inside `ctx.root`, always with `{ signal: ctx.signal }`.
- Import `@arcade/sdk`, `svelte`, `svelte/*`, and files inside your own directory.
- Import assets from `./assets/` (`import url from './assets/x.png'`).
- Style with Svelte `<style>`, inline styles, or a `.css` file whose every selector starts with `[data-game="<id>"]` (also inside `@media`).
- Add `*.test.ts` and `*.e2e.ts` files.

## MUST NOT

- Change files outside `src/games/<id>/` on a `game/<id>` branch.
- Import `src/framework/**`, `src/app/**`, another game, or any package other than `svelte`.
- Use `window`/`document` listeners, `location`, `history`, `localStorage`, `sessionStorage`, `indexedDB`, `document.cookie`, `document.title`.
- Use `requestAnimationFrame`, `setTimeout`, `setInterval`, `Date.now`, `performance.now`, `Math.random`.
- Use `fetch`, `XMLHttpRequest`, `WebSocket`, or remote URLs.
- Use absolute asset paths (`'/x.png'`), `public/`, `eval`, `new Function`, non-literal `import()` or `import.meta.glob`.
- Keep running after `destroy()`.

These are enforced by ESLint (`eslint.config.js`, block for `src/games/**`, test and e2e files exempt from the globals/properties rules), `scripts/check-games.mjs`, and the contract suite. Do not add `eslint-disable`.

## Budgets

| What | Limit |
|---|---|
| Game code (JS + CSS, gzip) | 64 KB hard, 32 KB warning; the shared Svelte runtime and SDK do not count |
| Assets, total | 1.5 MB hard, 750 KB warning |
| Single asset file | 512 KB |
| Asset extensions | `.png .jpg .jpeg .webp .avif .gif .svg` |

Code size is measured by `npm run check:budget` after a build (the game's `index.ts` chunk, its game-only imports and CSS, from `dist/.vite/manifest.json`). Asset size is measured on source files by `npm run check:games`. Prefer WebP for raster images and SVG for shapes; do not ship images over 1920 px on a side.

## Testing helpers for game tests

`*.test.ts` files in a game may import `vitest` and `tests/helpers/**`.

```ts
import { describe, expect, it } from 'vitest';
import { createRng, makeGameEntry, runEntry } from '../../../tests/helpers/fake-host';
import game from './index';
import { manifest } from './manifest';

const entry = makeGameEntry(manifest, game);

it('wins when the action is pressed', async () => {
  const result = await runEntry(entry, {
    seed: 1, speed: 1, level: 1,
    script: (frame, input) => frame === 5 && input.tap('action'),   // called before every frame
  });
  expect(result).toMatchObject({ kind: 'win', via: 'game' });
});
```

`runEntry` runs the full lifecycle on a `ManualClock` (fixed 1000/60 ms frames, no real time) and returns the `RoundResult`. `createRng(seed)` gives the same seeded RNG the host uses. Pure logic (`logic.ts`) can be tested without any of this.

## Changelog

- **v1** - initial contract.
- **v1 amendment:** removed `author`, added required `controlHint` (made before any external game existed, so the contract version stays 1).
