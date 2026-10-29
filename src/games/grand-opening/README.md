# Grand Opening

A ceremonial ribbon-cutting game where timing is everything.

## Concept

Two posts hold a ribbon stretched between them, with a red mark somewhere along its length. The posts slide left and right, carrying the ribbon with them. A giant pair of scissors hovers at the center of the screen. The player must press the action button to snip the ribbon exactly when the red mark passes under the scissors.

## Controls

- **Space / Enter / Z / J / Click**: Snip the ribbon

## How Difficulty Scales

### Speed (1.0 → 2.5)
- Base movement speed of the posts increases proportionally
- At speed 1.0: posts move at 80 px/s
- At speed 2.5: posts move at 200 px/s

### Level
1. **Constant Speed**: Posts slide at a steady pace in one direction. Mark is 30px wide.
2. **Variable Speed**: Posts speed up and slow down smoothly, making timing harder. Mark is 22px wide.
3. **Random Reversals**: Posts randomly reverse direction with little warning. Mark is only 14px wide.

## Win/Lose Conditions

- **Win**: Snip when the scissors (at screen center) intersect with the red mark
- **Lose**: 
  - Snip when the scissors miss the mark
  - Never snip before time runs out

## Visual Feedback

- **Success**: "PERFECT!" text appears, crowd shows happy faces
- **Failure**: "MISSED!" text appears, crowd shows sad/disappointed faces
- Scissors animate downward when cutting (unless reduced motion is enabled)
- Cut line appears at the snip location

## Tuning Notes

- Mark width decreases significantly with level (30 → 22 → 14 px) to increase precision requirement
- Level 2 uses smooth velocity interpolation rather than instant changes for more natural movement
- Level 3 direction changes occur every 600-1200ms, creating unpredictable patterns
- Ribbon stays within bounds with 50px margin on each side
- Posts are spaced 600px apart (ribbon length)
- Scissors positioned 100px above the ribbon for clear visibility

## Implementation Details

- **Logic module** (`logic.ts`): Pure simulation of ribbon movement, mark positioning, and hit detection
- **Render module** (`render.ts`): Canvas-based rendering with background, posts, ribbon, scissors, and crowd
- **Deterministic**: All movement and randomness uses seeded RNG
- **Reduced motion**: Scissors animation is disabled when `ctx.reducedMotion` is true
