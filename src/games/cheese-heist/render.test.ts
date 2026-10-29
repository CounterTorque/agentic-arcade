import { describe, expect, it, vi } from 'vitest';
import { createState, step } from './logic';
import { draw } from './render';

describe('Cheese Heist rendering', () => {
  it('shows the stolen cheese when the mouse is caught', () => {
    const state = createState(1);
    const randomArmed = () => 1000;
    step(state, 800, false, 1, randomArmed);
    step(state, 500, true, 1, randomArmed);
    step(state, 1600, false, 1, randomArmed);
    expect(state).toMatchObject({ verdict: 'caught', cheese: true });

    const g = document.createElement('canvas').getContext('2d')!;
    const fillRect = vi.fn();
    g.fillRect = fillRect;
    draw(g, state, 400, false);
    expect(fillRect).toHaveBeenCalledWith(710, 465, 64, 53);
  });
});
