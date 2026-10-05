# 50 Microgame Specs

A collection of short, escalating microgames for evaluating agentic build loops. Each entry has a human-readable description and a machine-readable spec block.

## Shared rules

Every microgame opens with its `prompt` shown on screen for about 0.5s, then runs for `duration_s` seconds at speed 1. Each game is replayed at three speed tiers. Tiers 2 and 3 apply the listed parameter changes and also run the global tempo at 1.25x and 1.5x, which shortens the timer by the same factor. A round ends immediately when its lose condition is met; otherwise it ends when the timer expires and the win condition is checked. Every game should report a single boolean result (`win` or `lose`) at the end of the round so a harness can score it automatically. All feedback is visual only: games use no audio, and every cue, warning, success and failure state must be shown on screen.

## Spec fields

| Field | Meaning |
|---|---|
| `id` | Stable kebab-case identifier, also the suggested folder name. |
| `category` | Mechanic group. |
| `input` | Controls the game requires (`button-press`, `button-hold`, `button-mash`, `pointer-click`, `pointer-drag`, `directional`). |
| `prompt` | Command text shown at the start. |
| `duration_s` | Round length in seconds at speed 1. |
| `win` | Condition checked to award a win. |
| `lose` | Condition that ends the round as a loss. |
| `speed` | Parameter values for tiers 1, 2 and 3. |

---

## Timing (one button)

### 01. Golden Toast

A slice of bread sits in a toaster while a color strip beside it slowly shifts from white to gold to black. The player presses the button to pop the toast when the strip reaches gold. As the microgame speeds up, the toast browns faster and the gold zone shrinks. Popping too early leaves sad pale bread; popping too late sends up a puff of black smoke, and the player loses.

```yaml
id: golden-toast
category: "Timing (one button)"
input: "button-press"
prompt: "Pop!"
duration_s: 4
win: "Toast popped while the color strip is in the gold zone."
lose: "Popped before gold (pale) or after gold (burnt), or never popped."
speed:
  1: "Browning takes 3.0s; gold zone is 20% of strip."
  2: "Browning takes 2.2s; gold zone is 15%."
  3: "Browning takes 1.5s; gold zone is 10%."
```

### 02. Thread the Needle

A sewing needle sways side to side at the center of the screen while a strand of thread hangs above it. The player presses the button to drop the thread, and it must pass through the needle's eye. At higher speeds the needle sways faster and the eye gets smaller. If the thread hits the metal, it frays and curls up, and the player loses.

```yaml
id: thread-the-needle
category: "Timing (one button)"
input: "button-press"
prompt: "Thread!"
duration_s: 4
win: "Thread passes through the needle's eye."
lose: "Thread strikes the needle body, or is never dropped."
speed:
  1: "Needle sway period 1.6s; eye width 24px."
  2: "Sway period 1.2s; eye width 18px."
  3: "Sway period 0.8s; eye width 12px."
```

### 03. Bite!

A fishing bobber floats on a pond. It twitches a few times as fish nibble, then plunges fully underwater when one takes the bait. The player must press the button only on the real plunge. As the game speeds up, the fake twitches become more convincing and the real bite window gets shorter. Reeling on a twitch, or waiting too long, leaves an empty hook and loses the microgame.

```yaml
id: bite
category: "Timing (one button)"
input: "button-press"
prompt: "Hook it!"
duration_s: 5
win: "Button pressed within the real-bite window."
lose: "Pressed during a fake twitch, or the real-bite window passes."
speed:
  1: "1-2 fake twitches; bite window 600ms."
  2: "2-3 fake twitches with larger dips; window 450ms."
  3: "3-4 fakes nearly as deep as a real bite; window 300ms."
```

### 04. Cheese Heist

A mouse peeks out of its hole beside a loaded mousetrap with a cube of cheese on it. Pressing the button sends the mouse dashing out, and pressing it again pulls it back. The trap's spring visibly trembles before snapping. At higher speeds the tremble warning is shorter. Grabbing the cheese and retreating in time wins; getting caught leaves the mouse flattened with stars around its head.

```yaml
id: cheese-heist
category: "Timing (one button)"
input: "button-press"
prompt: "Grab it!"
duration_s: 5
win: "Mouse reaches the cheese and returns to its hole before the trap snaps."
lose: "Mouse is outside the hole when the trap snaps, or cheese not taken."
speed:
  1: "Tremble warning 700ms before snap."
  2: "Warning 450ms; mouse runs 20% slower."
  3: "Warning 250ms; snap time randomized each attempt."
```

### 05. Grand Opening

