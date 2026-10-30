import { defineGame } from '@arcade/sdk';
import { createState, evaluate, step } from './logic';
import { draw } from './render';

export default defineGame({
  contractVersion: 1,
  create(ctx) {
    const { g } = ctx.createCanvas();
    const state = createState(ctx.difficulty.level, ctx.rng, ctx.timeLimitMs);
    let time = 0;
    const render = () => draw(g, state, ctx.input.pointer, time, ctx.reducedMotion);
    render();

    return {
      tick(frame) {
        if (frame.phase === 'play' && !state.verdict) {
          time += frame.dt * ctx.difficulty.speed;
          const pointer = ctx.input.pointer;
          const click = pointer.inside && ctx.input.wasPressed('action') ? pointer : null;
          step(state, frame.dt, ctx.rng, click);
          if (frame.remaining === 0) {
            state.verdict = evaluate(state);
            ctx.resolve(state.verdict);
          }
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
