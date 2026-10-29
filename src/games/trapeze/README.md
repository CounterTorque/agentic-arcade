# Trapeze

## Concept

An acrobat swings on a trapeze toward a partner swinging on the opposite side. The player presses the button to let go, and the acrobat must fly into the partner's hands. Releasing at the wrong moment sends the acrobat bouncing into the safety net, and the player loses.

## Controls

- `action` (Space / Enter / Z / J / left click): Release the acrobat from the trapeze.

## Difficulty scaling

- `speed`: Both swings move faster as speed increases, making timing more difficult.
- `level`:
  - Level 1: Both swings in phase; catch tolerance 40px.
  - Level 2: Swings slightly out of phase; tolerance 30px.
  - Level 3: Swings fully out of phase with faster periods; tolerance 20px.

## Tuning

- **Swing radius (150px)**: Controls how far the acrobats swing from their starting positions.
- **Swing periods**: Base periods of 2.0s, scaled by difficulty level and speed.
- **Catch zone**: Acrobat must be within tolerance distance of partner at the right height.
- **Gravity (1200 px/s²)**: Applied after release to create realistic falling motion.

## Known issues

None yet.
