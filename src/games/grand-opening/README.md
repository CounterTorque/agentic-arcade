# Grand Opening

## Concept

A ceremonial ribbon is stretched between two gold-topped posts that slide to and fro along a brass rail, and a red mark on the ribbon moves with them. A giant pair of scissors hovers in front of the shop door. Snip as the red mark passes under the blades. Snip on the mark and the ribbon falls in two, confetti flies and the crowd cheers. Snip anywhere else and the ribbon sags while the crowd frowns; let the round run out and the scissors stay open.

## Controls

- `action` (Space / Enter / Z / J / left click): snip.

## Difficulty scaling

- `speed`: the posts slide `speed` times faster (and the level 2 surges come `speed` times as often).
- `level`: the mark shrinks and the motion gets harder to predict.

| Level | Posts (speed 1.0) | Mark width |
|---|---|---|
| 1 | Constant speed, 240 px/s | 30 px |
| 2 | Speed swings between 40% and 160% of that, every 1.2 s | 22 px |
| 3 | Constant speed, but turns round at random points | 14 px |

## Tuning

- The scissors sit at `CUT_X = 480`, and the mark's centre slides at most `REACH = 140` px either side of it. The posts are 150 px either side of the mark, so the cut always lands on the ribbon.
- Every turning point is beyond `CUT_X`, so the mark crosses the scissors on every leg, including at level 3, where the turning points are random (40-140 px past `CUT_X`, drawn from `ctx.rng`). The round can always be won.
- At level 3 and speed 2.5 the mark is 14 px wide and moves up to 600 px/s, so the window is about 23 ms.
- The spec says a miss makes the crowd slump; the ribbon is only cut on a hit, so a miss is shown with a sagging ribbon and a frowning crowd instead.

## Known issues

None yet.
