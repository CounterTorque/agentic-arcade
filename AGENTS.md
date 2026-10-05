# AGENTS.md — Agentic Arcade

You are working in **Agentic Arcade**, a static, WarioWare-style micro-game host (Vite + Svelte 5 + TypeScript), deployed to GitHub Pages from `main`.

**Most tasks are "add a mini-game".** A game is one directory, `src/games/<id>/`. Merging it to `main` publishes it automatically. You never edit any other file to register it.

If your task is *not* adding or changing a game (framework, CI, docs), use a `framework/<topic>`, `ci/<topic>`, `docs/<topic>`, or `deps/<topic>` branch (the `scope` job rejects any other branch name). Read `docs/architecture.md` first. Those PRs are for human review by @CounterTorque; do not self-merge them. Game PRs (`game/<id>`) you may merge yourself once CI is green.

---

## 1. The golden rule

On a `game/<id>` branch, **every changed file must be under `src/games/<id>/`.** CI (`scope` job) rejects anything else, including `package.json`, `package-lock.json`, docs, README, tests outside your directory, and other games.

If you believe you need a framework change (a new SDK helper, a new input), stop. Describe it in your PR description or task report instead of making it.

## 2. Step by step

```bash
# 0. Prerequisites: Node version from .nvmrc
nvm use                      # or ensure `node -v` matches .nvmrc

# 1. Pick a unique id (kebab-case, 2–31 chars, starts with a letter)
git fetch origin
ls src/games/                                  # must not already exist on main
git ls-remote origin 'refs/heads/game/*'       # must not be claimed by an open branch
git switch -c game/<id> origin/main

# 2. Install
npm ci

# 3. Scaffold from the template (creates src/games/<id>/ with manifest, index, test, README)
npm run new:game -- <id>

# 4. Implement (see sections 3–5), and play it:
npm run dev
#    open http://localhost:3456/agentic-arcade/#/play/<id>?seed=1
#    try speeds/levels: #/play/<id>?seed=1&speed=2.5&level=3

# 5. Run the full gate for your game — must pass with zero errors
npm run verify:game -- <id>

# 6. Commit only your directory, push, open the PR
git add src/games/<id>
git commit -m "game(<id>): add <Title>"
git push -u origin game/<id>
gh pr create --title "game(<id>): <Title>" --body-file .github/pull_request_template.md

# 7. Wait for checks scope, verify, e2e to pass. Then squash-merge.
gh pr checks --watch
gh pr merge --squash --delete-branch
```

After merge, the `Deploy` workflow publishes the site in a few minutes. Your game appears in the gallery and in sessions with no other step.

## 3. Files in your directory

```
src/games/<id>/
├── manifest.ts    REQUIRED  export const manifest = defineManifest({...})
├── index.ts       REQUIRED  export default defineGame({...})
├── README.md      REQUIRED  concept, controls, how difficulty scales, tuning notes
├── *.test.ts      REQUIRED  at least one unit test of your game logic
├── *.ts/*.svelte  optional  more code
├── *.css          optional  every selector must start with [data-game="<id>"]
├── assets/        optional  images etc.; import them: import url from './assets/x.png'
└── *.e2e.ts       optional  Playwright test for your game
```

`manifest.ts` may import **only** from `@arcade/sdk`. It's bundled eagerly for every visitor, so keep it tiny.

## 4. Contract summary (v1)

Full reference: `docs/game-contract.md`. Source of truth: `src/sdk/types.ts`.

### Manifest

```ts
import { defineManifest } from '@arcade/sdk';
export const manifest = defineManifest({
  contractVersion: 1,
  id: '<id>',                  // === directory name
  title: 'Title',              // 1–24 chars, unique across games
  verb: 'DODGE!',              // /^[A-Z][A-Z !?]{0,11}$/ — flashed before play
  description: '…',            // ≤ 140 chars
  author: '<agent or model name>',
  controls: ['action'],        // any of 'action' | 'directions' | 'pointer'
  baseDurationMs: 5000,        // integer 3000–8000 (host divides by speed, min 2000)
  outcomeOnTimeout: 'win',     // 'win' = survive games, 'lose' = must-do-it games
  tags: ['reflex'],            // optional, ≤ 5 kebab-case
});
```

### Module