A ceremonial ribbon is stretched between two posts that slide left and right, and a red mark on the ribbon moves with them. A giant pair of scissors hovers at the center. The player presses the button to snip, and the cut must land on the red mark. As the microgame speeds up, the posts move faster and in less predictable patterns. Missing the mark makes the crowd slump with frowning faces, and the player loses.

```yaml
id: grand-opening
category: "Timing (one button)"
input: "button-press"
prompt: "Snip!"
duration_s: 4
win: "Cut lands within the red mark's bounds."
lose: "Cut misses the red mark, or no cut is made."
speed:
  1: "Posts slide at a constant speed; mark 30px wide."
  2: "Posts speed up and slow down; mark 22px."
  3: "Posts reverse direction randomly; mark 14px."
```

### 06. Trapeze

An acrobat swings on a trapeze toward a partner swinging on the opposite side. The player presses the button to let go, and the acrobat must fly into the partner's hands. At higher speeds both swings move faster and fall out of sync. Releasing at the wrong moment sends the acrobat bouncing into the safety net, and the player loses.

```yaml
id: trapeze
category: "Timing (one button)"
input: "button-press"
prompt: "Let go!"
duration_s: 5
win: "Released acrobat's hands meet the partner's hands mid-flight."
lose: "Acrobat misses the partner and falls into the net, or never releases."
speed:
  1: "Both swings in phase; catch tolerance 40px."
  2: "Swings slightly out of phase; tolerance 30px."
  3: "Swings fully out of phase with faster periods; tolerance 20px."
```

### 07. Pour It Up

An empty glass sits beneath a tap with a dashed fill line drawn on it. The player holds the button to pour and releases it to stop, aiming to land right on the line. As the game speeds up, the flow gets faster and the glass gets narrower. Under-filling or spilling over the brim loses the microgame.

```yaml
id: pour-it-up
category: "Timing (one button)"
input: "button-hold"
prompt: "Fill it!"
duration_s: 4
win: "Liquid level ends within the tolerance band around the fill line."
lose: "Level below the band, above the band, or spills over the rim."
speed:
  1: "Fill rate 25%/s; band +/-6%."
  2: "Fill rate 35%/s; band +/-4%; narrower glass."
  3: "Fill rate 50%/s; band +/-3%; flow surges slightly."
```

### 08. Crane Stack

A crane swings a crate back and forth above a short stack of boxes. The player presses the button to drop the crate, and it must land squarely on the stack. The player needs to stack three crates in a row, and the swing speeds up after each one. If a crate lands too far off-center, the tower topples, and the player loses.

```yaml
id: crane-stack
category: "Timing (one button)"
input: "button-press"
prompt: "Stack 3!"
duration_s: 8
win: "Three crates stacked with each one's center over the crate below."
lose: "Any crate lands with its center past the edge of the one below, causing a topple."
speed:
  1: "Swing period 2.0s; crates 120px wide."
  2: "Swing period 1.5s; crates 100px wide."
  3: "Swing period 1.1s, quickening after each drop; crates 80px wide."
```

### 09. Safecracker

A safe dial spins on its own, with a small marker at the top. Each time the notch on the dial passes the marker, the player has a brief window to press the button and lock in that tumbler. Three tumblers must be set to open the door. At higher speeds the dial spins faster and changes direction. A mistimed press makes the dial jolt back to zero while a red warning light flashes on the safe, and the player loses.

```yaml
id: safecracker
category: "Timing (one button)"
input: "button-press"
prompt: "Crack it!"
duration_s: 6
win: "All three tumblers locked by pressing as the notch passes the marker."
lose: "A press outside the notch window, or time runs out before three locks."
speed:
  1: "Dial at 1 rev/s, one direction; window 120ms."
  2: "Dial at 1.4 rev/s; reverses after each tumbler; window 90ms."
  3: "Dial at 1.8 rev/s; reverses randomly; window 70ms."
```

### 10. Pancake Flip

A pancake cooks in a pan, with small steam wisps rising, while its underside slowly turns golden, shown by a small color indicator. The player presses the button to toss it, then moves the pan left or right to catch it as it comes down. As the game speeds up, the pancake browns faster and the toss sends it drifting further sideways. A burnt pancake or one that lands on the floor loses the microgame.

```yaml
id: pancake-flip
category: "Timing (one button)"
input: "button-press + directional"
prompt: "Flip!"
duration_s: 6
win: "Pancake flipped while golden and caught back in the pan."
lose: "Flipped while pale or burnt, or the pancake misses the pan."
speed:
  1: "Browning 2.5s; pancake drift 0-40px."
  2: "Browning 1.8s; drift 0-90px."
  3: "Browning 1.2s; drift 0-150px either side."
```

---

## Aim & Click

### 11. Swat

