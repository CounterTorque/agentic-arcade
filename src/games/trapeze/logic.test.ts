import { describe, expect, it } from 'vitest';
import { depth } from '../../../tests/helpers/depth';
import { createRng } from '../../../tests/helpers/fake-host';
import { barPosition, levelParams, partnerHands, simulateFlight, type Level } from './logic';

describe('trapeze physics', () => {
  it('uses the specified catch tolerances and mirrored level-one swings', () => {
    expect([1, 2, 3].map((level) => levelParams(level as Level).tolerance)).toEqual([40, 30, 20]);
    const params = levelParams(1);
    for (const time of [0, 200, 500, 1000]) {
      const left = barPosition(time, params, 0.3, 'left');
      const right = barPosition(time, params, 0.3, 'right');
      expect(left.x + right.x).toBeCloseTo(960);
      expect(left.y).toBeCloseTo(right.y);
    }
  });

  it('only catches when the flight reaches the moving partner', () => {
    const params = levelParams(1);
    const phase = 0;
    const flights = Array.from({ length: 84 }, (_, i) => ({
      time: (i + 1) * 1000 / 60,
      flight: simulateFlight((i + 1) * 1000 / 60, params, 1, phase),
    }));
    const catchAttempt = flights.find(({ flight }) => flight.caught)!;
    const missAttempt = flights.find(({ flight }) => !flight.caught)!;
    expect(catchAttempt).toBeDefined();
    expect(missAttempt).toBeDefined();
    const end = catchAttempt.flight.path.at(-1)!;
    const hands = partnerHands(catchAttempt.time + catchAttempt.flight.duration, params, phase);
    expect(Math.hypot(end.x - hands.x, end.y - hands.y)).toBeLessThanOrEqual(params.tolerance);
    expect(missAttempt.flight.closest).toBeGreaterThan(params.tolerance);
    expect(simulateFlight(catchAttempt.time, params, 1, phase, false).caught).toBe(false);
  });

  it('offers both catches and misses within each round across seeds and speeds', () => {
    for (const seed of depth([1, 2, 3], Array.from({ length: 30 }, (_, i) => i + 1))) {
      const phase = createRng(seed).range(0, 1);
      for (const speed of [1, 1.75, 2.5]) {
        for (const level of [1, 2, 3] as const) {
          const params = levelParams(level);
          let caught = false;
          let missed = false;
          for (let frame = 0; frame < Math.floor(5000 / speed / (1000 / 60)); frame++) {
            const flight = simulateFlight((frame + 1) * 1000 / 60, params, speed, phase);
            expect(flight.duration).toBeLessThanOrEqual(600 / speed);
            caught ||= flight.caught;
            missed ||= !flight.caught;
          }
          expect({ seed, speed, level, caught, missed }).toMatchObject({ caught: true, missed: true });
        }
      }
    }
  });
});
