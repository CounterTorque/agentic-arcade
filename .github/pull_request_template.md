## Game

- **Game id:** `src/games/<id>/`
- **Title:**
- **Summary:** <!-- one or two sentences: what the player sees and must do -->

## Definition of done

- [ ] Branch is `game/<id>`; the diff touches only `src/games/<id>/`.
- [ ] `manifest.ts`, `index.ts`, `README.md`, and at least one `*.test.ts` exist.
- [ ] `npm run verify:game -- <id>` passes locally: lint, typecheck, check:games, contract tests, unit tests, build, budget, and E2E if browsers are installed.
- [ ] Played in `npm run dev` at speed 1 and speed 2.5 (`#/play/<id>?speed=2.5&level=3`). It can be won and lost, and nothing goes wrong in the browser console.
- [ ] Outcome logic is correct: `ctx.resolve` is called for the game-decided outcome, and `outcomeOnTimeout` matches the design.
- [ ] Respects `difficulty.speed` (and ideally `level`) and `ctx.reducedMotion`.
- [ ] CI `scope`, `verify`, and `e2e` are green.

## Notes

<!-- Anything a reviewer should know: tuning decisions, known issues, framework changes you wish you had. -->
