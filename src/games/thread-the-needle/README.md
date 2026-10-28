# Thread the Needle

## Concept

A needle sways side to side in the middle of the screen, with a strand of thread hanging above it. Press the action key to drop the thread. It has to slide through the eye of the needle. If it strikes the metal it frays, and the round is lost.

## Controls

- `action` (Space / Enter / Z / J / left click): drop the thread. Only the first press counts.

## Difficulty scaling

- `speed`: the needle sways faster (its angular rate is multiplied by speed), and the thread falls faster. Fall time is about 0.34 s at speed 1.0 and shrinks in proportion to speed.
- `level`: sway period and eye width follow the spec:
  - 1: period 1.6 s, eye 24 px
  - 2: period 1.2 s, eye 18 px
  - 3: period 0.8 s, eye 12 px

## Tuning

- `SWAY_AMPLITUDE` (220 px): how far the needle travels either side of centre.
- `FALL_PX_PER_S` (900) and the `THREAD_START_Y` / `EYE_Y` gap: set the fall time, so the player has to anticipate where the needle will be.
- `THREAD_WIDTH` (4 px): the usable gap in the eye is `eyeWidth − THREAD_WIDTH`, so the thread passes if its centre is within half of that gap of the eye's centre.
- The thread is judged at the moment its tip reaches the eye line. If the timer runs out while it is still falling, it is judged where it is.

## Known issues

None yet.
