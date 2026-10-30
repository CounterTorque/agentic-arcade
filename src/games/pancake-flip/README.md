# Pancake Flip

## Concept

Watch the doneness gauge and flip the pancake when it reaches the outlined golden band. Catch it in the pan before it lands!

## Controls

- Space, Enter, Z, J or click: flip.
- Left/right arrows or A/D: move the pan.

## Difficulty

| Level | Time to golden | Golden window | Drift |
|---|---:|---:|---:|
| 1 | 2500 ms | 1000 ms | ±40 px |
| 2 | 1800 ms | 720 ms | ±90 px |
| 3 | 1200 ms | 480 ms | ±150 px |

Times are at speed 1. Browning, flight and pan movement scale with the host speed. Drift is seeded and can go in either direction.

## Tuning

The toss lasts 900 ms at speed 1. The pan moves at 500 px/s and catches a pancake within 60 px of its center. Even the largest drift can be followed during the flight. A pancake left on the heat burns at the end of the golden window; flipping too early or missing the catch also loses.
