# ADR 0005: Required checks are optional and non-strict

Status: Accepted

## Context

With many agents opening game PRs at once, a strict "branch must be up to date" rule forces every merge to rebase and re-run CI. The repository is user-owned, so a merge queue is not available.

## Decision

Document `scope`, `verify` and `e2e` as the checks to require, but not in strict mode. The only enforced rule on `main` is that a pull request is required. Game PRs may be self-merged by agents when green; framework, CI, docs and deps PRs are intended for human review.

## Consequences

Parallel game PRs merge without serialising. A game PR cannot break another game's files (the scope gate), and `main` is rebuilt and checked on every deploy. Review rules for non-game PRs are an intention, not a technical guarantee.
