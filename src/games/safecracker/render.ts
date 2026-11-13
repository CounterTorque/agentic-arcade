import { notchAngle, type LevelParams, type State } from './logic';

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

function circle(g: Ctx, x: number, y: number, r: number, color: string): void {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fill();
}

function panel(g: Ctx, x: number, y: number, w: number, h: number, color: string, border: string, radius = 12): void {
  g.fillStyle = color;
  g.strokeStyle = border;
  g.lineWidth = 5;
  g.beginPath();
  g.roundRect(x, y, w, h, radius);
  g.fill();
  g.stroke();
}

function backdrop(g: Ctx): void {
  g.fillStyle = '#253a42';
  g.fillRect(0, 0, 960, 720);
  g.fillStyle = '#304a50';
  for (let row = 0; row < 6; row++) {
    for (let x = -120 + row % 2 * 100; x < 960; x += 200) {
      g.fillRect(x + 3, row * 100 + 3, 194, 94);
    }
  }
  g.fillStyle = 'rgba(230, 215, 161, 0.08)';
  g.beginPath();
  g.moveTo(480, 0);
  g.lineTo(110, 615);
  g.lineTo(850, 615);
  g.fill();
  g.fillStyle = '#172e34';
  g.fillRect(0, 612, 960, 108);
  g.fillStyle = '#43575a';
  g.fillRect(0, 612, 960, 10);
  g.fillStyle = 'rgba(0, 0, 0, 0.28)';
  g.beginPath();
  g.ellipse(480, 634, 350, 35, 0, 0, TAU);
  g.fill();
}

function lamp(g: Ctx, x: number, y: number, color: string): void {
  circle(g, x, y, 19, '#1c3438');
  circle(g, x, y, 14, color);
  circle(g, x - 4, y - 5, 4, 'rgba(255, 255, 255, 0.55)');
}

function dial(g: Ctx, angle: number, params: LevelParams): void {
  const x = 480;
  const y = 389;
  circle(g, x + 5, y + 8, 151, '#24393b');
  circle(g, x, y, 151, '#b6c9c2');
  circle(g, x, y, 139, '#526e6c');
  circle(g, x, y, 129, '#d7e2d8');
  circle(g, x, y, 113, '#334f50');
  circle(g, x, y, 83, '#446664');
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = 'bold 14px system-ui, sans-serif';
  for (let i = 0; i < 40; i++) {
    const a = i * TAU / 40 - Math.PI / 2;
    const major = i % 5 === 0;
    g.strokeStyle = '#273f40';
    g.lineWidth = major ? 3 : 2;
    g.beginPath();
    g.moveTo(x + Math.cos(a) * 117, y + Math.sin(a) * 117);
    g.lineTo(x + Math.cos(a) * (major ? 130 : 124), y + Math.sin(a) * (major ? 130 : 124));
    g.stroke();
    if (major) {
      g.fillStyle = '#e1e9dc';
      g.fillText(String(i), x + Math.cos(a) * 98, y + Math.sin(a) * 98);
    }
  }
  const half = params.windowMs / 2000 * params.revolutionsPerSecond * TAU;
  g.strokeStyle = '#f4cb61';
  g.lineWidth = 7;
  g.beginPath();
  g.arc(x, y, 157, -Math.PI / 2 - half, -Math.PI / 2 + half);
  g.stroke();
  const a = notchAngle(angle) * TAU - Math.PI / 2;
  g.save();
  g.translate(x, y);
  g.rotate(a + Math.PI / 2);
  g.fillStyle = '#e95947';
  g.beginPath();
  g.moveTo(-10, -141);
  g.lineTo(10, -141);
  g.lineTo(0, -119);
  g.fill();
  g.restore();
  circle(g, x, y, 45, '#c0d0c5');
  circle(g, x, y, 37, '#718e88');
  circle(g, x - 8, y - 9, 8, '#a8bfb5');
  g.fillStyle = '#f4cb61';
  g.beginPath();
  g.moveTo(x - 13, y - 180);
  g.lineTo(x + 13, y - 180);
  g.lineTo(x, y - 162);
  g.fill();
  g.textBaseline = 'alphabetic';
}