A housefly darts in erratic loops over a frosted cake. The player moves a flyswatter and clicks to swat it. At higher speeds the fly zigzags faster and changes direction more often. If the timer runs out with the fly still airborne, it lands on the cake, and the player loses.

```yaml
id: swat
category: "Aim & Click"
input: "pointer-click"
prompt: "Swat!"
duration_s: 4
win: "Swatter hits the fly."
lose: "Timer expires with the fly still alive (it lands on the cake)."
speed:
  1: "Fly speed 200px/s; direction change every 800ms."
  2: "Speed 300px/s; change every 500ms."
  3: "Speed 420px/s; change every 300ms with short hovers."
```

### 12. Bullseye

An archer faces a distant target while a reticle drifts around it, pushed by gusts of wind shown as streaks across the screen. The player clicks to release the arrow, which must hit the center ring. As the game speeds up, the wind gets stronger and the drift more erratic. An arrow that misses the target or lands outside the center ring loses the microgame.

```yaml
id: bullseye
category: "Aim & Click"
input: "pointer-click"
prompt: "Fire!"
duration_s: 4
win: "Arrow lands inside the center ring."
lose: "Arrow lands outside the center ring or misses the target, or no shot."
speed:
  1: "Light wind; reticle drift radius 30px."
  2: "Moderate wind; drift radius 55px."
  3: "Gusty wind; drift radius 80px with sudden jerks."
```

### 13. Gopher Bop

A field of holes fills the screen, and gophers pop up from random holes for a split second. The player clicks each gopher to bonk it back down, needing a set number of hits before time runs out. Every so often a rabbit pops up instead, and clicking it costs the round. At higher speeds the gophers appear and vanish faster.

```yaml
id: gopher-bop
category: "Aim & Click"
input: "pointer-click"
prompt: "Bop 5!"
duration_s: 5
win: "Required number of gophers hit before time runs out."
lose: "A rabbit is clicked, or the hit target is not reached in time."
speed:
  1: "6 holes; 5 hits needed; gophers up 900ms; no rabbits."
  2: "9 holes; 6 hits; up 650ms; 1 rabbit."
  3: "12 holes; 7 hits; up 450ms; 2-3 rabbits."
```

### 14. Lights Out

An apartment building at night shows a scattering of lit windows. The player clicks each lit window to switch it off. Occasionally a window flickers back on. As the microgame speeds up, the building gets taller and more windows are lit. Any window still glowing when time runs out loses the round.

```yaml
id: lights-out
category: "Aim & Click"
input: "pointer-click"
prompt: "Lights out!"
duration_s: 5
win: "Every window is dark when time runs out."
lose: "Any window still lit when time runs out."
speed:
  1: "6 lit windows; no relights."
  2: "10 lit windows; 1 relight."
  3: "15 lit windows on a taller building; 3 relights."
```

### 15. Odd One Out

A grid of identical icons appears, such as rows of the same smiling face. Exactly one of them is slightly different: a missing eyebrow, a tilted hat, a different shade. The player clicks the odd one. At higher speeds the grid grows larger and the difference becomes subtler. Clicking the wrong icon or running out of time loses the microgame.

```yaml
id: odd-one-out
category: "Aim & Click"
input: "pointer-click"
prompt: "Find it!"
duration_s: 4
win: "The single differing icon is clicked."
lose: "A matching icon is clicked, or time runs out."
speed:
  1: "3x3 grid; obvious difference."
  2: "5x5 grid; moderate difference."
  3: "7x7 grid; subtle difference (small color or rotation change)."
```

### 16. Bubble Wrap

A sheet of bubble wrap fills the screen, and the player clicks every bubble to pop it before time expires. The sheet scrolls slowly to one side, so bubbles drift off the edge if the player is too slow. As the game speeds up, the sheet scrolls faster and has more bubbles. Any unpopped bubble that escapes loses the microgame.

```yaml
id: bubble-wrap
category: "Aim & Click"
input: "pointer-click"
prompt: "Pop 'em!"
duration_s: 5
win: "All bubbles popped before any scroll off-screen."
lose: "Any unpopped bubble leaves the screen edge."
speed:
  1: "12 bubbles; scroll 20px/s."
  2: "20 bubbles; scroll 40px/s."
  3: "30 bubbles; scroll 60px/s."
```

### 17. Say Cheese

A camera viewfinder shows three friends wandering around a park. The player drags the frame to fit all three inside it and clicks the shutter. At higher speeds the friends move faster and drift apart. A photo with anyone cut off, or a missed shot when time runs out, loses the round.

