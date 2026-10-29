import { defineGame } from '@arcade/sdk';
import { bobberDepth, buildSchedule, gameTime, isMissed, judge, type Schedule, type Verdict } from './logic';

const WATERLINE = 420;
const BOBBER_X = 560;
const SKY = '#c7eaf5';
const TREES = '#397c69';
const WATER = '#16788a';
const DEEP_WATER = '#155e75';
const REED = '#437d48';
const RIPPLE = '#b6e9e4';
const LINE = '#f8fafc';

type Ctx2D = CanvasRenderingContext2D;

function ellipse(g: Ctx2D, x: number, y: number, rx: number, ry: number, color: string): void {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}

function drawBackdrop(g: Ctx2D): void {
  g.fillStyle = SKY;
  g.fillRect(0, 0, 960, 320);
  g.fillStyle = '#e4f6fa';
  g.fillRect(0, 235, 960, 85);
  for (let x = -30; x < 1030; x += 95) ellipse(g, x, 300, 85, 65, TREES);
  g.fillStyle = WATER;
  g.fillRect(0, 320, 960, 400);
  g.fillStyle = DEEP_WATER;
  g.fillRect(0, 590, 960, 130);
  g.fillStyle = 'rgba(191, 242, 235, 0.15)';
  g.fillRect(0, 390, 960, 12);
}

function drawShore(g: Ctx2D): void {
  for (const x of [35, 60, 85, 890, 915, 940]) {
    const height = 85 + (x % 3) * 22;
    g.strokeStyle = REED;
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(x, 670);
    g.lineTo(x + 8, 670 - height);
    g.stroke();
    ellipse(g, x + 8, 670 - height, 8, 21, '#754a31');
  }
  for (const [x, y] of [[250, 565], [785, 525]] as const) {
    ellipse(g, x, y, 58, 18, '#66a957');
    g.fillStyle = WATER;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 48, y - 14);
    g.lineTo(x + 55, y - 3);
    g.closePath();
    g.fill();
  }
  for (let i = 0; i < 5; i++) {
    const angle = i * Math.PI * 2 / 5;
    ellipse(g, 250 + Math.cos(angle) * 12, 555 + Math.sin(angle) * 7, 10, 6, '#f9a8d4');
  }
  ellipse(g, 250, 555, 5, 4, '#fde047');
}

function drawRod(g: Ctx2D, lineY: number): void {
  g.strokeStyle = '#70442d';
  g.lineWidth = 12;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(40, 700);
  g.quadraticCurveTo(155, 430, 300, 180);
  g.stroke();
  g.strokeStyle = '#c7904c';
  g.lineWidth = 18;
  g.beginPath();
  g.moveTo(40, 700);
  g.lineTo(80, 610);
  g.stroke();
  ellipse(g, 104, 618, 25, 25, '#475569');
  ellipse(g, 104, 618, 13, 13, '#cbd5e1');
  g.strokeStyle = LINE;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(300, 180);
  g.quadraticCurveTo(420, 220, BOBBER_X, lineY);
  g.stroke();
}

function drawBobber(g: Ctx2D, depth: number): void {
  const y = WATERLINE - 24 + depth * 70;
  g.save();
  g.beginPath();
  g.rect(0, 0, 960, WATERLINE);
  g.clip();
  drawFloat(g, y);
  g.restore();
  g.save();
  g.beginPath();
  g.rect(0, WATERLINE, 960, 720 - WATERLINE);
  g.clip();
  g.globalAlpha = 0.35;
  drawFloat(g, y);
  g.restore();
}

function drawFloat(g: Ctx2D, y: number): void {
  g.strokeStyle = '#334155';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(BOBBER_X, y - 26);
  g.lineTo(BOBBER_X, y - 48);
  g.stroke();
  ellipse(g, BOBBER_X, y, 30, 34, '#f8fafc');
  g.fillStyle = '#dc2626';
  g.beginPath();
  g.arc(BOBBER_X, y, 30, Math.PI, 0);
  g.fill();
  ellipse(g, BOBBER_X - 10, y - 15, 5, 9, '#fecaca');
}

