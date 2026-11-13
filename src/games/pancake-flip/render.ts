import { FLIGHT_MS, type State } from './logic';

type Ctx = CanvasRenderingContext2D;

function ellipse(g: Ctx, x: number, y: number, rx: number, ry: number, color: string): void {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}

function pancake(g: Ctx, x: number, y: number, doneness: number, squash: number): void {
  const blend = Math.min(1, doneness);
  const color = doneness >= 1.4 ? '#49312c' : `rgb(${Math.round(243 - 30 * blend)}, ${Math.round(217 - 79 * blend)}, ${Math.round(162 - 105 * blend)})`;
  g.save();
  g.translate(x, y);
  g.scale(1, squash);
  ellipse(g, 0, 7, 80, 25, '#9b5b30');
  ellipse(g, 0, 0, 80, 25, color);
  ellipse(g, -24, -5, 17, 5, 'rgba(255, 237, 174, 0.35)');
  ellipse(g, 34, 5, 12, 4, 'rgba(110, 58, 28, 0.18)');
  if (doneness >= 1 && doneness < 1.4) {
    g.fillStyle = '#ffed86';
    g.fillRect(-12, -13, 24, 13);
    g.fillStyle = '#fff6ba';
    g.fillRect(-12, -13, 24, 4);
  }
  g.restore();
}

function steam(g: Ctx, x: number, y: number, time: number, smoky: boolean): void {
  g.strokeStyle = smoky ? 'rgba(76, 70, 68, 0.55)' : 'rgba(255, 255, 255, 0.8)';
  g.lineWidth = smoky ? 10 : 5;
  g.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    const sway = Math.sin(time / 350 + i) * 7;
    g.beginPath();
    g.moveTo(x + i * 32, y);
    g.bezierCurveTo(x + i * 32 - 15 + sway, y - 22, x + i * 32 + 18 + sway, y - 36, x + i * 32 + sway, y - 58);
    g.stroke();
  }
}

export function draw(g: Ctx, state: State, time: number, reducedMotion: boolean): void {
  const motion = reducedMotion ? 0 : time;
  g.fillStyle = '#f8e6c9';
  g.fillRect(0, 0, 960, 720);
  g.strokeStyle = '#e9cba9';
  g.lineWidth = 3;
  for (let y = 40; y < 480; y += 80) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(960, y);
    g.stroke();
    for (let x = (Math.floor(y / 80) % 2 ? 0 : 70); x < 960; x += 140) {
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x, y + 80);
      g.stroke();
    }
  }
  g.fillStyle = '#bf7654';
  g.fillRect(0, 550, 960, 170);
  g.fillStyle = '#eed1a8';
  g.fillRect(0, 535, 960, 24);
  g.fillStyle = '#596268';
  g.fillRect(210, 535, 540, 128);
  g.fillStyle = '#7d8b8e';
  g.fillRect(210, 535, 540, 20);
  ellipse(g, 480, 530, 160, 25, '#343e42');
  ellipse(g, 480, 525, 120, 18, '#6caabb');
  for (let i = -3; i <= 3; i++) {
    g.fillStyle = i % 2 ? '#ffb65c' : '#8ad9e9';
    g.beginPath();
    g.moveTo(480 + i * 27 - 12, 526);
    g.quadraticCurveTo(480 + i * 27, 488 - (i % 2 ? 8 : 0), 480 + i * 27 + 12, 526);
    g.fill();
  }
  for (let x = 285; x <= 675; x += 130) {
    ellipse(g, x, 607, 17, 17, '#323c40');
    ellipse(g, x, 604, 10, 10, '#d9d4be');
  }

  const x = state.panX;
  g.strokeStyle = '#4b3028';
  g.lineWidth = 28;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x + 105, 498);
  g.lineTo(x + 220, 468);
  g.stroke();
  g.strokeStyle = '#b77b4c';
  g.lineWidth = 18;
  g.beginPath();
  g.moveTo(x + 150, 487);
  g.lineTo(x + 220, 468);
  g.stroke();
  ellipse(g, x, 504, 132, 37, '#2d353a');
  ellipse(g, x, 492, 132, 34, '#839197');
  ellipse(g, x, 489, 120, 25, '#41494a');

  const progress = state.flight / FLIGHT_MS;
  const flying = state.tossed && !state.verdict;
  const pancakeY = state.verdict === 'floor' ? 675 : flying ? 470 - 270 * 4 * progress * (1 - progress) : 470;
  const pancakeX = state.verdict === 'win' ? state.panX : state.pancakeX;
  const squash = state.verdict === 'floor' ? 0.38 : flying ? 0.3 + 0.7 * Math.abs(Math.cos(progress * Math.PI)) : state.verdict === 'pale' ? 0.7 : 1;
  pancake(g, pancakeX, pancakeY, state.doneness, squash);
  if (!state.tossed || state.verdict === 'burnt') steam(g, pancakeX, pancakeY - 30, motion, state.doneness > 1.25);

  g.fillStyle = '#694838';
  g.font = 'bold 19px system-ui, sans-serif';
  g.textAlign = 'center';
  g.fillText('DONENESS', 125, 165);
  for (let i = 0; i < 46; i++) {
    const t = i / 45;
    const start = t < 0.7 ? [255, 241, 211] : [223, 155, 67];
    const end = t < 0.7 ? [223, 155, 67] : [62, 48, 45];
    const blend = t < 0.7 ? t / 0.7 : (t - 0.7) / 0.3;
    g.fillStyle = `rgb(${start.map((value, index) => Math.round(value + (end[index] - value) * blend)).join(', ')})`;
    g.fillRect(103, 200 + i * 5, 44, 5);
  }
  g.strokeStyle = '#694838';
  g.lineWidth = 4;
  g.strokeRect(103, 200, 44, 230);
  g.strokeStyle = '#fff6a5';
  g.lineWidth = 5;
  g.strokeRect(98, 200 + 230 / 1.6, 54, 230 * 0.4 / 1.6);
  const markerY = 200 + Math.min(state.doneness, 1.6) / 1.6 * 230;
  g.fillStyle = '#a7352d';
  g.beginPath();
  g.moveTo(159, markerY);
  g.lineTo(178, markerY - 10);
  g.lineTo(178, markerY + 10);
  g.closePath();
  g.fill();

  g.textAlign = 'center';
  if (state.verdict) {
    const labels = { win: 'PERFECT!', pale: 'TOO PALE!', burnt: 'BURNT!', floor: 'SPLAT!', timeout: 'TOO SLOW' };
    g.font = 'bold 58px system-ui, sans-serif';
    g.fillStyle = state.verdict === 'win' ? '#27815e' : '#b24035';
    g.fillText(labels[state.verdict], 480, 105);
    if (state.verdict === 'win') {
      g.fillStyle = '#ffdd65';
      g.font = 'bold 40px system-ui, sans-serif';
      g.fillText('✦', pancakeX - 110, 435);
      g.fillText('✦', pancakeX + 110, 435);
    }
  } else {
    g.fillStyle = '#694838';
    g.font = 'bold 25px system-ui, sans-serif';
    g.fillText('SPACE: FLIP  ·  ← / →: CATCH', 480, 690);
  }
}
