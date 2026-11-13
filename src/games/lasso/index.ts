import { defineGame } from '@arcade/sdk';
import { createState, step } from './logic';
import { draw } from './render';

export default defineGame({
  contractVersion: 1,
  create(ctx) {
    const { g } = ctx.createCanvas();
    const state = createState(ctx.difficulty.level, ctx.rng, ctx.difficulty.speed);
    let wasDown = false;
    let pressed = false;
    let settle = 0;
    const onDown = (event: PointerEvent) => {
      if (event.button === 0) pressed = true;
    };
    ctx.root.onpointerdown = onDown;
    const render = () => draw(g, state, ctx.input.pointer, settle, ctx.reducedMotion);
    render();
    return {
      start() {
        pressed = false;
        wasDown = ctx.input.pointer.down;
      },
      tick(frame) {
        if (frame.phase === 'play' && !state.verdict) {
          const pointer = ctx.input.pointer;
          step(state, frame.dt, { ...pointer, pressed: pressed || (pointer.down && !wasDown) });
          pressed = false;
          wasDown = pointer.down;
          if (!state.verdict && frame.remaining === 0) state.verdict = 'lose';
          if (state.verdict) ctx.resolve(state.verdict);
        } else if (frame.phase === 'settle') settle += frame.dt;
        render();
      },
      end(outcome) {
        state.verdict = outcome;
        render();
      },
      destroy() {
        ctx.root.onpointerdown = null;
      },
    };
  },
});
