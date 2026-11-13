# Bite!

## Concept

Watch the bobber on the pond: fish nibble and make it twitch before a real bite pulls it underwater. Hook during the plunge, not during a fake, to catch the fish.

## Controls

- `action` (Space / Enter / Z / J / left click): reel in the hook.

## Difficulty scaling

- `speed`: the twitch sequence and bite window run faster as speed increases.
- `level`: levels 1, 2 and 3 have 1–2, 2–3 and 3–4 fake twitches, respectively. The fake dips get deeper and the bite windows shrink from 600 to 450 to 300 ms at speed 1.

## Tuning

The seeded schedule starts after 400–700 ms; each 220 ms twitch is followed by 350–650 ms of calm at speed 1. The real bite window scales with speed, but has a 220 ms minimum to keep the fastest round playable. This is longer than the strictly scaled 120 ms at level 3 and speed 2.5.

## Known issues

None.
