import type { PointerState } from '@arcade/sdk';
import { reticle, TARGET, type State } from './logic';

type Ctx = CanvasRenderingContext2D;

function circle(g: Ctx, x: number, y: number, radius: number, color: string): void {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.fill();
}

function archer(g: Ctx): void {
  circle(g, 130, 392, 29, '#e4a974');
  g.strokeStyle = '#344a50';
  g.lineWidth = 22;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(130, 426);
  g.lineTo(130, 512);
  g.lineTo(95, 575);
  g.moveTo(130, 512);
  g.lineTo(165, 575);
  g.moveTo(130, 450);
  g.lineTo(196, 418);
  g.stroke();
  g.strokeStyle = '#794d36';
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(195, 347);
  g.quadraticCurveTo(255, 418, 195, 489);
  g.stroke();
  g.strokeStyle = '#f7e8c7';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(195, 347);
  g.lineTo(175, 418);
  g.lineTo(195, 489);
  g.stroke();
}

function arrow(g: Ctx, x: number, y: number): void {
  g.strokeStyle = '#533c32';
  g.lineWidth = 5;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x - 70, y + 15);
  g.lineTo(x, y);
  g.stroke();
  g.fillStyle = '#f5eee0';
  g.beginPath();
  g.moveTo(x - 62, y + 13);
  g.lineTo(x - 78, y + 2);
  g.lineTo(x - 73, y + 22);
  g.fill();
}

export function draw(g: Ctx, state: State, pointer: PointerState, time: number, settle: number, reducedMotion: boolean): void {
  g.fillStyle = '#b9e1e4';
  g.fillRect(0, 0, 960, 720);
  g.fillStyle = '#90bd90';
  g.fillRect(0, 540, 960, 180);
  g.fillStyle = '#6d9a70';
  g.fillRect(0, 590, 960, 130);

  g.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  g.lineWidth = 3;
  g.lineCap = 'round';
  const direction = Math.atan2(state.gustY, state.gustX);
  const motion = reducedMotion ? 0 : time * (0.04 + state.level * 0.025);
  for (let i = 0; i < 4 + state.level * 2; i++) {
    const x = (i * 157 + motion) % 1060 - 50;
    const y = 115 + (i * 83) % 350;
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + Math.cos(direction) * 50, y + Math.sin(direction) * 50);
    g.stroke();
  }

  g.strokeStyle = '#815b40';
  g.lineWidth = 16;
  g.beginPath();
  g.moveTo(TARGET.x, TARGET.y + 100);
  g.lineTo(TARGET.x - 70, 590);
  g.moveTo(TARGET.x, TARGET.y + 100);
  g.lineTo(TARGET.x + 70, 590);
  g.stroke();
  circle(g, TARGET.x, TARGET.y, TARGET.radius + 5, '#684a37');
  circle(g, TARGET.x, TARGET.y, TARGET.radius, '#f6eedb');
  circle(g, TARGET.x, TARGET.y, 96, '#69a3c4');
  circle(g, TARGET.x, TARGET.y, 72, '#d35c52');
  circle(g, TARGET.x, TARGET.y, 48, '#f6eedb');
  circle(g, TARGET.x, TARGET.y, TARGET.centerRadius, '#f5c64d');
  archer(g);

  if (state.landing) {
    const progress = reducedMotion ? 1 : Math.min(1, settle / 250);
    const x = 205 + (state.landing.x - 205) * progress;
    const y = 418 + (state.landing.y - 418) * progress;
    arrow(g, x, y);
  } else if (!state.verdict && pointer.inside) {
    const aim = reticle(state, pointer);
    g.strokeStyle = '#263d43';
    g.lineWidth = 3;
    g.beginPath();
    g.arc(aim.x, aim.y, 17, 0, Math.PI * 2);
    g.moveTo(aim.x - 25, aim.y);
    g.lineTo(aim.x + 25, aim.y);
    g.moveTo(aim.x, aim.y - 25);
    g.lineTo(aim.x, aim.y + 25);
    g.stroke();
  }

  g.textAlign = 'center';
  g.fillStyle = '#344a50';
  g.font = 'bold 27px system-ui, sans-serif';
  if (!state.verdict) g.fillText('CLICK THE GOLD CENTER!', 480, 675);
  else {
    g.fillStyle = state.verdict === 'win' ? '#267253' : '#a33e35';
    g.font = 'bold 58px system-ui, sans-serif';
    g.fillText(state.verdict === 'win' ? 'BULLSEYE!' : state.verdict === 'timeout' ? 'TOO SLOW!' : 'MISS!', 480, 85);
  }
}
