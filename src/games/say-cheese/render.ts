import { FRAME_HEIGHT, FRAME_WIDTH, RADIUS, fullyInside, type Friend, type State } from './logic';

type Ctx = CanvasRenderingContext2D;

function circle(g: Ctx, x: number, y: number, radius: number, color: string): void {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.fill();
}

function friend(g: Ctx, person: Friend, color: string, cut: boolean): void {
  circle(g, person.x, person.y, RADIUS, color);
  if (cut) {
    g.strokeStyle = '#e33e44';
    g.lineWidth = 5;
    g.stroke();
  }
  circle(g, person.x - 9, person.y - 5, 3, '#26313b');
  circle(g, person.x + 9, person.y - 5, 3, '#26313b');
  g.strokeStyle = '#26313b';
  g.lineWidth = 2.5;
  g.beginPath();
  g.arc(person.x, person.y + 3, 10, 0.2, Math.PI - 0.2);
  g.stroke();
}

function park(g: Ctx, state: State, highlight: boolean): void {
  g.fillStyle = '#a9d6b0';
  g.fillRect(0, 0, 960, 720);
  g.fillStyle = '#c6e7c1';
  g.fillRect(0, 0, 960, 180);
  g.fillStyle = '#e5d6ac';
  g.beginPath();
  g.moveTo(0, 490);
  g.lineTo(960, 340);
  g.lineTo(960, 520);
  g.lineTo(0, 670);
  g.fill();
  for (const x of [70, 210, 790, 910]) {
    g.fillStyle = '#927254';
    g.fillRect(x - 9, 120, 18, 105);
    circle(g, x, 120, 48, '#639d73');
    circle(g, x - 24, 125, 27, '#76b482');
  }
  const colors = ['#f6ae83', '#f4d079', '#d8a8dc'];
  state.friends.forEach((person, i) => friend(g, person, colors[i], highlight && !fullyInside(state.frame, person)));
}

export function draw(g: Ctx, state: State, settle: number, reducedMotion: boolean): void {
  park(g, state, state.shot && state.verdict === 'lose');
  const { x, y } = state.frame;
  g.fillStyle = 'rgba(21, 35, 38, 0.48)';
  g.fillRect(0, 0, 960, y);
  g.fillRect(0, y, x, FRAME_HEIGHT);
  g.fillRect(x + FRAME_WIDTH, y, 960 - x - FRAME_WIDTH, FRAME_HEIGHT);
  g.fillRect(0, y + FRAME_HEIGHT, 960, 720 - y - FRAME_HEIGHT);
  g.strokeStyle = '#fff9e7';
  g.lineWidth = 5;
  g.strokeRect(x, y, FRAME_WIDTH, FRAME_HEIGHT);
  g.lineWidth = 10;
  for (const [cx, cy, sx, sy] of [
    [x, y, 1, 1], [x + FRAME_WIDTH, y, -1, 1],
    [x, y + FRAME_HEIGHT, 1, -1], [x + FRAME_WIDTH, y + FRAME_HEIGHT, -1, -1],
  ]) {
    g.beginPath();
    g.moveTo(cx, cy + sy * 28);
    g.lineTo(cx, cy);
    g.lineTo(cx + sx * 28, cy);
    g.stroke();
  }
  g.textAlign = 'center';
  g.font = 'bold 26px system-ui, sans-serif';
  g.fillStyle = '#fff9e7';
  if (!state.verdict) {
    g.fillText('DRAG THE FRAME • CLICK TO SNAP', 480, 675);
  } else if (state.verdict === 'win') {
    g.save();
    g.translate(480, 360);
    g.rotate(-0.04);
    g.fillStyle = '#fff9e7';
    g.fillRect(-190, -170, 380, 370);
    g.save();
    g.beginPath();
    g.rect(-160, -140, FRAME_WIDTH, FRAME_HEIGHT);
    g.clip();
    g.translate(-160 - x, -140 - y);
    park(g, state, false);
    g.restore();
    g.fillStyle = '#315c4e';
    g.font = 'bold 42px system-ui, sans-serif';
    g.fillText('CHEESE!', 0, 160);
    g.restore();
    if (!reducedMotion && settle < 100) {
      g.fillStyle = 'rgba(255,255,255,0.65)';
      g.fillRect(0, 0, 960, 720);
    }
  } else {
    g.font = 'bold 48px system-ui, sans-serif';
    g.fillStyle = '#fff9e7';
    g.fillText(state.shot ? 'CUT OFF!' : 'MISSED THE SHOT!', 480, 675);
  }
}
