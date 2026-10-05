# Jump

## Concept

A car drives in from the right along a road. Press the action key to hop over it. Survive until the timer ends to win; get hit and you lose immediately.

## Controls

- `action` (Space / Enter / Z / J / left click): jump. Only works while grounded.

## Difficulty scaling

- **speed** (1 to 2.5): car speed is `520 px/s x speed`, and the host shortens the round by the same factor. The jump itself (apex about 208 px, airtime about 833 ms) never changes, so the timing window widens as cars get faster.
- **level 2**: a second car follows the first when it fits (gap of at least one airtime plus 250 to 450 ms, and it arrives at least 300 ms before the timeout).
- **level 3**: each car also gets a random speed multiplier in [1.0, 1.2].

## Tuning

| Constant | Value | Where | Notes |
|---|---|---|---|
| `GROUND_Y` | 600 | `logic.ts` | Ground line on the 960x720 stage |
| `PLAYER` | x 120, 48x80 | `logic.ts` | Player box |
| `jumpVelocity` / `gravity` | 1000 / 2400 px/s, px/s^2 | `logic.ts` | Apex about 208 px, airtime `AIRTIME_MS` about 833 ms |
| `BASE_CAR_SPEED` | 520 px/s | `logic.ts` | Multiplied by `difficulty.speed` |
| `MAX_SPEED_VARIANCE` | 1.2 | `logic.ts` | Level 3 per-car multiplier upper bound |
| `HIT_INSET` | 4 px | `logic.ts` | Forgiveness on the hitbox |
| First car arrival | 40 to 60 % of the time limit | `createState` | Never earlier than it needs to enter from off-screen, plus 150 ms |
| Car shapes | mini, sedan, van, truck | `SHAPES` | Heights 40 to 90 px; the tallest clear needs about 627 ms above 90 px |

## Known issues

- Rendering is Canvas 2D only; the tests cover the simulation and the round lifecycle, not the pixels.
- The car list is fixed at `create`, so there is no difficulty adaptation mid-round.