```yaml
id: say-cheese
category: "Aim & Click"
input: "pointer-drag + click"
prompt: "Snap!"
duration_s: 5
win: "Shutter clicked with all three friends fully inside the frame."
lose: "Photo taken with anyone cut off, or no photo before time runs out."
speed:
  1: "Friends move slowly and stay clustered."
  2: "Friends move at medium speed and spread apart."
  3: "Friends move quickly and in opposite directions."
```

### 18. Lasso

A calf runs across a dusty field while a cowboy twirls a rope in the foreground. The player clicks to throw the lasso where the calf will be, leading the target. As the microgame speeds up, the calf runs faster and occasionally changes direction. If the loop lands on empty ground, the cowboy tips his hat in disappointment, and the player loses.

```yaml
id: lasso
category: "Aim & Click"
input: "pointer-click"
prompt: "Rope it!"
duration_s: 4
win: "Lasso loop lands over the calf."
lose: "Loop lands on empty ground, or no throw."
speed:
  1: "Calf runs straight at 150px/s; throw travel 0.4s."
  2: "Calf at 220px/s with one direction change."
  3: "Calf at 300px/s with random direction changes."
```

### 19. Feed the Fish

Several fish swim around a tank, but only one has its mouth open wide and is visibly hungry. The player clicks above that fish to drop a food pellet into its path. At higher speeds there are more fish and the hungry one keeps switching. Feeding the wrong fish, or letting the pellet sink to the bottom, loses the microgame.

```yaml
id: feed-the-fish
category: "Aim & Click"
input: "pointer-click"
prompt: "Feed!"
duration_s: 4
win: "A pellet reaches the hungry fish's mouth."
lose: "Wrong fish eats the pellet, the pellet hits the bottom, or time runs out."
speed:
  1: "3 fish; hungry fish fixed."
  2: "5 fish; hungry fish switches once."
  3: "7 fish; hungry fish switches twice."
```

### 20. Stamp of Approval

Documents slide past on a conveyor belt beneath a rubber stamp. Only the documents with a gold star in the corner should be stamped. The player clicks to stamp each valid one as it passes. As the game speeds up, the belt moves faster and decoy documents with silver stars appear. Stamping a decoy or missing a valid document loses the round.

```yaml
id: stamp-of-approval
category: "Aim & Click"
input: "pointer-click"
prompt: "Stamp!"
duration_s: 6
win: "Every gold-star document stamped and no decoys stamped."
lose: "A decoy is stamped, or a gold-star document passes unstamped."
speed:
  1: "Belt 120px/s; 4 documents; no decoys."
  2: "Belt 180px/s; 6 documents; 1-2 silver-star decoys."
  3: "Belt 250px/s; 8 documents; 3-4 decoys."
```

---

## Drag & Trace

### 21. Plug It In

A lamp's cord dangles across the floor while a wall outlet waits nearby. The player drags the plug into the socket. At higher speeds the outlet slides along the wall and the cord gets shorter, limiting reach. If the lamp is still dark when time runs out, the player loses.

```yaml
id: plug-it-in
category: "Drag & Trace"
input: "pointer-drag"
prompt: "Plug in!"
duration_s: 4
win: "Plug dropped into the outlet; lamp lights."
lose: "Lamp still dark when time runs out."
speed:
  1: "Outlet static; long cord."
  2: "Outlet slides slowly; cord shorter."
  3: "Outlet slides quickly; cord barely reaches its path."
```

### 22. Zip It Up

A jacket is shown with its zipper at the bottom and a wavy track leading to the collar. The player drags the zipper pull along the track to the top. As the microgame speeds up, the track becomes curvier and the timer shorter. Straying off the track jams the zipper, and the player loses.

```yaml
id: zip-it-up
category: "Drag & Trace"
input: "pointer-drag (trace)"
prompt: "Zip!"
duration_s: 4
win: "Zipper pull traced to the collar without leaving the track."
lose: "Pull leaves the track tolerance (jam), or does not reach the top in time."
speed:
  1: "Gentle curve; track tolerance 30px."
  2: "Two S-bends; tolerance 22px."
  3: "Four tight bends; tolerance 15px."
```

### 23. Peel Out

A banana sits on a plate with its stem pointing up. The player drags downward three times to pull back each section of peel. At higher speeds the banana slowly rolls around the plate, so the player has to track it. An unpeeled banana when time runs out loses the round.

```yaml
id: peel-out
category: "Drag & Trace"
input: "pointer-drag (swipe)"
prompt: "Peel!"
duration_s: 4
win: "All three peel sections swiped down."
lose: "Any section still attached when time runs out."
speed:
  1: "Banana stationary."
  2: "Banana rolls slowly around the plate."
  3: "Banana rolls quickly and rotates."
```

### 24. Fresh Coat

