# ADR 0002: Hash routing

Status: Accepted

## Context

GitHub Pages has no SPA fallback, so a deep link such as `/agentic-arcade/play/jump` returns 404.

## Decision

Use hash routes: `#/`, `#/session`, `#/play/<id>`, `#/gallery`. Unknown hashes are replaced with `#/`.

## Consequences

Deep links and reloads always work without a 404.html redirect trick. URLs look less clean and cannot use server-side features, which the app does not need. Seeds and difficulty can be passed in the query part of the hash.
