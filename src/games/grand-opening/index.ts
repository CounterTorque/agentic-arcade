import { defineGame } from '@arcade/sdk';
import { createState, step } from './logic';
import { createRenderer } from './render';

export default defineGame({
  contractVersion: 1,

  create(ctx) {
    const state = createState(ctx.difficulty, ctx.rng);
    const renderer = createRenderer(ctx);
    
    // Draw initial frame
    renderer.draw(state);

    return {
      tick(frame) {
        if (frame.phase === 'play') {
          const snipPressed = ctx.input.wasPressed('action');
          step(state, frame.dt, snipPressed, ctx.difficulty, ctx.rng);
          
          // Resolve outcome when snipped
          if (state.snipped && state.result) {
            ctx.resolve(state.result === 'hit' ? 'win' : 'lose');
          }
        }
        
        renderer.draw(state);
      },
    };
  },
});
