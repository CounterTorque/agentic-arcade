# ADR 0001: Svelte 5 + Vite + TypeScript shell

Status: Accepted

## Context

The arcade is a small static app that chains short games. The shell needs a tiny runtime, compiled scoped styles, and native Vite features such as `import.meta.glob` for discovery and per-game code splitting.

## Decision

Use Vite, Svelte 5 (runes) and TypeScript. Games render however they like (DOM, canvas, SVG, or Svelte) inside a host-provided root.

## Consequences

Small bundles and zero-edit game discovery through Vite globs. Games and the shell share one toolchain. Contributors need Svelte and Vite knowledge for shell work only; games only need TypeScript. React was considered and rejected for its larger runtime.
