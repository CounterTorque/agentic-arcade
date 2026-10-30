# Safecracker

Crack a bank vault by locking all three tumblers as the red dial notch passes the gold marker. Press Space or click to lock; a mistimed press jams the safe. Running out of time also loses.

The dial turns at 1, 1.4 or 1.8 revolutions per second at levels 1, 2 and 3. The lock windows are 120, 90 and 70 ms at speed 1. Level 2 reverses after each lock; level 3 can reverse at the far side of the dial. Host speed multiplies rotation, so the time window shrinks accordingly.

The window is an angular span and the hit test sweeps the notch over each tick, including at low frame rates. A latch prevents repeated locks on the same pass. Level 3 reversals occur opposite the marker, keeping the next pass reachable.
