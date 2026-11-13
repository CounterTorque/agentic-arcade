import { defineGame } from '@arcade/sdk';
import { CUT_X, createPosts, judge, levelParams, type Verdict } from './logic';

const WALL = '#fde7c4';
const WINDOW_GLASS = '#bfdbfe';
const FRAME = '#92400e';
const DOOR = '#7c3a12';
const GOLD = '#f5b50a';
const GOLD_DARK = '#b45309';
const PAVEMENT = '#cbbba0';
const CARPET = '#b91c1c';
const CARPET_EDGE = '#7f1d1d';
const RAIL = '#a16207';
const CURTAIN = '#9f1239';
const CURTAIN_FOLD = '#be123c';
const SIGN = '#5b3416';
const RIBBON = '#fff7ed';
const RIBBON_EDGE = '#d4a017';
const MARK = '#dc2626';
const BLADE = '#e5e7eb';
const BLADE_EDGE = '#6b7280';
const HANDLE = '#dc2626';
const INK = '#1f2937';
const WIN_TEXT = '#16a34a';
const MISS_TEXT = '#dc2626';
const LATE_TEXT = '#92400e';
const BUNTING = ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#a855f7'];
const CONFETTI = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#fde047'];
const SKIN = ['#fcd5b0', '#e0a96d', '#c68642', '#8d5524'];
const SHIRT = ['#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#db2777', '#ca8a04', '#475569'];
const HAIR = ['#3f2a1d', '#1f1a17', '#a16207', '#6b7280'];

const POST_HALF_SPAN = 150;
const POST_TOP = 452;
const RAIL_Y = 584;
const RIBBON_Y = 470;
const SAG = 14;
const DROOP_PX = 26;
const FALL_PX = 110;
const FALL_MS = 400;
const PIVOT_Y = 340;
const HANDLE_LEN = 100;
const RING_R = 22;
const BLADE_LEN = RIBBON_Y + SAG - PIVOT_Y;
const OPEN_ANGLE = 0.3;
const SNAP_MS = 90;
const CROWD_Y = 672;

type Ctx2D = CanvasRenderingContext2D;
type Mood = 'wait' | 'cheer' | 'sad';

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

  for (const x of [210, 650]) {
    roundRect(g, x, 230, 100, 150, 10);
    g.fillStyle = WINDOW_GLASS;
    g.fill();
    g.strokeStyle = FRAME;
    g.lineWidth = 8;
    g.stroke();
    g.fillStyle = FRAME;
    g.fillRect(x + 46, 230, 8, 150);
    g.fillRect(x, 300, 100, 8);
  }

  g.beginPath();
  g.moveTo(400, 520);
  g.lineTo(400, 330);
  g.arc(CUT_X, 330, 80, Math.PI, 0);
  g.lineTo(560, 520);
  g.closePath();
  g.fillStyle = DOOR;
  g.fill();
  g.strokeStyle = GOLD_DARK;
  g.lineWidth = 8;
  g.stroke();
  g.fillStyle = GOLD_DARK;
  g.fillRect(CUT_X - 2, 250, 4, 270);
  g.fillStyle = GOLD;
  for (const dx of [-14, 14]) {
    g.beginPath();
    g.arc(CUT_X + dx, 430, 6, 0, Math.PI * 2);
    g.fill();
  }

  g.fillStyle = PAVEMENT;
  g.fillRect(0, 520, 960, 200);
  g.beginPath();
  g.moveTo(380, 520);
  g.lineTo(580, 520);
  g.lineTo(790, 720);
  g.lineTo(170, 720);
  g.closePath();
  g.fillStyle = CARPET;
  g.fill();
  g.strokeStyle = CARPET_EDGE;
  g.lineWidth = 6;
  g.stroke();

  g.fillStyle = RAIL;
  g.fillRect(100, RAIL_Y, 760, 8);
  g.fillStyle = 'rgba(0, 0, 0, 0.18)';
  g.fillRect(0, 520, 960, 10);
}

