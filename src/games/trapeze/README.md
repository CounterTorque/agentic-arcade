# Trapeze

## Concept

Two acrobats swing beneath the big top. Release the blue flyer so their hands meet the pink catcher's hands; a miss sends the flyer into the safety net.

## Controls

- Space, Enter, Z, J, or click: release the trapeze.

## Difficulty scaling

| Level | Swing periods | Phase offset | Catch tolerance |
|---|---|---|---|
| 1 | 1.4 s / 1.4 s | in phase | 40 px |
| 2 | 1.4 s / 1.4 s | -0.15 cycles | 30 px |
| 3 | 1.1 s / 0.9 s | 0.5 cycles | 20 px |

Swing and flight motion scale with speed; the host shortens the round accordingly.

## Tuning

The ropes are 250 px long with a 0.6 radian swing amplitude. Flight uses the bar's tangential velocity with a 1.4 launch boost and gravity of 2400 px/s². The trajectory is tested at 10 ms intervals for up to 600 ms at speed 1. The result is decided immediately at release, while the flight plays out during the settle phase. The initial swing phase is seeded.

## Known issues

None yet.