function door(g: Ctx, state: State, params: LevelParams, angle: number, settleMs: number, reducedMotion: boolean): void {
  panel(g, 224, 102, 512, 508, '#688780', '#192f32', 18);
  panel(g, 245, 122, 470, 465, '#3d615e', '#8ba8a0', 10);
  for (const x of [260, 700]) for (const y of [138, 571]) {
    circle(g, x, y, 6, '#bed0c2');
    circle(g, x + 1, y + 1, 2, '#4b6965');
  }
  panel(g, 435, 144, 175, 48, '#213f40', '#78978d', 8);
  for (let i = 0; i < 3; i++) {
    const lit = i < state.locked;
    const pulse = lit && i === state.locked - 1 && state.pulseMs > 0 && !reducedMotion;
    lamp(g, 465 + i * 57, 168, pulse ? '#c9ff99' : lit ? '#62d68b' : '#526861');
  }
  const warning = state.result === 'miss' && (reducedMotion || Math.floor(settleMs / 120) % 2 === 0);
  lamp(g, 670, 168, warning ? '#ff5b4d' : '#734943');
  dial(g, angle, params);
  panel(g, 652, 309, 35, 150, '#b5c8bb', '#294746', 12);
  panel(g, 661, 325, 17, 115, '#dce5d6', '#6e8b80', 7);
}

function treasure(g: Ctx): void {
  panel(g, 245, 122, 470, 465, '#162e31', '#8ba8a0', 10);
  for (let row = 0; row < 3; row++) for (let i = 0; i < 3 - row; i++) {
    const x = 344 + i * 91 + row * 45;
    const y = 478 - row * 45;
    g.fillStyle = '#e5a92c';
    g.beginPath();
    g.moveTo(x + 12, y);
    g.lineTo(x + 75, y);
    g.lineTo(x + 88, y + 38);
    g.lineTo(x, y + 38);
    g.fill();
    g.fillStyle = '#ffe38a';
    g.fillRect(x + 14, y + 4, 58, 5);
  }
  g.fillStyle = '#fce7a4';
  g.font = 'bold 32px system-ui, sans-serif';
  g.textAlign = 'center';
  g.fillText('✦   ✧   ✦', 480, 300);
}

export function draw(g: Ctx, state: State, params: LevelParams, down: boolean, settleMs: number, reducedMotion: boolean): void {
  backdrop(g);
  panel(g, 202, 82, 556, 542, '#263f40', '#142b30', 25);
  panel(g, 180, 183, 65, 82, '#a9bdb0', '#20393a');
  panel(g, 180, 461, 65, 82, '#a9bdb0', '#20393a');

  if (state.result === 'win') {
    treasure(g);
    const open = reducedMotion ? 1 : Math.min(1, settleMs / 500);
    g.save();
    g.translate(224, 0);
    g.transform(1 - open * 0.78, 0.05 * open, 0, 1, 0, 0);
    g.translate(-224, 0);
    door(g, state, params, state.angle, settleMs, reducedMotion);
    g.restore();
  } else {
    const jolt = state.result === 'miss' ? (reducedMotion ? 1 : Math.min(1, settleMs / 300)) : 0;
    const angle = state.angle + (Math.round(state.angle) - state.angle) * jolt;
    door(g, state, params, angle, settleMs, reducedMotion);
  }

  panel(g, 766, 527, 139, 79, '#243c3e', '#92a69b');
  circle(g, 835, 563, 30, '#183031');
  circle(g, 835, down ? 565 : 558, 24, down ? '#a9463d' : '#e76a53');
  g.textAlign = 'center';
  g.fillStyle = '#fff4d9';
  g.font = 'bold 15px system-ui, sans-serif';
  g.fillText('LOCK', 835, down ? 570 : 563);

  if (state.result) {
    const label = state.result === 'win' ? 'CRACKED!' : state.result === 'miss' ? 'JAMMED!' : 'TOO SLOW!';
    g.font = 'bold 52px system-ui, sans-serif';
    g.lineWidth = 8;
    g.strokeStyle = '#1b3034';
    g.strokeText(label, 480, 76);
    g.fillStyle = state.result === 'win' ? '#f9d675' : '#ff8972';
    g.fillText(label, 480, 76);
  }
}