A white picket fence with bare planks stretches across the screen. The player drags a paintbrush across the planks to color each one fully. As the game speeds up, the fence gets longer and a dog wanders by and smudges a plank that must be repainted. Any bare or smudged plank at the end loses the microgame.

```yaml
id: fresh-coat
category: "Drag & Trace"
input: "pointer-drag (scrub)"
prompt: "Paint!"
duration_s: 6
win: "Every plank at 100% coverage at the end."
lose: "Any bare or smudged plank remains when time runs out."
speed:
  1: "6 planks; no dog."
  2: "9 planks; dog smudges 1 plank."
  3: "12 planks; dog smudges 2-3 planks."
```

### 25. Laundry Day

A pile of clothes sits between a white basket and a colored basket. The player drags each item into the correct basket. At higher speeds the pile grows and items with tricky colors, like off-white or pale pink, appear. Dropping a red sock in the whites basket turns the whole load pink, and the player loses.

```yaml
id: laundry-day
category: "Drag & Trace"
input: "pointer-drag"
prompt: "Sort!"
duration_s: 6
win: "Every item placed in the correct basket."
lose: "Any item in the wrong basket, or items left when time runs out."
speed:
  1: "4 items with clear colors."
  2: "6 items; 1 ambiguous shade."
  3: "8 items; 3 ambiguous shades (off-white, pale pink, light gray)."
```

### 26. Balance the Scale

A balance scale tips to one side under a heavy object. Several weights of different sizes sit nearby, and the player drags weights onto the lighter pan until the beam is level. As the game speeds up, the weights get closer in size and the target gets fussier. If the beam is still tilted when time runs out, the player loses.

```yaml
id: balance-the-scale
category: "Drag & Trace"
input: "pointer-drag"
prompt: "Balance!"
duration_s: 6
win: "Beam within the level tolerance when time runs out."
lose: "Beam tilted beyond tolerance when time runs out."
speed:
  1: "3 weights with distinct sizes; tolerance +/-5 degrees."
  2: "4 weights with closer sizes; tolerance +/-3 degrees."
  3: "5 weights, two nearly identical; tolerance +/-1.5 degrees."
```

### 27. Maze Dash

A small maze appears with a dot at the entrance and a flag at the exit. The player drags the dot through the corridors to reach the flag. At higher speeds the maze has more turns and the timer is shorter. Touching a wall sends the dot back to the start, and failing to reach the flag in time loses the microgame.

```yaml
id: maze-dash
category: "Drag & Trace"
input: "pointer-drag (trace)"
prompt: "Escape!"
duration_s: 6
win: "Dot reaches the exit flag."
lose: "Flag not reached in time (wall touches reset the dot to the start)."
speed:
  1: "5x5 maze."
  2: "7x7 maze."
  3: "9x9 maze."
```

### 28. Price Check

A grocery item sits on a checkout counter beside a red scanner beam. The player drags the item over the beam with its barcode facing down to scan it, and a green check flashes when it registers. As the game speeds up, items arrive in random orientations and several must be scanned in a row. An item left unscanned when the timer ends loses the round.

```yaml
id: price-check
category: "Drag & Trace"
input: "pointer-drag + rotate"
prompt: "Scan!"
duration_s: 6
win: "Every item passed over the beam with its barcode facing down."
lose: "Any item unscanned when the timer ends."
speed:
  1: "1 item, barcode already facing down."
  2: "2 items, random orientation (rotate with a key or right-click)."
  3: "3 items, random orientation."
```

### 29. Last Piece

A jigsaw puzzle is complete except for one empty slot. The player drags the correct piece into the gap. At higher speeds, two or three nearly identical candidate pieces appear and only one fits. Dropping the wrong piece makes it bounce out, and running out of time loses the microgame.

```yaml
id: last-piece
category: "Drag & Trace"
input: "pointer-drag"
prompt: "Fit it!"
duration_s: 4
win: "The correct piece is dropped into the gap."
lose: "A wrong piece is dropped, or time runs out."
speed:
  1: "1 candidate piece."
  2: "2 candidates with different tabs."
  3: "3 candidates with near-identical tabs."
```

### 30. Top of the Tree

A holiday tree sways gently in the wind, and a star lies on the floor beside it. The player drags the star up and places it exactly on the topmost branch. As the microgame speeds up, the tree sways harder and the tip moves farther. A star that lands crooked or falls off loses the round.

```yaml
id: top-of-the-tree
category: "Drag & Trace"
input: "pointer-drag"
prompt: "Top it!"
duration_s: 4
win: "Star dropped within tolerance of the tree tip."
lose: "Star dropped crooked or off the tip, or not placed in time."
speed:
  1: "Tip sways 20px; tolerance 25px."
  2: "Tip sways 45px; tolerance 18px."
  3: "Tip sways 70px with gusts; tolerance 12px."
```

