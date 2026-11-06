import { defineGame } from '@arcade/sdk';
import {
  CENTER_Y,
  HEAD_TOP,
  NEEDLE_WIDTH,
  NEEDLE_X,
  POINT_BOTTOM,
  THREAD_START_X,
  THREAD_WIDTH,
  judge,
  levelParams,
  needleY,
  threadTipX,
  travelTimeMs,
  type Verdict,
} from './logic';

const THREAD = '#245eb1';
const METAL_HIT = '#b33e3e';
const METAL_WIN = '#287e61';

export default defineGame({
  contractVersion: 1,

  create(ctx) {
    const { g } = ctx.createCanvas();
    const params = levelParams(ctx.difficulty.level);
    const speed = ctx.difficulty.speed;
    let shotAt: number | null = null;
    let verdict: Verdict | null = null;
    let judgedY = CENTER_Y;
    let settleMs = 0;

    function draw(elapsed: number): void {
      const ny = verdict === null ? needleY(elapsed, speed) : judgedY;
      const progress = Math.min(1, settleMs / 800);
      g.fillStyle = '#f4e7d1';
      g.fillRect(0, 0, 960, 720);
      g.strokeStyle = '#eadbc4';
      g.lineWidth = 1;
      for (let y = 12; y < 720; y += 24) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(960, y);
        g.stroke();
      }
      for (let x = 12; x < 960; x += 24) {
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, 720);
        g.stroke();
      }

      g.fillStyle = '#80573e';
      g.fillRect(38, CENTER_Y - 58, 120, 116);
      g.fillStyle = '#2f6cb7';
      g.fillRect(52, CENTER_Y - 51, 92, 102);
      g.strokeStyle = '#4a81c7';
      g.lineWidth = 2;
      for (let x = 58; x < 144; x += 9) {
        g.beginPath();
        g.moveTo(x, CENTER_Y - 49);
        g.lineTo(x, CENTER_Y + 49);
        g.stroke();
      }
      g.fillStyle = '#a77853';
      g.fillRect(38, CENTER_Y - 62, 14, 124);
      g.fillRect(144, CENTER_Y - 62, 14, 124);

      g.fillStyle = verdict === 'hit' ? '#b85c5c' : verdict === 'through' ? '#81b9a2' : '#8493a1';
      g.beginPath();
      g.moveTo(NEEDLE_X - NEEDLE_WIDTH / 2, ny + HEAD_TOP + 17);
      g.quadraticCurveTo(NEEDLE_X - NEEDLE_WIDTH / 2, ny + HEAD_TOP, NEEDLE_X, ny + HEAD_TOP);
      g.quadraticCurveTo(NEEDLE_X + NEEDLE_WIDTH / 2, ny + HEAD_TOP, NEEDLE_X + NEEDLE_WIDTH / 2, ny + HEAD_TOP + 17);
      g.lineTo(NEEDLE_X + NEEDLE_WIDTH / 2, ny + 70);
      g.lineTo(NEEDLE_X, ny + POINT_BOTTOM);
      g.lineTo(NEEDLE_X - NEEDLE_WIDTH / 2, ny + 70);
      g.closePath();
      g.fill();
      g.fillStyle = '#dce5e8';
      g.beginPath();
      g.moveTo(NEEDLE_X - 10, ny + HEAD_TOP + 18);
      g.quadraticCurveTo(NEEDLE_X - 10, ny + HEAD_TOP + 6, NEEDLE_X - 4, ny + HEAD_TOP + 5);
      g.lineTo(NEEDLE_X - 4, ny + 80);
      g.lineTo(NEEDLE_X, ny + POINT_BOTTOM - 8);
      g.lineTo(NEEDLE_X - 10, ny + 70);
      g.closePath();
      g.fill();
      g.fillStyle = '#596b77';
      g.beginPath();
      g.ellipse(NEEDLE_X, ny, 10, params.eyeHeight / 2 + 3, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#283743';
      g.beginPath();
      g.ellipse(NEEDLE_X, ny, 7, params.eyeHeight / 2, 0, 0, Math.PI * 2);
      g.fill();

      let tipX = shotAt === null ? THREAD_START_X : threadTipX(elapsed - shotAt, speed);
      if (verdict === 'through') tipX = NEEDLE_X + 17 + 100 * progress;
      if (verdict === 'miss') tipX = NEEDLE_X - NEEDLE_WIDTH / 2 + 140 * progress;
      g.strokeStyle = THREAD;
      g.lineWidth = THREAD_WIDTH;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(158, CENTER_Y);
      if (verdict === 'through') {
        g.lineTo(NEEDLE_X, CENTER_Y);
        g.quadraticCurveTo(tipX, CENTER_Y, tipX, CENTER_Y + 85 * progress * progress);
      } else {
        g.lineTo(tipX, CENTER_Y);
      }
      g.stroke();
      if (verdict === 'hit') {
        g.beginPath();
        g.moveTo(tipX, CENTER_Y);
        g.bezierCurveTo(tipX - 20, CENTER_Y - 7, tipX - 5, CENTER_Y - 24, tipX - 27, CENTER_Y - 23);
        g.stroke();
      } else if (shotAt === null) {
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(tipX - 4, CENTER_Y);
        g.lineTo(tipX + 6, CENTER_Y - 5);
        g.moveTo(tipX - 4, CENTER_Y);
        g.lineTo(tipX + 6, CENTER_Y + 5);
        g.stroke();
      }
      g.lineCap = 'butt';
    }

    function drawLabel(text: string, color: string): void {
      g.textAlign = 'center';
      g.font = 'bold 48px system-ui, sans-serif';
      g.fillStyle = color;
      g.fillText(text, 480, 660);
    }

    draw(0);

    return {
      tick(frame) {
        if (frame.phase === 'play' && verdict === null) {
          if (shotAt === null && ctx.input.wasPressed('action')) shotAt = frame.elapsed;
          if (shotAt !== null) {
            const arrived = frame.elapsed - shotAt >= travelTimeMs(speed);
            if (arrived || frame.remaining === 0) {
              const judgedAt = arrived ? shotAt + travelTimeMs(speed) : frame.elapsed;
              judgedY = needleY(judgedAt, speed);
              verdict = judge(CENTER_Y, judgedY, params.eyeHeight);
              ctx.resolve(verdict === 'through' ? 'win' : 'lose');
            }
          }
        }
        if (frame.phase === 'settle') settleMs += frame.dt;

        draw(frame.elapsed);
        if (verdict === 'through') drawLabel('THREADED!', METAL_WIN);
        else if (verdict === 'hit') drawLabel('FRAYED!', METAL_HIT);
        else if (verdict === 'miss') drawLabel('MISSED!', METAL_HIT);
        else if (ctx.resolved === 'lose') drawLabel('TOO SLOW', METAL_HIT);
      },
    };
  },
});
