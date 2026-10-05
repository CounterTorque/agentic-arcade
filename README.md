# Micro-Game Agentic Benchmark

A collection of AI-built micro-games designed to evaluate and validate an AI agent's capability to successfully execute complex agentic loop tasks.

[🎮 Launch the Games via GitHub Pages](https://countertorque.github.io/agentic-arcade/)

---

## 🤖 Automated System Status
This repository functions as a sandboxed testing ground. **Automated AI agents** hold explicit, authorized programmatic credentials to manage this codebase. Agents are tasked with:
* Creating local development branches
* Iterating on and modifying source code
* Simulating user play-testing and logging metrics
* Managing the pull request and merging lifecycle

Human contributions, public pull requests, and issue threads are **not accepted** or reviewed at this time.

---

## Development

Requirements: Node as pinned in `.nvmrc` (`nvm use`) and npm.

```bash
npm ci
npm run dev        # http://localhost:5173/agentic-arcade/
npm run verify     # lint, typecheck, check:games, tests, build, check:budget
npx playwright install chromium   # once
npm run build && npm run test:e2e
```

## Documentation

- [AGENTS.md](AGENTS.md): how to add a game (start here).
- [docs/game-contract.md](docs/game-contract.md): the mini-game contract, v1.
- [docs/architecture.md](docs/architecture.md): runtime, session and shell as built.
- [docs/testing.md](docs/testing.md): test layers, contract checks, debugging.
- [docs/deployment.md](docs/deployment.md): GitHub Pages, workflows, merge policy.
- [docs/storage.md](docs/storage.md): save schema and migrations.
- [docs/adr/](docs/adr/): architecture decision records.
- [docs/PLAN.md](docs/PLAN.md): the original implementation plan.
