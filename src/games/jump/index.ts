import { defineGame } from '@arcade/sdk';
import playerUrl from './assets/player.svg';
import { createState, step } from './logic';
import { createRenderer } from './render';

export default defineGame({
  contractVersion: 1,

  async preload({ loadImage }) {
    return { player: await loadImage(playerUrl) };
  },

  create(ctx, assets) {
    const state = createState(ctx.difficulty, ctx.timeLimitMs, ctx.rng);
    const view = createRenderer(ctx, assets);
    view.draw(state, 0);

    return {
      tick(frame) {
        if (frame.phase === 'play') {
          step(state, frame.dt, ctx.input.wasPressed('action'));
          if (state.status === 'hit') ctx.resolve('lose');
        }
        view.draw(state, frame.dt);
      },
      end(outcome) {
        view.setPose(outcome === 'win' ? 'cheer' : 'shocked');
      },
      destroy() {
        view.dispose();
      },
    };
  },
});
