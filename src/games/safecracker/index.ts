import { defineGame } from '@arcade/sdk';
import { createState, levelParams, step } from './logic';
import { draw } from './render';

export default defineGame({
  contractVersion: 1,
  create(ctx) {
    const { g } = ctx.createCanvas();
    const params = levelParams(ctx.difficulty.level);
    const state = createState(ctx.rng.next());
    let settleMs = 0;

    function render(): void {
      draw(g, state, params, ctx.input.isDown('action'), settleMs, ctx.reducedMotion);
    }

    render();
    return {
      tick(frame) {
        if (frame.phase === 'play') {
          step(state, frame.dt, ctx.input.wasPressed('action'), params, ctx.difficulty.speed, () => ctx.rng.next());
          if (!state.result && frame.remaining === 0) state.result = 'timeout';
          if (state.result) ctx.resolve(state.result === 'win' ? 'win' : 'lose');
        } else if (frame.phase === 'settle') {
          settleMs += frame.dt;
        }
        render();
      },
      end(outcome) {
        if (!state.result) state.result = outcome === 'win' ? 'win' : 'timeout';
      },
    };
  },
});
