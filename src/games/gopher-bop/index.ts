import { defineGame } from '@arcade/sdk';
import { createState, step } from './logic';
import { draw } from './render';

export default defineGame({
  contractVersion: 1,
  create(ctx) {
    const { g } = ctx.createCanvas();
    const state = createState(ctx.difficulty.level, ctx.rng, ctx.timeLimitMs, ctx.difficulty.speed);
    const render = () => draw(g, state, ctx.input.pointer, ctx.reducedMotion);
    render();
    return {
      tick(frame) {
        if (frame.phase === 'play' && !state.verdict) {
          const pointer = ctx.input.pointer;
          const click = pointer.inside && ctx.input.wasPressed('action') ? pointer : null;
          step(state, frame.dt, click);
          if (!state.verdict && frame.remaining === 0) state.verdict = 'lose';
          if (state.verdict) ctx.resolve(state.verdict);
        }
        render();
      },
      end(outcome) {
        state.verdict = outcome;
        render();
      },
    };
  },
});
