import type { PointerState } from '@arcade/sdk';
import { CALF_Y, LOOP_RADIUS, TRAVEL_MS, type State } from './logic';

function ellipse(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string) {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}

export function draw(g: CanvasRenderingContext2D, state: State, pointer: PointerState, settle: number, reducedMotion: boolean): void {
  g.fillStyle = '#f8d99a';
  g.fillRect(0, 0, 960, 720);
  g.fillStyle = '#f3b85f';
  g.fillRect(0, 250, 960, 470);
  g.fillStyle = '#e5a052';
  g.beginPath();
  g.moveTo(0, 300); g.quadraticCurveTo(240, 250, 480, 300); g.quadraticCurveTo(740, 240, 960, 290);
  g.lineTo(960, 340); g.lineTo(0, 340); g.fill();
  g.fillStyle = '#f6c779';
  g.fillRect(0, 342, 960, 378);
  g.strokeStyle = '#db9b50';
  g.lineWidth = 4;
  for (let x = 30; x < 960; x += 130) {
    g.beginPath(); g.moveTo(x, 390 + (x % 3) * 32); g.lineTo(x + 32, 390 + (x % 3) * 32); g.stroke();
  }
  g.fillStyle = '#8c502d';
  g.font = 'bold 25px sans-serif';
  g.textAlign = 'center';
  g.fillText('LEAD THE CALF!', 480, 72);
  g.font = '20px sans-serif';
  g.fillText('Click where it will be', 480, 104);

  const x = state.calfX;
  ellipse(g, x, CALF_Y + 58, 68, 14, '#d9a765');
  g.strokeStyle = '#693d2a'; g.lineWidth = 12; g.lineCap = 'round';
  for (const dx of [-35, -10, 23, 43]) {
    g.beginPath(); g.moveTo(x + dx, CALF_Y + 20); g.lineTo(x + dx - 4, CALF_Y + 48); g.stroke();
  }
  ellipse(g, x, CALF_Y, 56, 34, '#fff4dc');
  ellipse(g, x - 18, CALF_Y - 5, 17, 15, '#9b5c39');
  ellipse(g, x + 32, CALF_Y - 5, 12, 13, '#9b5c39');
  ellipse(g, x + 53, CALF_Y - 17, 26, 25, '#fff4dc');
  ellipse(g, x + 71, CALF_Y - 8, 17, 11, '#e8a69a');
  ellipse(g, x + 58, CALF_Y - 23, 3, 4, '#3b2920');
  ellipse(g, x + 40, CALF_Y - 41, 12, 7, '#9b5c39');
  ellipse(g, x + 68, CALF_Y - 40, 11, 7, '#9b5c39');

  const handX = 197, handY = 500;
  ellipse(g, 140, 672, 85, 16, '#d99e58');
  g.strokeStyle = '#543a32'; g.lineWidth = 24;
  g.beginPath(); g.moveTo(120, 610); g.lineTo(105, 654); g.moveTo(157, 610); g.lineTo(175, 654); g.stroke();
  ellipse(g, 137, 574, 48, 65, '#597f89');
  g.strokeStyle = '#597f89'; g.lineWidth = 22;
  g.beginPath(); g.moveTo(164, 548); g.lineTo(handX, handY); g.stroke();
  ellipse(g, handX, handY, 12, 12, '#f2bb81');
  ellipse(g, 137, 498, 32, 37, '#f2bb81');
  ellipse(g, 148, 497, 3, 4, '#3b2920');
  g.save();
  g.translate(137, 472);
  if (state.verdict === 'lose') g.rotate(-0.23);
  ellipse(g, 0, 0, 53, 10, '#67402b');
  g.fillStyle = '#855331'; g.fillRect(-30, -31, 60, 32);
  g.fillStyle = '#dca455'; g.fillRect(-30, -9, 60, 7);
  g.restore();

  g.strokeStyle = '#fff0b5'; g.lineWidth = 7;
  if (state.throw) {
    const progress = Math.min(1, state.throw.elapsed / TRAVEL_MS);
    const lx = handX + (state.throw.x - handX) * progress;
    const ly = handY + (state.throw.y - handY) * progress - Math.sin(progress * Math.PI) * 100;
    g.beginPath(); g.moveTo(handX, handY); g.quadraticCurveTo((handX + lx) / 2, handY + 35, lx, ly); g.stroke();
    g.beginPath(); g.ellipse(lx, ly, LOOP_RADIUS * (0.35 + progress * 0.65), 20 + progress * 22, 0, 0, Math.PI * 2); g.stroke();
  } else if (!state.verdict) {
    const angle = reducedMotion ? 0 : state.elapsed / 180;
    g.save(); g.translate(handX, handY - 65); g.rotate(Math.sin(angle) * 0.18);
    g.beginPath(); g.ellipse(0, 0, 66, 24, 0, 0, Math.PI * 2); g.stroke(); g.restore();
  }
  if (!state.throw && !state.verdict && pointer.inside) {
    g.strokeStyle = '#804d2d'; g.lineWidth = 3;
    g.beginPath(); g.arc(pointer.x, pointer.y, 16, 0, Math.PI * 2);
    g.moveTo(pointer.x - 24, pointer.y); g.lineTo(pointer.x + 24, pointer.y);
    g.moveTo(pointer.x, pointer.y - 24); g.lineTo(pointer.x, pointer.y + 24); g.stroke();
  }
  if (state.verdict) {
    g.fillStyle = state.verdict === 'win' ? '#376e53' : '#8c502d';
    g.font = 'bold 64px sans-serif';
    g.fillText(state.verdict === 'win' ? 'ROPED!' : 'MISSED!', 480, 195);
    if (state.verdict === 'win') {
      g.strokeStyle = '#fff0b5'; g.lineWidth = 7;
      g.beginPath(); g.ellipse(x, CALF_Y, Math.max(48, 65 - settle / 80), 35, 0, 0, Math.PI * 2); g.stroke();
    }
  }
}