function drawCurtains(g: Ctx2D): void {
  for (const side of [0, 1]) {
    const edge = side === 0 ? 0 : 960;
    const dir = side === 0 ? 1 : -1;
    g.fillStyle = CURTAIN;
    g.beginPath();
    g.moveTo(edge, 0);
    g.lineTo(edge + dir * 120, 0);
    g.quadraticCurveTo(edge + dir * 60, 280, edge + dir * 96, 520);
    g.lineTo(edge, 520);
    g.closePath();
    g.fill();
    g.strokeStyle = CURTAIN_FOLD;
    g.lineWidth = 8;
    for (const f of [24, 56]) {
      g.beginPath();
      g.moveTo(edge + dir * f, 0);
      g.quadraticCurveTo(edge + dir * (f - 14), 280, edge + dir * (f + 8), 520);
      g.stroke();
    }
    g.fillStyle = GOLD;
    g.beginPath();
    g.arc(edge + dir * 70, 300, 10, 0, Math.PI * 2);
    g.fill();
    g.fillRect(edge + dir * 70 - 4, 308, 8, 36);
  }
}

function drawBunting(g: Ctx2D): void {
  const flags = 16;
  for (let i = 0; i < flags; i++) {
    const t = (i + 0.5) / flags;
    const x = 960 * t;
    const y = 2 * (1 - t) * t * 100 + (1 - t) * (1 - t) * 16 + t * t * 16;
    g.fillStyle = BUNTING[i % BUNTING.length]!;
    g.beginPath();
    g.moveTo(x - 17, y);
    g.lineTo(x + 17, y);
    g.lineTo(x, y + 34);
    g.closePath();
    g.fill();
  }
  g.strokeStyle = INK;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, 16);
  g.quadraticCurveTo(480, 100, 960, 16);
  g.stroke();
}

function drawSign(g: Ctx2D): void {
  roundRect(g, 270, 96, 420, 56, 12);
  g.fillStyle = SIGN;
  g.fill();
  g.strokeStyle = GOLD;
  g.lineWidth = 6;
  g.stroke();
  g.fillStyle = GOLD;
  g.font = 'bold 36px system-ui, sans-serif';
  g.textAlign = 'center';
  g.fillText('GRAND OPENING', CUT_X, 136);
}