---

## Mash & Hold

### 31. Pump It

A deflated bicycle tire is attached to a hand pump with a pressure gauge on top. The player mashes the button to pump air, and the needle must stop in the green zone. As the game speeds up, each pump adds more pressure and the green zone narrows. Under-filling leaves a flat tire; over-pumping makes it burst in a starburst of rubber scraps, and the player loses.

```yaml
id: pump-it
category: "Mash & Hold"
input: "button-mash"
prompt: "Pump!"
duration_s: 5
win: "Gauge needle stops in the green zone."
lose: "Needle below green (flat) or above green (burst) at the end."
speed:
  1: "+6% pressure per press; green 60-80%."
  2: "+9% per press; green 65-78%."
  3: "+12% per press; green 70-76%."
```

### 32. Tug of War

Two teams grip a rope with a flag tied at the center, and the player's team is on the left. The player mashes the button to pull the flag over their side's line. At higher speeds the opposing team pulls harder. If the flag crosses to the other side, the player's team tumbles into the mud, and the player loses.

```yaml
id: tug-of-war
category: "Mash & Hold"
input: "button-mash"
prompt: "Pull!"
duration_s: 5
win: "Flag crosses the player's line."
lose: "Flag crosses the opponent's line, or neither line when time runs out."
speed:
  1: "Opponent pulls at 4 presses/s equivalent."
  2: "Opponent at 6 presses/s."
  3: "Opponent at 8 presses/s with surges."
```

### 33. Wake Up Call

A sleeper lies in bed with Zzz bubbles floating up while a school bus idles outside the window. The player mashes the button to shake the sleeper awake before the bus pulls away. As the microgame speeds up, the sleeper is drowsier and the bus leaves sooner. If the bus drives off while the sleeper is still asleep, the player loses.

```yaml
id: wake-up-call
category: "Mash & Hold"
input: "button-mash"
prompt: "Wake up!"
duration_s: 5
win: "Sleeper's wake meter reaches full before the bus leaves at the end of the timer."
lose: "Bus leaves while the sleeper is still asleep."
speed:
  1: "Needs 15 presses; no meter decay."
  2: "Needs 22 presses; meter decays slowly."
  3: "Needs 30 presses; meter decays faster."
```

### 34. Candle Blowout

A birthday cake is topped with a row of lit candles. The player holds the button to blow, and the flames go out in order from left to right. A few trick candles relight after a moment and must be blown out again. At higher speeds there are more candles and more trick ones. Any flame still burning at the end loses the round.

```yaml
id: candle-blowout
category: "Mash & Hold"
input: "button-hold"
prompt: "Blow!"
duration_s: 6
win: "All candles, including relit trick candles, out at the end."
lose: "Any flame still burning when time runs out."
speed:
  1: "5 candles; no trick candles."
  2: "8 candles; 1 trick candle."
  3: "12 candles; 3 trick candles."
```

### 35. Soft Landing

A small lander descends toward a landing pad while a speed gauge climbs. The player holds the button to fire the thruster and slow down, and releases it to drop. As the game speeds up, gravity gets stronger and fuel runs lower. Touching down too fast crumples the lander, and the player loses.

```yaml
id: soft-landing
category: "Mash & Hold"
input: "button-hold"
prompt: "Land!"
duration_s: 6
win: "Lander touches the pad below the safe speed."
lose: "Touchdown above the safe speed, or off the pad."
speed:
  1: "Low gravity; ample fuel."
  2: "Medium gravity; fuel for 2s of thrust."
  3: "High gravity; fuel for 1.2s of thrust."
```

---

## Move & Dodge

### 36. Lane Change

A car drives up a three-lane highway as traffic cones appear ahead in random lanes. The player presses up or down to switch lanes and avoid them. At higher speeds the cones come faster and appear in tighter patterns. Hitting a cone sends it flying off the hood, and the player loses.

```yaml
id: lane-change
category: "Move & Dodge"
input: "directional (up/down)"
prompt: "Dodge!"
duration_s: 5
win: "No cone hit before time runs out."
lose: "Car collides with any cone."
speed:
  1: "3 lanes; a cone every 900ms."
  2: "3 lanes; a cone every 600ms; occasional pairs."
  3: "3 lanes; a cone every 400ms; pairs common."
```

### 37. Brolly

A cat naps on a park bench while rain clouds drift overhead, dropping bursts of rain at random spots. The player moves an umbrella left and right to keep the cat dry. As the microgame speeds up, the clouds move faster and drop rain in quick succession. If the cat gets wet, it leaps up with its fur standing on end and an angry scowl, and the player loses.

