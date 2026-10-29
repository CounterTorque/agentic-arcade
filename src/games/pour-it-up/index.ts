import { defineGame } from '@arcade/sdk';
import { createState, FILL_LINE, judge, levelParams, step } from './logic';

const WALL = '#f5e1c8';
const COUNTER = '#8b5e3c';
const CHROME = '#cbd5e1';
const CHROME_DARK = '#64748b';
const INK = '#334155';
const DRINK = '#e9a229';
const FOAM = '#fff2cc';
const GREEN = '#16834a';
const RED = '#b91c1c';
const GLASS_TOP = 282;
const GLASS_BOTTOM = 540;
const GLASS_HEIGHT = GLASS_BOTTOM - GLASS_TOP;
const GLASS_X = 480;

type Ctx2D = CanvasRenderingContext2D;

function roundRect(g: Ctx2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function glassPath(g: Ctx2D, width: number): void {
  g.beginPath();
  g.moveTo(GLASS_X - width / 2, GLASS_TOP);
  g.lineTo(GLASS_X - width * 0.38, GLASS_BOTTOM - 10);
  g.quadraticCurveTo(GLASS_X - width * 0.37, GLASS_BOTTOM, GLASS_X - width * 0.3, GLASS_BOTTOM);
  g.lineTo(GLASS_X + width * 0.3, GLASS_BOTTOM);
  g.quadraticCurveTo(GLASS_X + width * 0.37, GLASS_BOTTOM, GLASS_X + width * 0.38, GLASS_BOTTOM - 10);
  g.lineTo(GLASS_X + width / 2, GLASS_TOP);
  g.closePath();
}

export default defineGame({
  contractVersion: 1,
  create(ctx) {
    const { g } = ctx.createCanvas();
    const params = levelParams(ctx.difficulty.level);
    const state = createState();
    let holding = false;
    let settleMs = 0;

    function draw(): void {
      const { width, band } = params;
      const level = Math.min(1, state.level);
      const liquidY = GLASS_BOTTOM - level * GLASS_HEIGHT;
      const motion = ctx.reducedMotion ? 0 : settleMs;

      g.fillStyle = WALL;
      g.fillRect(0, 0, 960, 548);
      g.fillStyle = '#edd1ad';
      for (let x = 0; x < 960; x += 120) g.fillRect(x, 0, 2, 548);
      g.fillRect(0, 180, 960, 2);
      g.fillRect(0, 360, 960, 2);
      g.fillStyle = COUNTER;
      g.fillRect(0, 548, 960, 172);
      g.fillStyle = '#a46f47';
      g.fillRect(0, 548, 960, 12);

      g.fillStyle = '#bda07e';
      roundRect(g, 340, 55, 280, 142, 22);
      g.fill();
      g.fillStyle = CHROME_DARK;
      roundRect(g, 360, 76, 240, 100, 16);
      g.fill();
      g.fillStyle = CHROME;
      roundRect(g, 382, 93, 120, 55, 14);
      g.fill();
      roundRect(g, 455, 120, 50, 106, 12);
      g.fill();
      g.fillStyle = '#e2e8f0';
      g.fillRect(466, 132, 10, 84);
      g.fillStyle = INK;
      roundRect(g, 451, 215, 58, 16, 5);
      g.fill();
      g.strokeStyle = CHROME_DARK;
      g.lineWidth = 12;
      g.beginPath();
      g.moveTo(424, 98);
      g.lineTo(holding && state.verdict === null ? 405 : 424, 48);
      g.stroke();
      g.fillStyle = '#b91c1c';
      g.beginPath();
      g.arc(holding && state.verdict === null ? 405 : 424, 44, 16, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = '#6b432e';
      g.beginPath();
      g.ellipse(GLASS_X, 548, width * 0.62, 17, 0, 0, Math.PI * 2);
      g.fill();
      if (state.verdict === 'spill') {
        g.fillStyle = '#d9921d';
        g.beginPath();
        g.ellipse(GLASS_X + 50, 553, width * 0.65, 14, 0, 0, Math.PI * 2);
        g.fill();
        g.fillRect(GLASS_X + width * 0.43, GLASS_TOP, 10, GLASS_HEIGHT);
      }

      glassPath(g, width);
      g.fillStyle = 'rgba(235, 249, 255, 0.65)';
      g.fill();
      g.save();
      glassPath(g, width);
      g.clip();
      if (level > 0) {
        g.fillStyle = DRINK;
        g.fillRect(GLASS_X - width / 2, liquidY, width, GLASS_BOTTOM - liquidY);
        g.fillStyle = FOAM;
        g.fillRect(GLASS_X - width / 2, liquidY, width, Math.min(10, GLASS_BOTTOM - liquidY));
        g.fillStyle = 'rgba(255, 245, 204, 0.65)';
        for (const [dx, dy, radius] of [[-28, 35, 5], [23, 55, 4], [-12, 95, 3], [30, 125, 5]] as const) {
          if (liquidY + dy < GLASS_BOTTOM - 8) {
            g.beginPath();
            g.arc(GLASS_X + dx, liquidY + dy, radius, 0, Math.PI * 2);
            g.fill();
          }
        }
      }
      g.restore();
      glassPath(g, width);
      g.strokeStyle = CHROME_DARK;
      g.lineWidth = 6;
      g.stroke();
      g.strokeStyle = '#fff';
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(GLASS_X - width * 0.37, GLASS_TOP + 22);
      g.lineTo(GLASS_X - width * 0.3, GLASS_BOTTOM - 35);
      g.stroke();

      if (holding && state.verdict === null) {
        const wobble = ctx.reducedMotion ? 0 : Math.sin(state.pourMs * 0.02) * 4;
        g.strokeStyle = DRINK;
        g.lineWidth = 16;
        g.beginPath();
        g.moveTo(GLASS_X, 229);
        g.quadraticCurveTo(GLASS_X + wobble, 260, GLASS_X, Math.max(GLASS_TOP, liquidY));
        g.stroke();
      }

      const lineY = GLASS_BOTTOM - FILL_LINE * GLASS_HEIGHT;
      g.fillStyle = 'rgba(22, 131, 74, 0.18)';
      g.fillRect(GLASS_X - width / 2 - 16, lineY - band * GLASS_HEIGHT, width + 32, 2 * band * GLASS_HEIGHT);
      g.strokeStyle = GREEN;
      g.lineWidth = 4;
      g.setLineDash([10, 7]);
      g.beginPath();
      g.moveTo(GLASS_X - width / 2 - 16, lineY);
      g.lineTo(GLASS_X + width / 2 + 16, lineY);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = GREEN;
      g.font = 'bold 24px system-ui, sans-serif';
      g.textAlign = 'left';
      g.fillText('FILL', GLASS_X + width / 2 + 24, lineY + 8);

      g.fillStyle = INK;
      g.beginPath();
      g.arc(480, 636, 54, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = holding && state.verdict === null ? '#991b1b' : '#dc2626';
      g.beginPath();
      g.arc(480, holding && state.verdict === null ? 636 : 632, 44, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#fff';
      g.font = 'bold 25px system-ui, sans-serif';
      g.textAlign = 'center';
      g.fillText('HOLD', 480, holding && state.verdict === null ? 644 : 640);

      if (state.verdict !== null) {
        const labels = { perfect: 'PERFECT!', under: 'TOO LOW', over: 'TOO MUCH', spill: 'SPILLED!' };
        g.fillStyle = state.verdict === 'perfect' ? GREEN : RED;
        g.font = 'bold 52px system-ui, sans-serif';
        g.fillText(labels[state.verdict], 480, 45);
        if (state.verdict === 'perfect') {
          g.fillStyle = '#facc15';
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3 + motion * 0.001;
            const x = GLASS_X + Math.cos(angle) * (width / 2 + 55);
            const y = 405 + Math.sin(angle) * 125;
            g.beginPath();
            g.moveTo(x, y - 12);
            g.lineTo(x + 5, y);
            g.lineTo(x, y + 12);
            g.lineTo(x - 5, y);
            g.closePath();
            g.fill();
          }
        }
      }
    }

    draw();
    return {
      tick(frame) {
        if (frame.phase === 'play' && state.verdict === null) {
          holding = ctx.input.isDown('action') || ctx.input.wasPressed('action');
          step(state, frame.dt, holding, params, ctx.difficulty.speed);
          if (state.verdict === null && state.started && (ctx.input.wasReleased('action') || frame.remaining === 0)) {
            state.verdict = judge(state.level, params.band);
          }
          if (state.verdict !== null) ctx.resolve(state.verdict === 'perfect' ? 'win' : 'lose');
        } else if (frame.phase === 'settle') {
          settleMs += frame.dt;
        }
        draw();
      },
      end(outcome) {
        if (state.verdict === null) state.verdict = outcome === 'win' ? 'perfect' : 'under';
        holding = false;
        draw();
      },
    };
  },
});
