import { defineGame } from '@arcade/sdk';
import { createState, step } from './logic';
import { draw } from './render';

export default defineGame({
  contractVersion: 1,
  create(ctx) {
    const { g } = ctx.createCanvas();
    const state = createState(ctx.difficulty.level, ctx.rng, ctx.difficulty.speed);
    let wasDown = false;
    let pointerPressed = false;
    let pointerReleased = false;
    let settle = 0;
    const onDown = (event: PointerEvent) => {
      if (event.button === 0) pointerPressed = true;
    };
    const onUp = (event: PointerEvent) => {
      if (event.button === 0) pointerReleased = true;
    };
    ctx.root.onpointerdown = onDown;
    ctx.root.onpointerup = onUp;
    const render = () => draw(g, state, settle, ctx.reducedMotion);
    render();
    return {
      start() {
        pointerPressed = false;
        pointerReleased = false;
      },
      tick(frame) {
        if (frame.phase === 'play' && !state.verdict) {
          const pointer = ctx.input.pointer;
          step(state, frame.dt, {
            ...pointer,
            pressed: pointerPressed || (pointer.down && !wasDown),
            released: pointerReleased || (!pointer.down && wasDown),
          });
          pointerPressed = false;
          pointerReleased = false;
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
        ctx.root.onpointerup = null;
      },
    };
  },
});
