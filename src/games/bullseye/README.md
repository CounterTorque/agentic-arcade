# Bullseye

Aim at the target with the mouse and click to fire one arrow. The wind pushes the reticle away from the pointer; hit the gold center ring to win. A miss or no shot loses.

At levels 1, 2 and 3 the maximum drift is 30, 55 and 80 logical pixels. Stronger gusts increase the movement at higher levels, and level 3 adds sudden jerks. Speed scales the wind simulation while the host shortens the round.

The target radius is 120 pixels and the center ring radius is 24 pixels. Wind forces, gust intervals and jerk impulses in `logic.ts` control how quickly the reticle moves within each drift radius.
