# ADR 0003: Host-driven frame loop, seeded RNG and clock

Status: Accepted

## Context

Games must be pausable, speed-scalable, headless-testable and reproducible. Game-owned loops cannot be paused, leak after unmount, and cannot be tested without real time.

## Decision

The host owns the frame loop. Games implement `tick(frame)` with a clamped `dt`, never call `requestAnimationFrame` or timers, and use `ctx.rng` instead of `Math.random`/`Date.now`. Lint, `check-games` and the contract suite enforce this.

## Consequences

Pause, speed scaling, deterministic tests with `ManualClock`, and seed-based bug repros come for free. Games must express all timing through `dt`/`elapsed`, which is a small constraint on how they are written.
