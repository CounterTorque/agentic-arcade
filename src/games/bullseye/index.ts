import { defineGame } from '@arcade/sdk';
import { createState, shoot, step } from './logic';
import { draw } from './render';

export default defineGame({
  contractVersion: 1,
  create(ctx) {
    const { g } = ctx.createCanvas();
    const state = createState(ctx.difficulty.level, ctx.rng);
    let time = 0;
    let settle = 0;
    const render = () => draw(g, state, ctx.input.pointer, time, settle, ctx.reducedMotion);
    render();

    return {
      tick(frame) {
        if (frame.phase === 'play' && !state.verdict) {
          step(state, frame.dt, ctx.difficulty.speed, ctx.rng);
          time += frame.dt * ctx.difficulty.speed;
          const pointer = ctx.input.pointer;
          if (pointer.inside && ctx.input.wasPressed('action')) ctx.resolve(shoot(state, pointer));
          else if (frame.remaining === 0) {
            state.verdict = 'timeout';
            ctx.resolve('lose');
          }
        } else if (frame.phase === 'settle') {
          settle += frame.dt;
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
