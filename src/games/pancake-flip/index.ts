import { defineGame } from '@arcade/sdk';
import { createState, levelParams, step } from './logic';
import { draw } from './render';

export default defineGame({
  contractVersion: 1,
  create(ctx) {
    const { g } = ctx.createCanvas();
    const maxDrift = levelParams(ctx.difficulty.level).maxDrift;
    const state = createState(ctx.difficulty.level, ctx.rng.range(-maxDrift, maxDrift));
    let time = 0;
    const render = () => draw(g, state, time, ctx.reducedMotion);
    render();

    return {
      tick(frame) {
        if (frame.phase === 'play' && !state.verdict) {
          time += frame.dt * ctx.difficulty.speed;
          const direction = Number(ctx.input.isDown('right')) - Number(ctx.input.isDown('left'));
          const verdict = step(state, frame.dt, ctx.input.wasPressed('action'), direction, ctx.difficulty.speed);
          if (verdict) ctx.resolve(verdict === 'win' ? 'win' : 'lose');
          else if (frame.remaining === 0) {
            state.verdict = 'timeout';
            ctx.resolve('lose');
          }
        } else if (frame.phase === 'settle') {
          time += frame.dt;
        }
        render();
      },
      end(outcome) {
        if (!state.verdict) state.verdict = outcome === 'win' ? 'win' : 'timeout';
        render();
      },
    };
  },
});
