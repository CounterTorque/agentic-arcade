# Deployment

The site is fully static and is deployed from `main` to GitHub Pages at `https://countertorque.github.io/agentic-arcade/`.

## One-time setup (manual)

Repository **Settings -> Pages -> Build and deployment -> Source: GitHub Actions**. Nothing else is needed; `deploy.yml` uses the `github-pages` environment.

## Base path

Pages serves a project site under `/agentic-arcade/`, so `vite.config.ts` sets `base: '/agentic-arcade/'`. Without it every asset 404s and the page is blank.

- Assets imported through ES modules get the prefix automatically. Hard-coded `/foo.png` strings and `public/` files do not, which is why games may not use them. Framework code uses `import.meta.env.BASE_URL`.
- Routing is hash-based (`#/play/jump`) because Pages has no SPA fallback for deep links.
- `vite preview` and the E2E `baseURL` (`http://localhost:4173/agentic-arcade/`) use the same base.
- **If the repository is renamed or a custom domain is added, change `base`** (and the E2E `baseURL`/webServer URL in `playwright.config.ts`).

## Workflows

### `.github/workflows/ci.yml` (on pull requests)

| Job | Does |
|---|---|
| `scope` | pull requests only; checks out with full history and runs `node scripts/check-pr-scope.mjs "origin/$BASE_REF" "$HEAD_REF"`. Branch names arrive through `env`, never interpolated into the script. Outputs `games=<id or empty>` |
| `verify` | `npm ci`, lint, typecheck, `check:games`, `npm test`, build, `check:budget`, uploads `dist` (7 days) |
| `e2e` | needs `verify`; `npm ci`, installs Chromium, builds, runs `npm run test:e2e`, uploads `playwright-report` (7 days, always) |

Runs for the same PR cancel each other (`concurrency`). The Node version comes from `.nvmrc`. Actions are pinned to major tags: `checkout@v7`, `setup-node@v7`, `upload-artifact@v7`.

### `.github/workflows/deploy.yml` (on push to `main`, or manually)

- `build`: `npm ci`, `check:games`, `npm test`, `npm run build`, `check:budget`, then `configure-pages@v6` and `upload-pages-artifact@v5` (`dist`).
- `deploy`: needs `build`, `deploy-pages@v5` into the `github-pages` environment.

The `pages` concurrency group does not cancel running deploys; GitHub keeps one pending run, so the newest `main` wins. Every deploy builds the full tree, so a newly merged game directory appears without any other edit.

## Branches and the scope gate

| Branch | Rule |
|---|---|
| `game/<id>` | may change only files under `src/games/<id>/` (`<id>` matches `^[a-z][a-z0-9-]{1,30}$`) |
| `framework/*`, `ci/*`, `docs/*`, `deps/*` | no path restriction |
| anything else | the scope job fails with a message pointing to `AGENTS.md` |

## Merge policy (intent, not enforcement)

The only enforced rule on `main` is "a pull request is required to merge". Everything else is documented intent:

- **Game PRs** (`game/<id>`): agents may squash-merge them with no human approval once `scope`, `verify` and `e2e` are green.
- **Framework, CI, docs, deps PRs:** intended for human review by @CounterTorque before merging; agents should not self-merge them.
- Optionally mark `scope`, `verify`, `e2e` as required checks, **non-strict** (no "branch must be up to date"), so parallel game PRs do not force each other to rebase. The repository is user-owned, so GitHub's merge queue is not available and CI has no `merge_group` trigger.
- Squash merge keeps one commit per game.

## Rollback

Revert the squash commit on `main` (through a PR) and merge it; `deploy.yml` rebuilds and redeploys. To redeploy without a code change, run the **Deploy** workflow manually (`workflow_dispatch`).

## Local preview of a build

```bash
npm run build
npm run preview -- --port 4173      # http://localhost:4173/agentic-arcade/
```
