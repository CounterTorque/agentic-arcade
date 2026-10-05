import { defineGame } from '@arcade/sdk';

export default defineGame({
  contractVersion: 1,
  create(ctx) {
    ctx.root.appendChild(document.createElement('div'));
    return {
      tick() {
        throw new Error('boom');
      },
    };
  },
});
