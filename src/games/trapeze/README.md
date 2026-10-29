# Trapeze

An acrobat swings on a trapeze toward a partner swinging on the opposite side. The player presses the button to let go, and the acrobat must fly into the partner's hands.

## Controls

- **Space / Click**: Release from trapeze

## How it works

The acrobat swings back and forth on the left trapeze while the partner swings on the right. The player must time the release perfectly so the acrobat flies through the air and meets the partner's hands mid-flight.

A faint trajectory line shows the potential flight path to help with timing.

## Difficulty scaling

### Speed (1.0 to 2.5)
- All swing periods scale inversely with speed
- Faster swings make timing more challenging

### Level
- **Level 1**: Both swings in phase; catch tolerance 40px
- **Level 2**: Swings slightly out of phase (45°); tolerance 30px  
- **Level 3**: Swings fully out of phase (180°) with faster periods; tolerance 20px

## Win/Lose conditions

- **Win**: Released acrobat's position comes within the catch tolerance of the partner's hands
- **Lose**: Acrobat misses the partner and falls into the safety net below, or time runs out without releasing

## Tuning notes

- Rope length: 180px
- Base swing period: 2000ms (level 1), 1800ms (level 2), 1500ms (level 3)
- Gravity: 600 px/s²
- Phase offsets create the difficulty progression by making the timing window less predictable
- The trajectory hint helps players learn the physics without making it trivial