function drawPost(g: Ctx2D, x: number): void {
  g.fillStyle = 'rgba(0, 0, 0, 0.2)';
  g.beginPath();
  g.ellipse(x, RAIL_Y + 4, 38, 8, 0, 0, Math.PI * 2);
  g.fill();

  roundRect(g, x - 28, RAIL_Y - 16, 56, 18, 6);
  g.fillStyle = SIGN;
  g.fill();

  g.fillStyle = GOLD_DARK;
  g.fillRect(x - 10, POST_TOP, 20, RAIL_Y - POST_TOP - 10);
  g.fillStyle = GOLD;
  g.fillRect(x - 10, POST_TOP, 7, RAIL_Y - POST_TOP - 10);

  g.fillStyle = GOLD;
  g.beginPath();
  g.arc(x, POST_TOP - 6, 17, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = 'rgba(255, 255, 255, 0.55)';
  g.beginPath();
  g.arc(x - 6, POST_TOP - 12, 5, 0, Math.PI * 2);
  g.fill();

  g.fillStyle = MARK;
  g.beginPath();
  g.arc(x, RIBBON_Y, 13, 0, Math.PI * 2);
  g.fill();
}

function strokeRibbon(g: Ctx2D): void {
  g.lineCap = 'butt';
  g.strokeStyle = RIBBON_EDGE;
  g.lineWidth = 36;
  g.stroke();
  g.strokeStyle = RIBBON;
  g.lineWidth = 28;
  g.stroke();
}

function drawMark(g: Ctx2D, x: number, y: number, w: number): void {
  g.fillStyle = MARK;
  g.fillRect(x, y - 28, w, 56);
}

function drawRibbon(g: Ctx2D, left: number, right: number, markWidth: number, sag: number): void {
  const centre = (left + right) / 2;
  g.beginPath();
  g.moveTo(left, RIBBON_Y);
  g.quadraticCurveTo(centre, RIBBON_Y + 2 * sag, right, RIBBON_Y);
  strokeRibbon(g);
  drawMark(g, centre - markWidth / 2, RIBBON_Y + sag, markWidth);
}

function drawCutRibbon(g: Ctx2D, left: number, right: number, markWidth: number, fall: number): void {
  const u = (CUT_X - left) / (right - left);
  const cutY = RIBBON_Y + 4 * SAG * u * (1 - u);
  const gap = 4 + fall * 0.08;
  const half = markWidth / 2;

  g.beginPath();
  g.moveTo(left, RIBBON_Y);
  g.quadraticCurveTo((left + CUT_X) / 2, RIBBON_Y + 2 * SAG * u + fall * 0.5, CUT_X - gap, cutY + fall);
  strokeRibbon(g);
  drawMark(g, CUT_X - gap - half, cutY + fall, half);

  g.beginPath();
  g.moveTo(right, RIBBON_Y);
  g.quadraticCurveTo((CUT_X + right) / 2, RIBBON_Y + 2 * SAG * (1 - u) + fall * 0.5, CUT_X + gap, cutY + fall);
  strokeRibbon(g);
  drawMark(g, CUT_X + gap, cutY + fall, half);
}

function drawScissors(g: Ctx2D, angle: number, bob: number): void {
  g.save();
  g.translate(CUT_X, PIVOT_Y + bob);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const s of [-1, 1]) {
    g.save();
    g.rotate(s * angle);
    g.scale(s, 1);

    g.strokeStyle = HANDLE;
    g.lineWidth = 12;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(14, -HANDLE_LEN + RING_R);
    g.stroke();
    g.lineWidth = 10;
    g.beginPath();
    g.arc(14, -HANDLE_LEN, RING_R, 0, Math.PI * 2);
    g.stroke();

    g.beginPath();
    g.moveTo(-2, -8);
    g.lineTo(20, 4);
    g.lineTo(2, BLADE_LEN);
    g.closePath();
    g.fillStyle = BLADE;
    g.fill();
    g.strokeStyle = BLADE_EDGE;
    g.lineWidth = 4;
    g.stroke();
    g.strokeStyle = '#fff';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(10, 12);
    g.lineTo(4, BLADE_LEN - 16);
    g.stroke();

    g.restore();
  }
  g.fillStyle = BLADE_EDGE;
  g.beginPath();
  g.arc(0, 0, 10, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

function drawCrowd(g: Ctx2D, mood: Mood, lookX: number, t: number): void {
  for (let i = 0; i < 8; i++) {
    const x = 60 + i * 120;
    const y = CROWD_Y + (mood === 'cheer' ? -Math.abs(Math.sin(t * 0.012 + i * 1.3)) * 18 : 0) + (mood === 'sad' ? 14 : 0);
    const skin = SKIN[i % SKIN.length]!;

    if (mood === 'cheer') {
      g.strokeStyle = skin;
      g.lineWidth = 12;
      g.lineCap = 'round';
      for (const s of [-1, 1]) {
        g.beginPath();
        g.moveTo(x + s * 38, y + 56);
        g.lineTo(x + s * 58, y - 6);
        g.stroke();
      }
    }

    roundRect(g, x - 46, y + 30, 92, 90, 30);
    g.fillStyle = SHIRT[i % SHIRT.length]!;
    g.fill();

    g.fillStyle = skin;
    g.beginPath();
    g.arc(x, y, 36, 0, Math.PI * 2);
    g.fill();
    if (i % 3 !== 0) {
      g.fillStyle = HAIR[i % HAIR.length]!;
      g.beginPath();
      g.arc(x, y - 4, 37, Math.PI, 0);
      g.fill();
    }

    g.strokeStyle = INK;
    g.lineWidth = 4;
    g.lineCap = 'round';
    for (const dx of [-14, 14]) {
      if (mood === 'cheer') {
        g.beginPath();
        g.arc(x + dx, y - 4, 7, Math.PI, 0);
        g.stroke();
      } else {
        g.fillStyle = '#fff';
        g.beginPath();
        g.arc(x + dx, y - 6, 8, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = INK;
        g.beginPath();
        const look = mood === 'wait' ? Math.max(-1, Math.min(1, (lookX - x) / 240)) * 3 : 0;
        g.arc(x + dx + look, y - 6 + (mood === 'sad' ? 3 : 0), 4, 0, Math.PI * 2);
        g.fill();
      }
    }
    if (mood === 'sad') {
      for (const s of [-1, 1]) {
        g.beginPath();
        g.moveTo(x + s * 24, y - 22);
        g.lineTo(x + s * 6, y - 16);
        g.stroke();
      }
    }

    g.beginPath();
    if (mood === 'cheer') {
      g.fillStyle = INK;
      g.arc(x, y + 8, 12, 0, Math.PI);
      g.fill();
    } else if (mood === 'sad') {
      g.arc(x, y + 22, 12, Math.PI * 1.15, Math.PI * 1.85);
      g.stroke();
    } else {
      g.arc(x, y + 6, 10, Math.PI * 0.2, Math.PI * 0.8);
      g.stroke();
    }
  }
}

function drawConfetti(g: Ctx2D, t: number): void {
  for (let i = 0; i < 36; i++) {
    const x = CUT_X + Math.sin(i * 12.9898) * 400 + Math.sin(t * 0.004 + i) * 14;
    const y = 120 + ((t * 0.22 + i * 53) % 480);
    g.save();
    g.translate(x, y);
    g.rotate(t * 0.01 + i);
    g.fillStyle = CONFETTI[i % CONFETTI.length]!;
    g.fillRect(-6, -3, 12, 6);
    g.restore();
  }
}

function drawLabel(g: Ctx2D, text: string, color: string): void {
  g.textAlign = 'center';
  g.font = 'bold 52px system-ui, sans-serif';
  g.lineJoin = 'round';
  g.lineWidth = 10;
  g.strokeStyle = '#fff';
  g.strokeText(text, CUT_X, 206);
  g.fillStyle = color;
  g.fillText(text, CUT_X, 206);
}

export default defineGame({
  contractVersion: 1,

  create(ctx) {
    const { g } = ctx.createCanvas();
    const { level, speed } = ctx.difficulty;
    const { markWidth } = levelParams(level);
    const posts = createPosts(level, speed, ctx.rng);

    // 'late' is the round running out with no snip made.
    let verdict: Verdict | 'late' | null = null;
    // Time since the verdict, ms, which drives the snap and the settle effects.
    let sinceVerdict = 0;

    function draw(elapsed: number): void {
      const motion = ctx.reducedMotion ? 0 : sinceVerdict;
      const centre = posts.centre();
      const left = centre - POST_HALF_SPAN;
      const right = centre + POST_HALF_SPAN;
      const snipped = verdict === 'cut' || verdict === 'miss';
      const settle = (ms: number): number => (ctx.reducedMotion ? 1 : Math.min(1, sinceVerdict / ms));

      drawBackdrop(g);
      drawCurtains(g);
      drawBunting(g);
      drawSign(g);
      drawPost(g, left);
      drawPost(g, right);

      if (verdict === 'cut') drawCutRibbon(g, left, right, markWidth, (1 - (1 - settle(FALL_MS)) ** 3) * FALL_PX);
      else drawRibbon(g, left, right, markWidth, SAG + (verdict === 'miss' || verdict === 'late' ? settle(FALL_MS) * DROOP_PX : 0));

      const angle = snipped ? OPEN_ANGLE * (1 - settle(SNAP_MS)) : OPEN_ANGLE;
      const bob = verdict === null && !ctx.reducedMotion ? 5 * Math.sin(elapsed * 0.005) : 0;
      drawScissors(g, angle, bob);

      const mood: Mood = verdict === 'cut' ? 'cheer' : verdict === null ? 'wait' : 'sad';
      drawCrowd(g, mood, centre, motion);
      if (verdict === 'cut') drawConfetti(g, motion);

      if (verdict === 'cut') drawLabel(g, 'GRAND!', WIN_TEXT);
      else if (verdict === 'miss') drawLabel(g, 'MISSED!', MISS_TEXT);
      else if (verdict === 'late') drawLabel(g, 'TOO SLOW!', LATE_TEXT);
    }

    draw(0);

    return {
      tick(frame) {
        if (verdict !== null) sinceVerdict += frame.dt;
        if (frame.phase === 'play' && verdict === null) {
          posts.step(frame.dt);
          if (ctx.input.wasPressed('action')) verdict = judge(posts.centre(), markWidth);
          else if (frame.remaining === 0) verdict = 'late';
          if (verdict !== null) ctx.resolve(verdict === 'cut' ? 'win' : 'lose');
        }
        draw(frame.elapsed);
      },
    };
  },
});
