import { describe, expect, it } from 'vitest';
import { createRng } from '../../../tests/helpers/fake-host';
import { createState, FRAME_HEIGHT, FRAME_WIDTH, fullyInside, RADIUS, step } from './logic';

const idle = { x: 0, y: 0, down: false, pressed: false, released: false, inside: true };

describe('Say Cheese logic', () => {
  it('requires the whole friend inside, including at the edges', () => {
    const frame = { x: 100, y: 100 };
    expect(fullyInside(frame, { x: 100 + RADIUS, y: 100 + RADIUS })).toBe(true);
    expect(fullyInside(frame, { x: 100 + FRAME_WIDTH - RADIUS, y: 100 + FRAME_HEIGHT - RADIUS })).toBe(true);
    expect(fullyInside(frame, { x: 100 + RADIUS - 0.01, y: 150 })).toBe(false);
    expect(fullyInside(frame, { x: 150, y: 100 + FRAME_HEIGHT - RADIUS + 0.01 })).toBe(false);
  });

  it('drags without shooting and clamps the frame', () => {
    const state = createState(1, createRng(1), 1);
    step(state, 0, { ...idle, x: 100, y: 400, down: true, pressed: true });
    step(state, 0, { ...idle, x: 900, y: 700, down: true });
    step(state, 0, { ...idle, x: 900, y: 700, released: true });
    expect(state.frame).toEqual({ x: 960 - FRAME_WIDTH, y: 720 - FRAME_HEIGHT });
    expect(state.verdict).toBeNull();
  });

  it('shoots on a click and checks all friends', () => {
    const state = createState(1, createRng(1), 1);
    state.frame = { x: 390, y: 200 };
    step(state, 0, { ...idle, x: 400, y: 250, down: true, pressed: true });
    step(state, 0, { ...idle, x: 400, y: 250, released: true });
    expect(state.verdict).toBe('win');
    const miss = createState(1, createRng(1), 1);
    step(miss, 0, { ...idle, x: 100, y: 400, down: true, pressed: true });
    step(miss, 0, { ...idle, x: 100, y: 400, released: true });
    expect(miss.verdict).toBe('lose');
  });

  it('keeps friends coverable and deterministic at every level and speed', () => {
    for (const level of [1, 2, 3] as const) for (const speed of [1, 2.5]) {
      const a = createState(level, createRng(42), speed);
      const b = createState(level, createRng(42), speed);
      for (let i = 0; i < 300; i++) {
        step(a, 1000 / 60, idle);
        step(b, 1000 / 60, idle);
        const xs = a.friends.map((f) => f.x);
        const ys = a.friends.map((f) => f.y);
        expect(Math.max(...xs) - Math.min(...xs) + 2 * RADIUS).toBeLessThanOrEqual(FRAME_WIDTH);
        expect(Math.max(...ys) - Math.min(...ys) + 2 * RADIUS).toBeLessThanOrEqual(FRAME_HEIGHT);
      }
      expect(a).toEqual(b);
    }
  });
});