```ts
import { defineGame } from '@arcade/sdk';
export default defineGame({
  contractVersion: 1,
  async preload(p) { return { img: await p.loadImage(url) }; }, // optional, ≤ 3 s
  create(ctx, assets) {           // sync; build DOM in ctx.root and draw frame 0
    return {
      start() {},                 // optional: timer starts now
      tick(frame) {},             // required: simulate + render with frame.dt
      end(outcome, via) {},       // optional: once; show freeze/celebrate pose
      destroy() {},               // optional: release anything not tied to root/signal
    };
  },
});
```

### Lifecycle

1. `preload`
2. `create` (visible under the VERB! overlay for 700 ms, no ticks)
3. `start`
4. `tick` with `phase:'play'`, until you call `ctx.resolve()` or the timer expires
5. `end`
6. `tick` with `phase:'settle'` for 800 ms
7. `destroy`, after which the host aborts `ctx.signal` and empties `ctx.root`

### Context (`ctx`)

| Member | Use |
|---|---|
| `root` | Your 960×720 (4:3) logical-px container (has `data-game="<id>"`). The host scales and centers it. The only DOM you may touch. |
| `createCanvas()` | Returns `{ canvas, g }`. `g` is pre-scaled: draw in 960×720 coordinates. |
| `stage` | `{ width: 960, height: 720, scale }` |
| `difficulty` | `{ speed: 1–2.5, level: 1–3, round }`. Scale motion by `speed`; add content by `level`. |
| `timeLimitMs` | Round length, already speed-scaled. |
| `input` | `isDown(a)`, `wasPressed(a)`, `wasReleased(a)` for `a` ∈ `'action'│'up'│'down'│'left'│'right'`; `pointer {x,y,down,inside}` in stage coords. `action` = Space/Enter/Z/J/left click. Desktop web only: no touch or mobile support. Directions = arrows/WASD. |
| `rng` | Seeded: `next() int(a,b) range(a,b) pick(arr) chance(p)` |
| `resolve('win'│'lose')` | Report the outcome. First call wins; later calls are ignored. |
| `resolved` | Current outcome or `null`. |
| `signal` | AbortSignal. Pass `{ signal: ctx.signal }` to every `addEventListener`. |
| `reducedMotion` | If true, no shakes or flashes. |

`frame` = `{ dt (ms, ≤50), elapsed, remaining, phase: 'play'|'settle' }`.

## 5. Conventions

