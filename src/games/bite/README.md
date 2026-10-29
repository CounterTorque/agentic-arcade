# Bite!

## Concept

A bobber twitches as fish nibble, then plunges when a fish bites. Reel in during the real bite to catch it; reeling too soon or missing the bite leaves an empty hook.

## Controls

- `action` (Space / Enter / Z / J / left click): hook the fish.

## Difficulty scaling

- `speed`: all cue timings and motion run `speed` times faster, including the bite window.
- `level`: more convincing fake twitches precede a shorter bite window.

| Level | Fake twitches | Fake depth | Bite window |
|---|---|---|---|
| 1 | 1–2 | 25% | 600 ms |
| 2 | 2–3 | 50% | 450 ms |
| 3 | 3–4 | 85% | 300 ms |

## Tuning

- The first twitch starts 350–650 ms into the round. Twitches last 260 ms and are separated from the next cue by 300–600 ms at speed 1.
- Any press before the real bite loses, whether the bobber is twitching or still. The bite window starts with the plunge and ends just before its listed duration.
- At level 3 and speed 2.5 the bite window is 120 ms.
- The pond, bobber and outcome scenes are drawn with Canvas 2D; reduced motion removes ripples and splash effects.

## Known issues

None yet.