function drawRipples(g: Ctx2D, t: number, schedule: Schedule): void {
  const starts = [...schedule.twitches.map((twitch) => twitch.startMs), schedule.biteStartMs];
  for (const start of starts) {
    const age = t - start;
    if (age < 0 || age > 500) continue;
    const u = age / 500;
    g.strokeStyle = RIPPLE;
    g.globalAlpha = 1 - u;
    g.lineWidth = 4;
    g.beginPath();
    g.ellipse(BOBBER_X, WATERLINE + 3, 35 + u * 75, 8 + u * 16, 0, 0, Math.PI * 2);
    g.stroke();
    if (start === schedule.biteStartMs) {
      for (const dx of [-42, -25, 25, 42]) ellipse(g, BOBBER_X + dx, WATERLINE - 30 - u * 35, 5, 9, RIPPLE);
    }
    g.globalAlpha = 1;
  }
}

function drawFish(g: Ctx2D, x: number, y: number): void {
  g.fillStyle = '#f59e0b';
  g.beginPath();
  g.moveTo(x - 43, y);
  g.lineTo(x - 78, y - 28);
  g.lineTo(x - 78, y + 28);
  g.closePath();
  g.fill();
  ellipse(g, x, y, 52, 32, '#f59e0b');
  ellipse(g, x + 27, y - 8, 6, 6, '#1f2937');
  g.fillStyle = '#d97706';
  g.beginPath();
  g.moveTo(x - 10, y - 10);
  g.lineTo(x + 8, y + 8);
  g.lineTo(x - 18, y + 18);
  g.closePath();
  g.fill();
}

function drawResult(g: Ctx2D, verdict: Verdict, motion: number): void {
  const y = 330 - Math.min(1, motion / 300) * 90;
  if (verdict === 'hooked') {
    drawFish(g, BOBBER_X, y);
    g.fillStyle = '#fde047';
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      const x = BOBBER_X + Math.cos(angle) * 105;
      const sy = y + Math.sin(angle) * 65;
      g.beginPath();
      g.moveTo(x, sy - 11);
      g.lineTo(x + 5, sy);
      g.lineTo(x, sy + 11);
      g.lineTo(x - 5, sy);
      g.closePath();
      g.fill();
    }
  } else {
    g.strokeStyle = '#e2e8f0';
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(BOBBER_X, y - 25);
    g.lineTo(BOBBER_X, y + 15);
    g.arc(BOBBER_X - 12, y + 15, 12, 0, Math.PI);
    g.stroke();
    ellipse(g, 720, 550, 45, 20, '#12596a');
  }
  g.textAlign = 'center';
  g.font = 'bold 56px system-ui, sans-serif';
  g.fillStyle = verdict === 'hooked' ? '#15803d' : verdict === 'early' ? '#92400e' : '#b91c1c';
  g.fillText(verdict === 'hooked' ? 'GOT ONE!' : verdict === 'early' ? 'TOO EARLY!' : 'IT GOT AWAY', 480, 64);
}

export default defineGame({
  contractVersion: 1,

  create(ctx) {
    const { g } = ctx.createCanvas();
    const schedule = buildSchedule(ctx.rng, ctx.difficulty.level);
    let verdict: Verdict | null = null;
    let frozen = 0;
    let sinceVerdict = 0;

    function draw(t: number): void {
      const depth = bobberDepth(t, schedule);
      const motion = ctx.reducedMotion ? 300 : sinceVerdict * ctx.difficulty.speed;
      drawBackdrop(g);
      drawShore(g);
      drawRod(g, verdict ? 330 - Math.min(1, motion / 300) * 90 - 25 : WATERLINE - 72 + depth * 70);
      if (verdict) drawResult(g, verdict, motion);
      else {
        drawBobber(g, depth);
        if (!ctx.reducedMotion) drawRipples(g, t, schedule);
      }
    }

    draw(0);
    return {
      tick(frame) {
        if (verdict !== null) sinceVerdict += frame.dt;
        if (frame.phase === 'play' && verdict === null) {
          const t = gameTime(frame.elapsed, ctx.difficulty.speed);
          if (ctx.input.wasPressed('action')) verdict = judge(t, schedule);
          else if (isMissed(t, schedule)) verdict = 'missed';
          if (verdict !== null) {
            frozen = t;
            ctx.resolve(verdict === 'hooked' ? 'win' : 'lose');
          }
        }
        draw(verdict === null ? gameTime(frame.elapsed, ctx.difficulty.speed) : frozen);
      },
      end(outcome) {
        if (verdict === null) verdict = outcome === 'win' ? 'hooked' : 'missed';
      },
    };
  },
});