- **Split logic from rendering.** Put the simulation in a pure, DOM-free module (`logic.ts`: `createState`, `step`) and drawing in `render.ts` or `.svelte`. Unit-test the logic headlessly, and drive full rounds with `runEntry` and `makeGameEntry` from `tests/helpers/fake-host` (the template's `game.test.ts` shows how). See `src/games/jump/` as the reference.
- **Everything time-based uses `frame.dt` / `frame.elapsed`.** Everything random uses `ctx.rng`. With the same seed and inputs, your game must play out identically.
- **Make it winnable and losable at every `speed` × `level`.** The best test is a bot that always wins across many seeds, plus idle play that loses (or the reverse for `outcomeOnTimeout:'win'` games where idling should fail).
- **Rendering:** DOM, SVG, Canvas 2D via `ctx.createCanvas()`, or Svelte components are all fine. If you `mount()` a Svelte component into `ctx.root`, `unmount()` it in `destroy()`.
- **Styling:** Svelte `<style>` (scoped), inline styles, or `.css` with every selector prefixed `[data-game="<id>"]`.
- **Assets:** import them from `./assets/`. Allowed: `.png .jpg .jpeg .webp .avif .gif .svg`.
  - **Budget:** ≤ 1.5 MB total per game (warning at 750 KB), ≤ 512 KB per file.
  - Prefer WebP for raster images and SVG for shapes.
  - Never ship images larger than 1920 px on a side (2× the 960×720 stage).
  - Everything must preload within 3 s.
- **Code budget:** ≤ 64 KB gzip of JS+CSS for your game chunk (warning at 32 KB). The shared Svelte runtime and SDK don't count.
- **The game should be readable in about 1 second:** one verb, one obvious goal, controls matching `manifest.controls`.
- **Commit message and PR title:** `game(<id>): <summary>`.

## 6. Forbidden — CI will fail or the PR will be rejected

- Changing any file outside `src/games/<id>/` on a game branch.
- Adding or upgrading npm dependencies. Imports allowed: `@arcade/sdk`, `svelte`, `svelte/*`, and relative paths inside your directory. `*.test.ts` may also import `vitest` and `tests/helpers/**`; `*.e2e.ts` may import `@playwright/test`.
- Importing from `src/framework/`, `src/app/`, or another game.
- `window`/`document` event listeners, `location`, `history`, `localStorage`, `sessionStorage`, `indexedDB`, `document.cookie`, `document.title`.
- `requestAnimationFrame`, `setTimeout`, `setInterval`, `Date.now`, `performance.now`, `Math.random`.
- Network access: `fetch`, `XMLHttpRequest`, `WebSocket`, remote fonts, images, or scripts.
- Absolute paths like `'/img.png'`, or adding files to `public/`.
- `eval`, `new Function`, non-literal `import(...)`, `import.meta.glob`, or appending elements outside `ctx.root`.
- Disabling lint rules (`eslint-disable`) or skipping or deleting tests to get green.
- Self-merging a PR that touches framework paths.

## 7. Definition of done

- [ ] Branch is `game/<id>`; the diff touches only `src/games/<id>/`.
- [ ] `manifest.ts`, `index.ts`, `README.md`, and ≥ 1 `*.test.ts` exist.
- [ ] `npm run verify:game -- <id>` passes locally: lint, typecheck, check:games, contract tests, unit tests, build, budget, and E2E (`tests/e2e/games.spec.ts` for your game plus your own `*.e2e.ts`) if browsers are installed.
- [ ] Played in `npm run dev` at speed 1 and speed 2.5 (`#/play/<id>?speed=2.5&level=3`). It can be won and lost, and nothing goes wrong in the browser console.
- [ ] Outcome logic is correct: `ctx.resolve` is called for the game-decided outcome, and `outcomeOnTimeout` matches the design.
- [ ] Respects `difficulty.speed` (and ideally `level`) and `ctx.reducedMotion`.
- [ ] PR opened with the template filled in; CI `scope`, `verify`, and `e2e` are green.
- [ ] Squash-merged. After `Deploy` finishes, the game appears at https://countertorque.github.io/agentic-arcade/#/gallery.

## 8. Useful commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server at `http://localhost:3456/agentic-arcade/` |
| `npm run new:game -- <id>` | Scaffold a game from `templates/game/` |
| `npm run verify:game -- <id>` | Full local gate for one game |
| `GAME=<id> npx vitest run tests/contract` | Contract suite for one game only |
| `npx vitest run src/games/<id>` | Your unit tests |
| `npm run build && npm run check:budget` | Size check |
| `npx playwright test tests/e2e/games.spec.ts -g <id>` | Browser smoke test for your game (`npx playwright install chromium` first) |
| `npm run verify` | Full repo gate (framework work) |

## 9. Local servers and processes

- This app's ports: **3456** for `npm run dev` and `npm run preview`, and **3457** for the preview server Playwright starts for E2E. Both use a strict port: if the port is busy, the command fails instead of moving to another port.
- Other Svelte, Vite or Node apps on this machine belong to other projects. **Never** stop processes by name or in bulk: no `pkill node`, `pkill -f vite`, `pkill -f svelte`, `killall node`, and no `kill-port` on any port other than 3456 or 3457.
- Stop only what this repository started:
  1. Prefer stopping the process you launched yourself (Ctrl-C, or kill the PID or shell you started).
  2. If 3456 or 3457 is busy, find the listener and confirm it belongs to this repo before stopping it:
     ```bash
     lsof -nP -iTCP:3456 -sTCP:LISTEN         # note the PID
     lsof -a -p <PID> -d cwd -Fn | tail -1    # must end with this repo's path
     kill <PID>                               # only if the path matches
     ```
  3. If the listener belongs to another project, leave it running and report that the port is taken.
- Playwright starts and stops its own server on 3457, so a dev server on 3456 can keep running during E2E.

## 10. When something fails

- **`scope` failed:** you changed a file outside your directory. Revert it.
- **Contract "hygiene" failure:** you used a forbidden global (timer, rAF, `Math.random`, or a window listener). Use `frame.dt`, `ctx.rng`, and listeners on elements inside `ctx.root` with `{ signal: ctx.signal }`.
- **Contract "determinism" failure:** something depends on wall-clock time or unseeded randomness.
- **Contract "error" result:** an exception was thrown in a hook. Run `GAME=<id> npx vitest run tests/contract` and read the reported phase.
- **Blank page or 404 assets in preview:** an absolute path is used somewhere. Import the asset instead.
- **Asset budget exceeded** (`check:games`): convert PNG to WebP, downscale to ≤ 1920 px, or replace with SVG or drawn shapes.
- **Code budget exceeded** (`check:budget`): remove unused code; never vendor a library into your directory.
- If the framework truly blocks you, don't work around it. Report what you need and why.
