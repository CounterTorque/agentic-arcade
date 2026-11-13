import type { PointerState } from '@arcade/sdk';
import type { State } from './logic';

type Ctx = CanvasRenderingContext2D;

function ellipse(g: Ctx, x: number, y: number, rx: number, ry: number, color: string): void {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}

function fly(g: Ctx, x: number, y: number, time: number, squashed: boolean): void {
  g.save();
  g.translate(x, y);
  if (squashed) g.scale(1.25, 0.45);
  const flap = 0.7 + 0.3 * Math.abs(Math.sin(time / 70));
  ellipse(g, -16, -21, 25, 15 * flap, '#d1edf2');
  ellipse(g, 16, -21, 25, 15 * flap, '#d1edf2');
  g.strokeStyle = '#40373b';
  g.lineWidth = 4;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(side * 12, i * 8 - 3);
      g.lineTo(side * 35, i * 10 + 4);
      g.stroke();
    }
  }
  ellipse(g, 0, 0, 24, 27, '#343b3d');
  ellipse(g, 0, -21, 21, 15, '#4d5956');
  ellipse(g, -10, -23, 8, 9, '#d95647');
  ellipse(g, 10, -23, 8, 9, '#d95647');
  g.restore();
}

function swatter(g: Ctx, x: number, y: number, swinging: boolean): void {
  g.save();
  g.translate(x, y);
  g.rotate(swinging ? -0.35 : 0);
  g.lineCap = 'round';
  g.strokeStyle = '#8b493d';
  g.lineWidth = 15;
  g.beginPath();
  g.moveTo(28, 27);
  g.lineTo(125, 140);
  g.stroke();
  g.strokeStyle = '#e87560';
  g.lineWidth = 7;
  g.strokeRect(-43, -43, 86, 86);
  g.strokeStyle = 'rgba(232, 117, 96, 0.65)';
  g.lineWidth = 3;
  for (let i = -25; i <= 25; i += 25) {
    g.beginPath();
    g.moveTo(i, -40);
    g.lineTo(i, 40);
    g.moveTo(-40, i);
    g.lineTo(40, i);
    g.stroke();
  }
  g.restore();
}

export function draw(g: Ctx, state: State, pointer: PointerState, time: number, swing: number, reducedMotion: boolean): void {
  g.fillStyle = '#f8e9d9';
  g.fillRect(0, 0, 960, 720);
  g.fillStyle = '#f2d9c5';
  for (let x = 0; x < 960; x += 120) g.fillRect(x, 0, 5, 500);
  g.fillStyle = '#b97656';
  g.fillRect(0, 590, 960, 130);
  g.fillStyle = '#e5ad7d';
  g.fillRect(0, 580, 960, 18);
  ellipse(g, 480, 604, 280, 44, '#e2e9df');
  ellipse(g, 480, 594, 250, 36, '#fffaf0');
  g.fillStyle = '#c77d53';
  g.fillRect(280, 480, 400, 108);
  ellipse(g, 480, 588, 200, 30, '#a85d40');
  ellipse(g, 480, 480, 200, 49, '#fff3e9');
  g.fillStyle = '#fff3e9';
  g.fillRect(280, 480, 400, 26);
  for (let x = 300; x <= 660; x += 40) ellipse(g, x, 504, 20, 17, '#fff3e9');
  for (let x = 350; x <= 610; x += 65) {
    ellipse(g, x, 475, 9, 9, '#e76b72');
    ellipse(g, x - 3, 472, 3, 3, '#ffd4c9');
  }

  const motion = reducedMotion ? 0 : time;
  if (state.verdict === 'timeout') fly(g, 480, 449, 0, false);
  else fly(g, state.x, state.y, motion, state.verdict === 'win');
  if (state.verdict === 'win') swatter(g, state.x, state.y, true);
  else if (!state.verdict && pointer.inside) swatter(g, pointer.x, pointer.y, swing > 0);

  g.textAlign = 'center';
  g.font = 'bold 27px system-ui, sans-serif';
  g.fillStyle = '#684439';
  if (!state.verdict) g.fillText('CLICK THE FLY!', 480, 680);
  else {
    g.font = 'bold 58px system-ui, sans-serif';
    g.fillStyle = state.verdict === 'win' ? '#27815e' : '#b24035';
    g.fillText(state.verdict === 'win' ? 'SWATTED!' : 'YUCK!', 480, 90);
  }
}