```yaml
id: brolly
category: "Move & Dodge"
input: "directional (left/right)"
prompt: "Cover!"
duration_s: 5
win: "Cat stays dry until time runs out."
lose: "Any raindrop reaches the cat."
speed:
  1: "1 cloud; a burst every 1s."
  2: "2 clouds; a burst every 700ms."
  3: "3 clouds; a burst every 450ms."
```

### 38. Egg Catcher

A row of hens sits on a high ledge, dropping eggs at random intervals. The player moves a basket left and right to catch a set number of eggs. At higher speeds the eggs fall faster and more hens join in. A single splat on the ground loses the microgame.

```yaml
id: egg-catcher
category: "Move & Dodge"
input: "directional (left/right)"
prompt: "Catch!"
duration_s: 6
win: "Required number of eggs caught."
lose: "Any egg hits the ground."
speed:
  1: "2 hens; catch 3 eggs; slow fall."
  2: "3 hens; catch 4 eggs; medium fall."
  3: "4 hens; catch 5 eggs; fast fall with near-simultaneous drops."
```

### 39. Duckling Dash

A duckling waits at the bottom of a two-lane road with its mother on the other side. Cars pass in both directions, and the player presses forward to waddle across one step at a time. As the game speeds up, the cars get faster and the gaps shorter. If the duckling is in a lane when a car passes, it spins away in a cloud of feathers, and the player loses.

```yaml
id: duckling-dash
category: "Move & Dodge"
input: "directional (forward)"
prompt: "Cross!"
duration_s: 6
win: "Duckling reaches the far side of the road."
lose: "Duckling is in a lane when a car passes, or time runs out."
speed:
  1: "Cars at 150px/s with wide gaps."
  2: "Cars at 230px/s with medium gaps."
  3: "Cars at 320px/s with narrow, irregular gaps."
```

### 40. Freeze!

A runner faces a goal line while a guard stands at the far end with their back turned. The player holds the button to move forward and releases it to stop, but the guard spins around without warning. At higher speeds the guard turns more often and with less hesitation. Being caught moving when the guard looks loses the microgame.

```yaml
id: freeze
category: "Move & Dodge"
input: "button-hold"
prompt: "Sneak!"
duration_s: 6
win: "Runner crosses the goal line."
lose: "Runner is moving when the guard is facing them, or time runs out."
speed:
  1: "Guard turns every 1.5-2.0s with a 300ms tell."
  2: "Turns every 1.0-1.8s with a 180ms tell."
  3: "Turns every 0.6-1.5s with no tell."
```

### 41. Tightrope

A performer walks a high wire, leaning as gusts of wind push from either side. The player presses left or right to counter each lean and keep them upright until they reach the far platform. As the game speeds up, the gusts come faster and stronger. Leaning too far sends the walker dropping into the net, and the player loses.

```yaml
id: tightrope
category: "Move & Dodge"
input: "directional (left/right)"
prompt: "Balance!"
duration_s: 6
win: "Walker reaches the far platform upright."
lose: "Lean angle exceeds the fall threshold."
speed:
  1: "Gusts every 1.2s; small push."
  2: "Gusts every 0.8s; medium push."
  3: "Gusts every 0.5s; strong push from random sides."
```

### 42. Save!

A goalkeeper guards a net as a striker kicks a ball toward one of several spots. The player moves the keeper's gloves to block the shot. At higher speeds the shots come faster and the striker fakes a direction before kicking. If the ball hits the back of the net, the other team's fans jump up waving flags, and the player loses.

```yaml
id: save
category: "Move & Dodge"
input: "directional (4-way) or pointer"
prompt: "Block!"
duration_s: 4
win: "Ball contacts the keeper's gloves."
lose: "Ball crosses the goal line."
speed:
  1: "3 target spots; no fakes."
  2: "5 target spots; 1 fake."
  3: "6 target spots; fake then quick kick."
```

### 43. Scoop Stack

A waffle cone moves left and right along the bottom of the screen as ice cream scoops fall from above. The player catches a set number of scoops to build a tall cone, but must avoid falling broccoli. As the microgame speeds up, the scoops fall faster and the stack wobbles, making it harder to position. Catching broccoli or letting the tower tip over loses the round.

```yaml
id: scoop-stack
category: "Move & Dodge"
input: "directional (left/right)"
prompt: "Scoop!"
duration_s: 6
win: "Required number of scoops caught without catching broccoli."
lose: "Broccoli is caught, or the stack topples."
speed:
  1: "Catch 3; no broccoli."
  2: "Catch 4; 1-2 broccoli."
  3: "Catch 5; 3 broccoli; stack sways more as it grows."
```

---

## Memory & Logic

### 44. Echo Pads

