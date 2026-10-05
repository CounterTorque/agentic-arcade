# ADR 0004: No per-game npm dependencies

Status: Accepted

## Context

Many agents add games in parallel. Per-game dependencies would put `package.json` and the lockfile in every PR, the biggest merge-conflict hotspot, and enlarge the supply-chain surface.

## Decision

Games may import only `@arcade/sdk`, `svelte` (and `svelte/*`) and files in their own directory. `package.json` and the lockfile are framework-owned. Enforced by ESLint `no-restricted-imports` and `scripts/check-games.mjs`.

## Consequences

Game PRs are disjoint by construction and can merge without rebasing. Games cannot use third-party libraries; anything shared goes into the SDK through a framework PR.
