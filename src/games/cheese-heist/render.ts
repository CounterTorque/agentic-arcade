import { DISTANCE, type State } from './logic';

type Ctx = CanvasRenderingContext2D;

const INK = '#443329';
const METAL = '#758391';
const CHEESE = '#ffca42';

function ellipse(g: Ctx, x: number, y: number, rx: number, ry: number, color: string): void {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}

function drawCheese(g: Ctx, x: number, y: number): void {
  g.fillStyle = '#d9951b';
  g.fillRect(x + 6, y + 8, 64, 53);
  g.fillStyle = CHEESE;
  g.fillRect(x, y, 64, 53);
  g.fillStyle = '#fff0a1';
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x + 15, y - 12);
  g.lineTo(x + 79, y - 12);
  g.lineTo(x + 64, y);
  g.closePath();
  g.fill();
  ellipse(g, x + 20, y + 18, 7, 7, '#d9951b');
  ellipse(g, x + 48, y + 34, 9, 8, '#d9951b');
  ellipse(g, x + 12, y + 45, 4, 4, '#d9951b');
}

function drawMouse(g: Ctx, x: number, caught: boolean, moving: boolean, time: number, sad: boolean): void {
  g.save();
  g.translate(x, 504);
  if (caught) g.scale(1.25, 0.42);
  g.strokeStyle = '#d58e93';
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(-42, 8);
  g.bezierCurveTo(-100, 0, -90, -48, -120, -35);
  g.stroke();
  const leg = moving ? Math.sin(time * 0.025) * 8 : 0;
  ellipse(g, -20, 25 + leg, 18, 8, '#ce8d94');
  ellipse(g, 25, 25 - leg, 18, 8, '#ce8d94');
  ellipse(g, 0, 0, 58, 34, '#969aa5');
  ellipse(g, 30, -24, 26, 25, '#777d8b');
  ellipse(g, 30, -24, 15, 15, '#edb2b4');
  ellipse(g, 48, -3, 30, 23, '#aeb2bc');
  ellipse(g, 72, 0, 7, 6, '#d57b86');
  ellipse(g, 50, -10, 4, 5, INK);
  g.strokeStyle = INK;
  g.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    g.beginPath();
    g.moveTo(59, 4);
    g.lineTo(88, 4 + i * 8);
    g.stroke();
  }
  if (sad) {
    g.beginPath();
    g.arc(57, 15, 7, Math.PI, Math.PI * 2);
    g.stroke();
  }
  g.restore();
}

function star(g: Ctx, x: number, y: number, size: number): void {
  g.fillStyle = '#ffdf51';
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? size * 0.4 : size;
    g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
}

export function draw(g: Ctx, state: State, settleTime: number, reducedMotion: boolean): void {
  const motion = reducedMotion ? 0 : settleTime;
  g.fillStyle = '#f8e3c5';
  g.fillRect(0, 0, 960, 720);
  g.fillStyle = '#f1d2ac';
  for (let x = 40; x < 960; x += 120) {
    for (let y = 45; y < 430; y += 100) {
      ellipse(g, x, y, 5, 9, '#f1d2ac');
    }
  }
  g.fillStyle = '#a66b48';
  g.fillRect(0, 432, 960, 24);
  g.fillStyle = '#ba8056';
  g.fillRect(0, 456, 960, 264);
  g.strokeStyle = '#a96d47';
  g.lineWidth = 3;
  for (let y = 540; y < 720; y += 75) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(960, y);
    g.stroke();
  }

  g.fillStyle = '#9a684b';
  g.beginPath();
  g.arc(185, 448, 100, Math.PI, 0);
  g.lineTo(285, 520);
  g.lineTo(85, 520);
  g.closePath();
  g.fill();
  g.fillStyle = '#3f302d';
  g.beginPath();
  g.arc(185, 455, 78, Math.PI, 0);
  g.lineTo(263, 520);
  g.lineTo(107, 520);
  g.closePath();
  g.fill();

  ellipse(g, 602, 544, 240, 20, 'rgba(50, 30, 20, 0.22)');
  g.fillStyle = '#8d512c';
  g.fillRect(374, 510, 454, 42);
  g.fillStyle = '#d69a5e';
  g.fillRect(374, 490, 454, 45);
  g.strokeStyle = '#754522';
  g.lineWidth = 5;
  g.strokeRect(374, 490, 454, 45);
  ellipse(g, 399, 512, 6, 6, '#74513d');
  ellipse(g, 803, 512, 6, 6, '#74513d');
  g.fillStyle = '#b6bdc4';
  g.fillRect(630, 480, 118, 12);

  const jitter = state.trap === 'warning' && !reducedMotion ? Math.sin(state.trapTime * 0.08) * 5 : 0;
  g.save();
  g.translate(jitter, 0);
  g.strokeStyle = state.trap === 'warning' ? '#d34335' : METAL;
  g.lineWidth = 8;
  g.beginPath();
  g.moveTo(462, 487);
  for (let i = 0; i < 8; i++) g.lineTo(468 + i * 10, i % 2 ? 475 : 450);
  g.lineTo(550, 487);
  g.stroke();
  const swingTime = state.verdict === 'caught' ? (reducedMotion ? 80 : settleTime) : state.trapTime;
  const swing = state.trap === 'sprung' ? Math.min(1, swingTime / 80) : 0;
  g.strokeStyle = '#53616d';
  g.lineWidth = 12;
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(460, 488);
  g.lineTo(470 + swing * 90, 310 + swing * 165);
  g.lineTo(755 - swing * 15, 310 + swing * 165);
  g.lineTo(780, 488);
  g.stroke();
  g.restore();

  if (!state.cheese) drawCheese(g, 660, 425);
  const mouseX = 185 + (state.position / DISTANCE) * 470;
  const caught = state.verdict === 'caught';
  const moving = state.mouse !== 'home' && state.position > 0 && state.position < DISTANCE;
  drawMouse(g, mouseX, caught, moving && !reducedMotion, state.trapTime, state.verdict === 'timeout');
  if (state.cheese && !caught) drawCheese(g, mouseX + 25, 423);

  if (state.trap === 'warning') {
    g.fillStyle = '#c3352c';
    g.font = 'bold 52px system-ui, sans-serif';
    g.textAlign = 'center';
    g.fillText('!', 505, 405);
  }
  if (state.verdict) {
    const text = state.verdict === 'win' ? 'GOT IT!' : state.verdict === 'caught' ? 'SNAP!' : 'TOO SLOW';
    g.textAlign = 'center';
    g.font = 'bold 56px system-ui, sans-serif';
    g.fillStyle = state.verdict === 'win' ? '#26804b' : '#b3342c';
    g.fillText(text, 480, 90);
    if (state.verdict !== 'timeout') {
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5 + motion * 0.002;
        star(g, mouseX + Math.cos(angle) * 90, 430 + Math.sin(angle) * 45, 12);
      }
    }
  } else {
    g.textAlign = 'center';
    g.font = 'bold 27px system-ui, sans-serif';
    g.fillStyle = INK;
    g.fillText('SPACE / CLICK: DASH & BACK', 480, 665);
  }
}
