import { defineGame } from '@arcade/sdk';
import { GOLD_CENTRE, browningProgress, judge, levelParams, stripColor, type Verdict } from './logic';

const WALL = '#f5e1c8';
const COUNTER = '#8b5e3c';
const COUNTER_EDGE = '#a46f47';
const CHROME = '#cbd5e1';
const CHROME_LIGHT = '#e2e8f0';
const CHROME_DARK = '#64748b';
const SLOT = '#1f2937';
const CRUST = '#7c4a1e';
const BUTTON = '#dc2626';
const BUTTON_DOWN = '#b91c1c';
const GOLD_ZONE = '#16a34a';
const SPARKLE = '#fde047';
const SMOKE = '#475569';
const PALE_TEXT = '#92400e';
const BURNT_TEXT = '#dc2626';

const TOASTER_X = 200;
const TOASTER_Y = 300;
const TOASTER_W = 360;
const TOASTER_H = 220;
const SLICE_W = 100;
const SLICE_H = 120;
const SLICE_X = 330;
const SLICE_REST_Y = 214;
const POP_UP_PX = 104;
const POP_MS = 300;
const STRIP_X = 680;
const STRIP_Y = 180;
const STRIP_W = 40;
const STRIP_H = 360;
const BUTTON_X = 380;
const BUTTON_Y = 610;

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

function drawBackdrop(g: Ctx2D): void {
  g.fillStyle = WALL;
  g.fillRect(0, 0, 960, 520);
  g.fillStyle = COUNTER;
  g.fillRect(0, 520, 960, 200);
  g.fillStyle = COUNTER_EDGE;
  g.fillRect(0, 520, 960, 12);
}

