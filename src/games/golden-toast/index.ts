import { defineGame } from '@arcade/sdk';

export default defineGame({
  contractVersion: 1,

  create(ctx) {
    const target = document.createElement('div');
    target.textContent = 'PRESS!';
    target.style.cssText =
      'position:absolute;left:330px;top:300px;width:300px;height:120px;display:flex;align-items:center;justify-content:center;' +
      'font:bold 48px system-ui,sans-serif;color:#fff;background:#3b82f6;border-radius:16px;';
    ctx.root.style.background = '#111827';
    ctx.root.appendChild(target);

    return {
      tick(frame) {
        if (frame.phase === 'play' && ctx.input.wasPressed('action')) ctx.resolve('win');
      },
      end(outcome) {
        target.textContent = outcome === 'win' ? 'NICE!' : 'TOO SLOW';
        target.style.background = outcome === 'win' ? '#16a34a' : '#dc2626';
      },
    };
  },
});
