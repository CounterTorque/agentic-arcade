import { defineGame } from '@arcade/sdk';
import acrobatUrl from './assets/acrobat.svg';
import partnerUrl from './assets/partner.svg';
import trapezeBarUrl from './assets/trapeze-bar.svg';
import acrobatSuccessUrl from './assets/acrobat-success.svg';
import acrobatFailUrl from './assets/acrobat-fail.svg';
import { createState, step } from './logic';
import { createRenderer } from './render';

export default defineGame({
  contractVersion: 1,

  async preload({ loadImage }) {
    const [acrobat, partner, trapezeBar, acrobatSuccess, acrobatFail] = await Promise.all([
      loadImage(acrobatUrl),
      loadImage(partnerUrl),
      loadImage(trapezeBarUrl),
      loadImage(acrobatSuccessUrl),
      loadImage(acrobatFailUrl),
    ]);
    return { acrobat, partner, trapezeBar, acrobatSuccess, acrobatFail };
  },

  create(ctx, assets) {
    const state = createState(ctx.difficulty);
    const view = createRenderer(ctx, assets);
    view.draw(state);

    return {
      tick(frame) {
        if (frame.phase === 'play') {
          step(state, frame.dt, ctx.input.wasPressed('action'));
          
          // Check win/lose conditions
          if (state.caught) {
            ctx.resolve('win');
          } else if (state.missed) {
            ctx.resolve('lose');
          }
        }
        view.draw(state);
      },
      
      end(outcome) {
        view.setPose(outcome === 'win' ? 'success' : 'fail');
      },
      
      destroy() {
        view.dispose();
      },
    };
  },
});
