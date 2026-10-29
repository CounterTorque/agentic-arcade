import { BASE_TOP, CENTER, CRATE_HEIGHT, HANG_Y, hookX, topX, type LevelParams, type State } from './logic';

type Ctx = CanvasRenderingContext2D;

function box(g: Ctx, x: number, y: number, w: number, h: number, color: string, stroke = '#513d31'): void {
  g.fillStyle = color;
  g.fillRect(x, y, w, h);
  g.strokeStyle = stroke;
  g.lineWidth = 3;
  g.strokeRect(x, y, w, h);
}

function line(g: Ctx, x: number, y: number, x2: number, y2: number, color: string, width: number): void {
  g.strokeStyle = color;
  g.lineWidth = width;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x2, y2);
  g.stroke();
}

function crate(g: Ctx, x: number, y: number, w: number): void {
  const left = x - w / 2;
  box(g, left + 4, y + 5, w, CRATE_HEIGHT, 'rgba(52, 43, 37, 0.22)', 'rgba(52, 43, 37, 0)');
  box(g, left, y, w, CRATE_HEIGHT, '#d99a50', '#754925');
  for (let i = 1; i < 3; i++) line(g, left + 3, y + i * CRATE_HEIGHT / 3, left + w - 3, y + i * CRATE_HEIGHT / 3, '#ba7b3d', 2);
  line(g, left + 5, y + 5, left + w - 5, y + CRATE_HEIGHT - 5, '#98602f', 7);
  line(g, left + w - 5, y + 5, left + 5, y + CRATE_HEIGHT - 5, '#98602f', 7);
  g.fillStyle = '#65442d';
  for (const dx of [8, w - 8]) for (const dy of [8, CRATE_HEIGHT - 8]) {
    g.beginPath();
    g.arc(left + dx, y + dy, 2, 0, Math.PI * 2);
    g.fill();
  }
}

