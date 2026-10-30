import { defineGame } from '@arcade/sdk';
import { createState, step } from './logic';
import { draw } from './render';

export default defineGame({
  contractVersion: 1,
  create(ctx) {
    const { g } = ctx.createCanvas();
    const state = createState(ctx.difficulty.level, ctx.rng);
    let time = 0;
    let swing = 0;
    const render = () => draw(g, state, ctx.input.pointer, time, swing, ctx.reducedMotion);
    render();

    return {
      tick(frame) {
        if (frame.phase === 'play' && !state.verdict) {
          const scaledDt = frame.dt * ctx.difficulty.speed;
          time += scaledDt;
          swing = Math.max(0, swing - scaledDt);
          const pointer = ctx.input.pointer;
          const click = pointer.inside && ctx.input.wasPressed('action') ? pointer : null;
          if (click) swing = 180;
          if (step(state, frame.dt, ctx.difficulty.speed, ctx.rng, click)) ctx.resolve('win');
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