Four colored pads light up one at a time in a short sequence, each glowing brightly as it flashes. The player clicks the pads to repeat the sequence in the same order. At higher speeds the sequence is longer and plays faster. Clicking a wrong pad makes all four pads flash red, and the player loses.

```yaml
id: echo-pads
category: "Memory & Logic"
input: "pointer-click"
prompt: "Repeat!"
duration_s: 6
win: "Full sequence reproduced in order."
lose: "Any wrong pad clicked, or time runs out."
speed:
  1: "3-step sequence at 600ms per step."
  2: "4-step sequence at 450ms."
  3: "5-step sequence at 320ms."
```

### 45. Shell Game

A ball is placed under one of three cups, and the cups shuffle around the table. When they stop, the player clicks the cup hiding the ball. As the game speeds up, the cups shuffle faster, swap more times, and a fourth cup is added. Picking an empty cup loses the microgame.

```yaml
id: shell-game
category: "Memory & Logic"
input: "pointer-click"
prompt: "Find it!"
duration_s: 6
win: "The cup hiding the ball is clicked."
lose: "An empty cup is clicked, or time runs out."
speed:
  1: "3 cups; 4 swaps at 400ms each."
  2: "3 cups; 6 swaps at 280ms."
  3: "4 cups; 8 swaps at 200ms."
```

### 46. Count the Sheep

Sheep leap over a fence one after another, sometimes in clumps and sometimes with a goat mixed in. When they stop, the player picks the number of sheep (not goats) from three choices. At higher speeds more sheep jump and they move faster. Choosing the wrong number makes the sleepy shepherd wake up, and the player loses.

```yaml
id: count-the-sheep
category: "Memory & Logic"
input: "pointer-click (multiple choice)"
prompt: "Count!"
duration_s: 6
win: "The correct sheep count is picked."
lose: "Wrong count picked, or time runs out."
speed:
  1: "3-5 sheep, one at a time; no goats."
  2: "5-8 sheep with some clumps; 1 goat."
  3: "8-12 sheep in clumps; 2-3 goats."
```

### 47. Shadow Match

An everyday object appears at the top of the screen, such as a teapot or a bicycle. Below it are three black silhouettes, and the player clicks the one that matches the object exactly. As the game speeds up, the silhouettes become more similar and are sometimes rotated. Picking the wrong shadow loses the round.

```yaml
id: shadow-match
category: "Memory & Logic"
input: "pointer-click (multiple choice)"
prompt: "Match!"
duration_s: 4
win: "The matching silhouette is clicked."
lose: "Wrong silhouette clicked, or time runs out."
speed:
  1: "3 options; clearly different."
  2: "3 options; similar outlines."
  3: "4 options; similar outlines, some rotated or mirrored."
```

### 48. Arrow Rush

A string of arrows flashes across the screen, and the player presses the matching direction for each one in turn. Green arrows mean press that direction, and red arrows mean press the opposite. At higher speeds the arrows come faster and more of them are red. A single wrong press loses the microgame.

```yaml
id: arrow-rush
category: "Memory & Logic"
input: "directional (4-way)"
prompt: "Follow!"
duration_s: 5
win: "Every arrow answered correctly."
lose: "Any wrong press, or time runs out."
speed:
  1: "4 arrows; all green."
  2: "6 arrows; 2 red."
  3: "8 arrows; half red, shown faster."
```

### 49. Quick Math

A simple equation appears, such as 7 + 5, with three possible answers floating beneath it. The player clicks the correct one before time runs out. As the microgame speeds up, the numbers get larger and the operations mix addition, subtraction, and multiplication. A wrong answer or a timeout loses the round.

```yaml
id: quick-math
category: "Memory & Logic"
input: "pointer-click (multiple choice)"
prompt: "Solve!"
duration_s: 4
win: "The correct answer is clicked."
lose: "Wrong answer clicked, or time runs out."
speed:
  1: "Single-digit addition."
  2: "Two-digit addition or subtraction."
  3: "Mixed operations including single-digit multiplication."
```

### 50. Key Fit

A lock is shown with a silhouette of the key it needs, and a ring of several keys hangs below it. The player clicks the key whose teeth match the silhouette. At higher speeds the ring holds more keys with near-identical patterns, and the ring slowly spins. Choosing the wrong key makes it jam halfway in the lock with a red X over it, and the player loses.

```yaml
id: key-fit
category: "Memory & Logic"
input: "pointer-click"
prompt: "Unlock!"
duration_s: 5
win: "The key matching the silhouette is clicked."
lose: "Wrong key clicked, or time runs out."
speed:
  1: "3 keys; clearly different teeth."
  2: "5 keys; similar teeth."
  3: "7 keys; near-identical teeth; ring rotates slowly."
```