function drawToaster(g: Ctx2D): void {
  g.fillStyle = 'rgba(0, 0, 0, 0.2)';
  g.beginPath();
  g.ellipse(TOASTER_X + TOASTER_W / 2, 534, 190, 14, 0, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = CHROME_DARK;
  g.fillRect(TOASTER_X + 30, 516, 50, 14);
  g.fillRect(TOASTER_X + TOASTER_W - 80, 516, 50, 14);

  roundRect(g, TOASTER_X, TOASTER_Y, TOASTER_W, TOASTER_H, 36);
  g.fillStyle = CHROME;
  g.fill();
  g.strokeStyle = CHROME_DARK;
  g.lineWidth = 6;
  g.stroke();

  roundRect(g, TOASTER_X + 16, TOASTER_Y + 30, 40, 160, 12);
  g.fillStyle = CHROME_LIGHT;
  g.fill();

  g.fillStyle = SLOT;
  roundRect(g, 320, TOASTER_Y + 6, 120, 14, 6);
  g.fill();

  g.fillStyle = CHROME_DARK;
  g.beginPath();
  g.arc(TOASTER_X + TOASTER_W - 60, TOASTER_Y + 170, 16, 0, Math.PI * 2);
  g.fill();
}

function drawSlice(g: Ctx2D, y: number, color: string): void {
  const x = SLICE_X;
  g.beginPath();
  g.moveTo(x, y + SLICE_H);
  g.lineTo(x, y + SLICE_H * 0.35);
  g.quadraticCurveTo(x, y, x + SLICE_W / 2, y);
  g.quadraticCurveTo(x + SLICE_W, y, x + SLICE_W, y + SLICE_H * 0.35);
  g.lineTo(x + SLICE_W, y + SLICE_H);
  g.closePath();
  g.fillStyle = color;
  g.fill();
  g.strokeStyle = CRUST;
  g.lineWidth = 8;
  g.lineJoin = 'round';
  g.stroke();

  g.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (const [dx, dy] of [
    [30, 40],
    [66, 56],
    [42, 84],
    [70, 96],
  ] as const) {
    g.beginPath();
    g.arc(x + dx, y + dy, 4, 0, Math.PI * 2);
    g.fill();
  }
}

function drawStrip(g: Ctx2D, progress: number, goldWidth: number): void {
  const bands = 90;
  for (let i = 0; i < bands; i++) {
    g.fillStyle = stripColor((i + 0.5) / bands);
    g.fillRect(STRIP_X, STRIP_Y + (i * STRIP_H) / bands, STRIP_W, STRIP_H / bands + 1);
  }
  g.strokeStyle = SLOT;
  g.lineWidth = 4;
  g.strokeRect(STRIP_X, STRIP_Y, STRIP_W, STRIP_H);

  const zoneY = STRIP_Y + (GOLD_CENTRE - goldWidth / 2) * STRIP_H;
  g.strokeStyle = GOLD_ZONE;
  g.lineWidth = 4;
  g.setLineDash([8, 6]);
  g.strokeRect(STRIP_X - 8, zoneY, STRIP_W + 16, goldWidth * STRIP_H);
  g.setLineDash([]);
  g.fillStyle = GOLD_ZONE;
  g.font = 'bold 24px system-ui, sans-serif';
  g.textAlign = 'left';
  g.fillText('GOLD', STRIP_X + STRIP_W + 18, STRIP_Y + GOLD_CENTRE * STRIP_H + 8);

  const markerY = STRIP_Y + progress * STRIP_H;
  g.fillStyle = SLOT;
  g.beginPath();
  g.moveTo(STRIP_X - 34, markerY - 14);
  g.lineTo(STRIP_X - 6, markerY);
  g.lineTo(STRIP_X - 34, markerY + 14);
  g.closePath();
  g.fill();
  g.fillRect(STRIP_X - 6, markerY - 2, STRIP_W + 12, 4);
}

function drawButton(g: Ctx2D, down: boolean): void {
  g.fillStyle = '#374151';
  g.beginPath();
  g.arc(BUTTON_X, BUTTON_Y, 54, 0, Math.PI * 2);
  g.fill();
  const dy = down ? 4 : 0;
  g.fillStyle = down ? BUTTON_DOWN : BUTTON;
  g.beginPath();
  g.arc(BUTTON_X, BUTTON_Y + dy - 4, 44, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  g.font = 'bold 28px system-ui, sans-serif';
  g.textAlign = 'center';
  g.fillText('POP', BUTTON_X, BUTTON_Y + dy + 6);
}

function drawSparkles(g: Ctx2D, t: number): void {
  const cx = SLICE_X + SLICE_W / 2;
  const cy = SLICE_REST_Y - POP_UP_PX + SLICE_H / 2;
  g.fillStyle = SPARKLE;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + t * 0.002;
    const radius = 90 + 12 * Math.sin(t * 0.01 + i);
    const size = 9 + 4 * Math.sin(t * 0.012 + i * 2);
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    g.beginPath();
    g.moveTo(x, y - size);
    g.lineTo(x + size * 0.4, y);
    g.lineTo(x, y + size);
    g.lineTo(x - size * 0.4, y);
    g.closePath();
    g.fill();
  }
}

function drawSmoke(g: Ctx2D, originY: number, t: number): void {
  const cx = SLICE_X + SLICE_W / 2;
  g.fillStyle = SMOKE;
  for (let i = 0; i < 5; i++) {
    const phase = (t * 0.08 + i * 24) % 120;
    g.globalAlpha = 0.85 * (1 - phase / 120);
    g.beginPath();
    g.arc(cx + (i - 2) * 16 + Math.sin(i + phase * 0.05) * 10, originY - phase, 18 + phase * 0.2, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
}

function drawLabel(g: Ctx2D, text: string, color: string): void {
  g.textAlign = 'center';
  g.font = 'bold 56px system-ui, sans-serif';
  g.fillStyle = color;
  g.fillText(text, 480, 64);
}

export default defineGame({
  contractVersion: 1,

  create(ctx) {
    const { g } = ctx.createCanvas();
    const { browningMs, goldWidth } = levelParams(ctx.difficulty.level);
    const speed = ctx.difficulty.speed;

    let verdict: Verdict | null = null;
    // Whether the player popped the toast; a toast that burnt on its own stays in the slot.
    let popped = false;
    // Browning at the moment of the verdict; the toast stops changing colour then.
    let frozen: number | null = null;
    // Time since the verdict, ms, which drives the pop and the settle effects.
    let sinceVerdict = 0;

    function draw(elapsed: number): void {
      const progress = frozen ?? browningProgress(elapsed, browningMs, speed);
      const motion = ctx.reducedMotion ? 0 : sinceVerdict;
      const rise = popped ? (ctx.reducedMotion ? 1 : 1 - (1 - Math.min(1, sinceVerdict / POP_MS)) ** 3) : 0;
      const sliceY = SLICE_REST_Y - rise * POP_UP_PX;

      drawBackdrop(g);
      drawToaster(g);
      drawSlice(g, sliceY, stripColor(progress));
      drawStrip(g, progress, goldWidth);
      drawButton(g, ctx.input.isDown('action'));

      if (verdict === 'gold') drawSparkles(g, motion);
      if (verdict === 'burnt') drawSmoke(g, sliceY, motion);
      if (verdict === 'gold') drawLabel(g, 'PERFECT!', GOLD_ZONE);
      else if (verdict === 'pale') drawLabel(g, 'TOO PALE', PALE_TEXT);
      else if (verdict === 'burnt') drawLabel(g, 'BURNT!', BURNT_TEXT);
    }

    draw(0);

    return {
      tick(frame) {
        if (verdict !== null) sinceVerdict += frame.dt;
        if (frame.phase === 'play' && verdict === null) {
          const progress = browningProgress(frame.elapsed, browningMs, speed);
          if (ctx.input.wasPressed('action')) {
            popped = true;
            verdict = judge(progress, goldWidth);
          } else if (progress >= 1) {
            verdict = 'burnt';
          }
          if (verdict !== null) {
            frozen = progress;
            ctx.resolve(verdict === 'gold' ? 'win' : 'lose');
          }
        }
        draw(frame.elapsed);
      },
    };
  },
});
