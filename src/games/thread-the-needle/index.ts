import { defineGame } from '@arcade/sdk';
import {
  CENTER_X,
  EYE_Y,
  THREAD_START_Y,
  THREAD_WIDTH,
  fallTimeMs,
  judge,
  levelParams,
  needleX,
  threadY,
  type Verdict,
} from './logic';

const FABRIC = '#f5e6d3';
const METAL = '#9ca3af';
const METAL_HIT = '#dc2626';
const METAL_WIN = '#16a34a';
const THREAD = '#2563eb';
const HOLE = '#1f2937';

export default defineGame({
  contractVersion: 1,

  create(ctx) {
    const { g } = ctx.createCanvas();
    const params = levelParams(ctx.difficulty.level);
    const speed = ctx.difficulty.speed;

    // Play time at which the action was pressed; the thread falls from then on.
    let dropAt: number | null = null;
    // Set once the thread has been judged against the eye.
    let verdict: Verdict | null = null;

    function draw(elapsed: number): void {
      const nx = needleX(elapsed, params.periodS, speed);
      g.fillStyle = FABRIC;
      g.fillRect(0, 0, 960, 720);

      // Needle body and eye, flashing red on a hit and green on a threaded needle.
      g.fillStyle = verdict === 'hit' ? METAL_HIT : verdict === 'through' ? METAL_WIN : METAL;
      g.fillRect(nx - 9, EYE_Y - 8, 18, 300);
      g.beginPath();
      g.moveTo(nx - 9, EYE_Y + 292);
      g.lineTo(nx, EYE_Y + 320);
      g.lineTo(nx + 9, EYE_Y + 292);
      g.closePath();
      g.fill();
      g.fillStyle = HOLE;
      g.beginPath();
      g.ellipse(nx, EYE_Y, params.eyeWidth / 2, 7, 0, 0, Math.PI * 2);
      g.fill();

      // Thread.
      g.strokeStyle = THREAD;
      g.lineWidth = THREAD_WIDTH;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(CENTER_X, 0);
      if (dropAt === null) {
        g.lineTo(CENTER_X, THREAD_START_Y);
        g.stroke();
      } else if (verdict === 'through') {
        // Runs straight through the eye and hangs below the needle.
        g.lineTo(CENTER_X, 700);
        g.stroke();
      } else if (verdict === 'hit') {
        // Tip frays into a curl against the metal.
        const tipY = EYE_Y - 10;
        g.lineTo(CENTER_X, tipY);
        g.stroke();
        g.beginPath();
        g.moveTo(CENTER_X, tipY);
        for (let i = 1; i <= 8; i++) {
          const dir = i % 2 === 0 ? 1 : -1;
          g.lineTo(CENTER_X + dir * (10 + i * 2), tipY - i * 4);
        }
        g.stroke();
      } else {
        g.lineTo(CENTER_X, threadY(elapsed - dropAt, speed));
        g.stroke();
      }
      g.lineCap = 'butt';
    }

    function drawLabel(text: string, color: string): void {
      g.textAlign = 'center';
      g.font = 'bold 56px system-ui, sans-serif';
      g.fillStyle = color;
      g.fillText(text, 480, 620);
    }

    draw(0);

    return {
      tick(frame) {
        if (frame.phase === 'play' && verdict === null) {
          if (dropAt === null && ctx.input.wasPressed('action')) {
            dropAt = frame.elapsed;
          }
          if (dropAt !== null) {
            const dropMs = frame.elapsed - dropAt;
            const arrived = dropMs >= fallTimeMs(speed);
            // On the final tick, a thread still in the air is judged where it is.
            if (arrived || frame.remaining === 0) {
              const judgedAt = arrived ? dropAt + fallTimeMs(speed) : frame.elapsed;
              verdict = judge(CENTER_X, needleX(judgedAt, params.periodS, speed), params.eyeWidth);
              ctx.resolve(verdict === 'through' ? 'win' : 'lose');
            }
          }
        }

        draw(frame.elapsed);
        if (verdict === 'through') drawLabel('THREADED!', METAL_WIN);
        else if (verdict === 'hit') drawLabel('FRAYED!', METAL_HIT);
        else if (dropAt === null && ctx.resolved === 'lose') drawLabel('TOO SLOW', METAL_HIT);
      },
    };
  },
});
