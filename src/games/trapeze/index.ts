import { defineGame } from '@arcade/sdk';
import { createState, step, isWin, isLose } from './logic';
import { render } from './render';

export default defineGame({
  contractVersion: 1,

  create(ctx) {
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 720;
    canvas.style.cssText = 'display:block;width:100%;height:100%;';
    ctx.root.appendChild(canvas);

    const g = canvas.getContext('2d')!;
    const state = createState(ctx.difficulty);

    return {
      tick(frame) {
        if (frame.phase === 'play') {
          const actionPressed = ctx.input.wasPressed('action');
          step(state, frame.dt, actionPressed, ctx.difficulty);

          if (isWin(state)) {
            ctx.resolve('win');
          } else if (isLose(state)) {
            ctx.resolve('lose');
          }
        }

        render(canvas, g, state);
      },

      end(outcome) {
        // Draw final state with outcome message
        render(canvas, g, state);
        g.fillStyle = outcome === 'win' ? 'rgba(46, 204, 113, 0.8)' : 'rgba(231, 76, 60, 0.8)';
        g.fillRect(0, 0, 960, 720);
        g.fillStyle = '#fff';
        g.font = 'bold 64px sans-serif';
        g.textAlign = 'center';
        g.fillText(outcome === 'win' ? 'CAUGHT!' : 'MISSED!', 480, 360);
      },
    };
  },
});
