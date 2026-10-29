import { defineGame } from '@arcade/sdk';
import { createState, step } from './logic';
import { draw } from './render';

export default defineGame({
  contractVersion: 1,
  create(ctx) {
    const { g } = ctx.createCanvas();
    const state = createState(ctx.difficulty.level);
    let settleTime = 0;
    const render = () => draw(g, state, settleTime, ctx.reducedMotion);
    render();

    return {
      tick(frame) {
        if (frame.phase === 'play' && !state.verdict) {
          const verdict = step(state, frame.dt, ctx.input.wasPressed('action'), ctx.difficulty.speed, () => ctx.rng.range(900, 1500));
          if (verdict) ctx.resolve(verdict === 'win' ? 'win' : 'lose');
          else if (frame.remaining === 0) {
            state.verdict = 'timeout';
            ctx.resolve('lose');
          }
        } else if (frame.phase === 'settle') {
          settleTime += frame.dt;
        }
        render();
      },
    };
  },
});
