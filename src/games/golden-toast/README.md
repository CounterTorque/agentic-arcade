# Golden Toast

## Concept

A slice of bread sits in a toaster while a colour strip beside it shifts from white through gold to black as the toast browns. Pop the toast while the marker is inside the dashed gold zone. Popped early, the bread is pale; popped late, or left in, it burns and smokes.

## Controls

- `action` (Space / Enter / Z / J / left click): pop the toast.

## Difficulty scaling

- `speed`: browning runs `speed` times faster, so the whole strip takes `browningMs / speed`.
- `level`: browning time and gold zone size shrink.

| Level | Browning (speed 1.0) | Gold zone |
|---|---|---|
| 1 | 3.0 s | 20% of the strip |
| 2 | 2.2 s | 15% |
| 3 | 1.5 s | 10% |

## Tuning

- The gold zone is centred on the strip (`GOLD_CENTRE = 0.5` in `logic.ts`). The spec doesn't say where it sits.
- The strip takes less time to brown than the round lasts, so a toast that is never popped burns and loses the round before the timer ends.
- At level 3 and speed 2.5 the gold window is about 60 ms.

## Known issues

None yet.
