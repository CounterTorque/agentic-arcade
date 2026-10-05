import { defineGame } from '@arcade/sdk';

export default defineGame({
  contractVersion: 1,
  create(ctx) {
    ctx.root.appendChild(document.createElement('div'));
    window.addEventListener('resize', () => {});
    setTimeout(() => {}, 10_000);
    return { tick() {} };
  },
});
