# Cheese Heist

## Concept

A mouse sneaks out of its hole to steal cheese from a mousetrap. Watch the spring tremble and snap, then dash out and return before the next snap.

## Controls

- Space, Enter, Z, J or click: dash toward the cheese; press again to turn back. Press again to change direction.

## Difficulty

| Level | Warning | Mouse speed | Armed time after reset |
|---|---|---|---|
| 1 | 700 ms | 600 px/s | 1000 ms |
| 2 | 450 ms | 480 px/s | 1000 ms |
| 3 | 250 ms | 480 px/s | 900–1500 ms, seeded random |

All times are at speed 1. Motion and trap timing scale with the host's speed. Level 3 retains level 2's slower mouse.

## Tuning

The first snap follows 100 ms of arming and the warning. The trap stays sprung for 400 ms before rearming. A 300 px trip each way takes at most 1250 ms, fitting within the shortest 1550 ms snap-to-snap interval. The mouse can wait at the cheese until the player sends it back. Remaining outside when the trap snaps loses; returning home with the cheese wins.
