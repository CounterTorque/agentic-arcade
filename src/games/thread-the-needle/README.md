# Thread the Needle

## Concept

An oversized sewing needle bobs up and down beside a strand of thread. Shoot the thread from the left into the eye and it threads itself. Hitting the metal frays the thread; missing the needle also loses.

## Controls

- `action` (Space / Enter / Z / J / left click): shoot the thread. Only the first press counts.

## Difficulty scaling

- `speed`: the needle bobs faster and the thread travels faster. The 1.4 s bob period and approximately 0.16 s travel time at speed 1 shrink in proportion to speed.
- `level`: the eye height shrinks from 56 px at level 1 to 38 px at level 2 and 24 px at level 3. The bob period is the same at every level.

## Tuning

- `BOB_AMPLITUDE` (180 px) and `BOB_PERIOD_S` (1.4 s) set the needle's movement.
- `TRAVEL_PX_PER_S` (700) and the 110 px gap from `THREAD_START_X` to the needle face set the travel time.
- `THREAD_WIDTH` (6 px): the usable gap is `eyeHeight − THREAD_WIDTH`, so the thread passes if its centre is within half that gap of the eye's centre.
- The thread is judged when its tip reaches the needle face. If the timer runs out while it is still travelling, it is judged at the needle's current position.
