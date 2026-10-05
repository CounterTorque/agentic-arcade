import { defineGame } from '@arcade/sdk';

let runs = 0;

export default defineGame({
  contractVersion: 1,
  create(ctx) {
    const el = document.createElement('div');
    ctx.root.appendChild(el);
    const outcome = runs++ % 2 ? 'win' : 'lose';
    return {
      tick() {
        el.textContent = String(Math.random());
        ctx.resolve(outcome);
      },
    };
  },
});
