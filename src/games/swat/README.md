# Swat

## Concept

A hungry fly is circling a frosted cake. Swat it before it lands!

## Controls

Move the pointer over the fly and click to swat. Misses can be retried until time runs out.

## Difficulty

| Level | Fly speed | Direction changes | Hovers |
|---|---:|---:|---|
| 1 | 200 px/s | 800 ms | None |
| 2 | 300 px/s | 500 ms | None |
| 3 | 420 px/s | 300 ms | 30% chance per change, 150 ms |

Values are at speed 1. Flight, direction changes, hovers and swatter animation scale with host speed. Fly positions and directions are seeded.

## Tuning

The fly stays within x=120–840 and y=80–420, bouncing off the edges. A click within 55 logical pixels of its center hits. On timeout the fly lands on the cake.