function backdrop(g: Ctx): void {
  g.fillStyle = '#80c9df';
  g.fillRect(0, 0, 960, 720);
  g.fillStyle = '#a7dce3';
  g.fillRect(0, 220, 960, 390);
  g.fillStyle = '#c9e8df';
  g.fillRect(0, 380, 960, 230);
  g.fillStyle = 'rgba(255, 255, 255, 0.65)';
  for (const [x, y] of [[160, 94], [430, 70], [780, 135]]) {
    g.beginPath();
    g.ellipse(x, y, 70, 18, 0, 0, Math.PI * 2);
    g.ellipse(x - 20, y - 12, 30, 19, 0, 0, Math.PI * 2);
    g.ellipse(x + 22, y - 14, 32, 22, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#a3c1bd';
  for (let i = 0; i < 12; i++) {
    const h = 70 + (i * 47 % 100);
    g.fillRect(i * 90 - 10, 610 - h, 68, h);
    g.fillStyle = '#c2d7cd';
    for (let j = 0; j < 3; j++) g.fillRect(i * 90 + 6 + j * 16, 620 - h, 8, 12);
    g.fillStyle = '#a3c1bd';
  }
  g.fillStyle = '#b4a38a';
  g.fillRect(0, 610, 960, 110);
  g.fillStyle = '#d2c3a8';
  g.fillRect(0, 610, 960, 12);
  for (let i = 0; i < 15; i++) {
    g.fillStyle = '#9e907c';
    g.fillRect(i * 71, 661 + (i % 3) * 15, 25, 3);
  }
}

function crane(g: Ctx, x: number): void {
  box(g, 92, 120, 70, 492, '#e6ac2d', '#8b6424');
  for (let y = 135; y < 580; y += 65) {
    line(g, 100, y, 154, y + 60, '#956b24', 5);
    line(g, 154, y, 100, y + 60, '#956b24', 5);
    line(g, 100, y + 60, 154, y + 60, '#956b24', 5);
  }
  box(g, 55, 90, 760, 38, '#f4bf38', '#8b6424');
  for (let i = 0; i < 10; i++) {
    line(g, 165 + i * 62, 94, 196 + i * 62, 124, '#a67524', 3);
    line(g, 196 + i * 62, 124, 227 + i * 62, 94, '#a67524', 3);
  }
  box(g, 45, 127, 86, 45, '#6f7880', '#4c5960');
  box(g, 168, 129, 84, 50, '#e7a729', '#8b6424');
  box(g, 181, 136, 51, 27, '#b7e8ec', '#668e93');
  box(g, x - 26, 129, 52, 17, '#4c5960', '#34434c');
  line(g, x - 4, 146, x - 4, HANG_Y - 16, '#52616b', 3);
  line(g, x + 4, 146, x + 4, HANG_Y - 16, '#52616b', 3);
  g.strokeStyle = '#4c5960';
  g.lineWidth = 6;
  g.beginPath();
  g.arc(x, HANG_Y - 12, 9, 0, Math.PI);
  g.stroke();
}

function platform(g: Ctx): void {
  box(g, 345, 657, 270, 25, '#e5b740', '#685239');
  g.save();
  g.beginPath();
  g.rect(347, 659, 266, 21);
  g.clip();
  for (let x = 330; x < 640; x += 38) line(g, x, 682, x + 18, 656, '#494746', 12);
  g.restore();
}

export function draw(g: Ctx, state: State, params: LevelParams, down: boolean, settleMs: number, reducedMotion: boolean): void {
  backdrop(g);
  const hook = hookX(state);
  crane(g, hook);
  platform(g);
  crate(g, CENTER, BASE_TOP + CRATE_HEIGHT, params.width);
  crate(g, CENTER, BASE_TOP, params.width);

  const tilt = state.result === 'topple' ? (reducedMotion ? 0.45 : Math.min(1, settleMs / 500) * 0.8) * (state.x < topX(state) ? -1 : 1) : 0;
  g.save();
  g.translate(CENTER, BASE_TOP);
  g.rotate(tilt);
  g.translate(-CENTER, -BASE_TOP);
  state.stack.forEach((x, i) => crate(g, x, BASE_TOP - (i + 1) * CRATE_HEIGHT, params.width));
  if (state.crate === 'falling') crate(g, state.x, state.y, params.width);
  g.restore();

  if (state.crate === 'hanging' && !state.result) {
    g.strokeStyle = 'rgba(55, 83, 88, 0.6)';
    g.lineWidth = 2;
    g.setLineDash([7, 8]);
    g.beginPath();
    g.moveTo(hook, HANG_Y + CRATE_HEIGHT);
    g.lineTo(hook, BASE_TOP - state.stack.length * CRATE_HEIGHT);
    g.stroke();
    g.setLineDash([]);
    crate(g, hook, HANG_Y, params.width);
  }

  box(g, 690, 535, 210, 68, '#fff4d7', '#8b714f');
  g.fillStyle = '#604a36';
  g.font = 'bold 22px system-ui, sans-serif';
  g.textAlign = 'center';
  g.fillText('STACK', 795, 561);
  for (let i = 0; i < 3; i++) box(g, 748 + i * 35, 572, 24, 18, i < state.stack.length ? '#d99a50' : '#e1d6bf', '#9a805e');
  g.fillStyle = '#4a4d4a';
  g.beginPath();
  g.arc(790, 655, 42, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = down ? '#b54c36' : '#e66645';
  g.beginPath();
  g.arc(790, down ? 655 : 650, 34, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff8e7';
  g.font = 'bold 19px system-ui, sans-serif';
  g.fillText('DROP', 790, down ? 662 : 657);

  if (state.result) {
    g.textAlign = 'center';
    g.font = 'bold 54px system-ui, sans-serif';
    g.lineWidth = 7;
    g.strokeStyle = '#fff6dc';
    const label = state.result === 'win' ? 'STACKED!' : state.result === 'topple' ? 'TOPPLED!' : 'TOO SLOW!';
    g.strokeText(label, 490, 205);
    g.fillStyle = state.result === 'win' ? '#258875' : '#ba4e3c';
    g.fillText(label, 490, 205);
    if (state.result === 'win') {
      for (let i = 0; i < 20; i++) {
        const angle = i * Math.PI * 2 / 20;
        const radius = 125 + (reducedMotion ? 0 : Math.min(settleMs / 7, 50));
        g.fillStyle = ['#f3c442', '#ec7753', '#3caa9b'][i % 3]!;
        g.fillRect(480 + Math.cos(angle) * radius, 185 + Math.sin(angle) * radius * 0.6, 8, 8);
      }
    } else if (state.result === 'topple') {
      g.fillStyle = 'rgba(172, 147, 116, 0.6)';
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        g.arc(430 + i * 25, 560 - (reducedMotion ? 0 : Math.min(settleMs / 20, 20)), 15 + i % 2 * 6, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
}
