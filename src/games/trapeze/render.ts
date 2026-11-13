import { barPosition, flightPosition, partnerHands, type Flight, type LevelParams, type Point } from './logic';

type Context = CanvasRenderingContext2D;
interface Scene {
  time: number;
  params: LevelParams;
  phase: number;
  speed: number;
  flight: Flight | null;
  releaseTime: number;
  animationTime: number;
  reducedMotion: boolean;
}

function line(g: Context, points: Point[], color: string, width: number): void {
  g.beginPath();
  g.moveTo(points[0]!.x, points[0]!.y);
  for (const p of points.slice(1)) g.lineTo(p.x, p.y);
  g.strokeStyle = color;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.stroke();
}

function circle(g: Context, x: number, y: number, radius: number, color: string): void {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.fill();
}

function star(g: Context, x: number, y: number, radius: number, rotation = 0): void {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rotation + i * Math.PI / 5 - Math.PI / 2;
    const r = i % 2 ? radius * 0.42 : radius;
    if (i === 0) g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    else g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
}

function backdrop(g: Context, time: number, reducedMotion: boolean, missed: boolean): void {
  g.fillStyle = '#802b40';
  g.fillRect(0, 0, 960, 720);
  for (let i = -5; i < 6; i++) {
    g.fillStyle = i % 2 === 0 ? '#a73543' : '#f4d2a0';
    g.beginPath();
    g.moveTo(480, -80);
    g.lineTo(480 + i * 220, 570);
    g.lineTo(480 + (i + 1) * 220, 570);
    g.closePath();
    g.fill();
  }
  g.fillStyle = 'rgba(255, 239, 172, 0.18)';
  for (const x of [250, 710]) {
    g.beginPath();
    g.moveTo(x, 30);
    g.lineTo(x - 180, 585);
    g.lineTo(x + 180, 585);
    g.closePath();
    g.fill();
  }
  g.fillStyle = '#45283b';
  g.fillRect(0, 555, 960, 165);
  g.fillStyle = '#ddaa72';
  g.beginPath();
  g.ellipse(480, 665, 360, 45, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = '#f6d494';
  g.lineWidth = 5;
  g.stroke();
  for (let i = 0; i < 28; i++) {
    const x = 18 + i * 35;
    const bob = reducedMotion ? 0 : Math.sin(time / 350 + i) * 3;
    const y = 590 + (i % 3) * 7 + bob + (missed ? 6 : 0);
    circle(g, x, y, 14, i % 3 === 0 ? '#704052' : '#342635');
    g.fillStyle = '#342635';
    g.fillRect(x - 16, y + 10, 32, 37);
  }
  g.fillStyle = '#633849';
  g.fillRect(0, 620, 960, 12);
}

function apparatus(g: Context, left: Point, right: Point): void {
  for (const x of [70, 890]) {
    g.fillStyle = '#6a4141';
    g.fillRect(x - 10, 270, 20, 320);
    g.fillStyle = '#e1ac67';
    g.fillRect(x - 45, 260, 90, 20);
    g.fillStyle = '#f5d092';
    g.fillRect(x - 45, 260, 90, 5);
  }
  g.fillStyle = '#553c48';
  g.fillRect(150, 62, 660, 15);
  for (const [pivot, bar] of [[250, left], [710, right]] as const) {
    for (const dx of [-31, 31]) line(g, [{ x: pivot + dx, y: 72 }, { x: bar.x + dx, y: bar.y }], '#f6e2b4', 4);
    line(g, [{ x: bar.x - 40, y: bar.y }, { x: bar.x + 40, y: bar.y }], '#834b31', 12);
    circle(g, bar.x - 40, bar.y, 6, '#e9b970');
    circle(g, bar.x + 40, bar.y, 6, '#e9b970');
  }
}

function net(g: Context, sag: number): void {
  const y = 585 + sag;
  line(g, [{ x: 85, y: 538 }, { x: 85, y: 650 }], '#ddbc8e', 9);
  line(g, [{ x: 875, y: 538 }, { x: 875, y: 650 }], '#ddbc8e', 9);
  g.strokeStyle = '#f6ddb4';
  g.lineWidth = 3;
  for (let i = 0; i <= 10; i++) {
    const x = 85 + i * 79;
    line(g, [{ x, y: 560 + Math.sin(i * Math.PI / 10) * (25 + sag) }, { x, y: 607 + Math.sin(i * Math.PI / 10) * (25 + sag) }], '#e9cba1', 2);
  }
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.moveTo(85, 560 + i * 16);
    g.quadraticCurveTo(480, y + 50 + i * 16, 875, 560 + i * 16);
    g.stroke();
  }
}

function acrobat(g: Context, hand: Point, partner: boolean, flying: boolean): void {
  g.save();
  g.translate(hand.x, hand.y);
  if (partner) {
    line(g, [{ x: -16, y: -90 }, { x: -20, y: -68 }, { x: -12, y: -45 }], '#f4bf9d', 12);
    line(g, [{ x: 16, y: -90 }, { x: 20, y: -68 }, { x: 12, y: -45 }], '#f4bf9d', 12);
    line(g, [{ x: -12, y: -45 }, { x: 0, y: -34 }, { x: 12, y: -45 }], '#bd3864', 22);
    line(g, [{ x: 0, y: -34 }, { x: 0, y: -12 }], '#bd3864', 22);
    line(g, [{ x: -8, y: -25 }, { x: -18, y: -6 }, { x: -5, y: 0 }], '#f4bf9d', 8);
    line(g, [{ x: 8, y: -25 }, { x: 18, y: -6 }, { x: 5, y: 0 }], '#f4bf9d', 8);
    circle(g, 0, -10, 12, '#f4bf9d');
    circle(g, 0, -4, 7, '#4b263b');
  } else {
    if (flying) g.rotate(-0.65);
    line(g, [{ x: -13, y: 55 }, { x: -24, y: 85 }], '#f4bf9d', 11);
    line(g, [{ x: 13, y: 55 }, { x: 25, y: 85 }], '#f4bf9d', 11);
    line(g, [{ x: -13, y: 85 }, { x: -27, y: 85 }], '#4a334b', 9);
    line(g, [{ x: 13, y: 85 }, { x: 29, y: 85 }], '#4a334b', 9);
    line(g, [{ x: 0, y: 32 }, { x: 0, y: 60 }], '#287c9d', 28);
    line(g, [{ x: -10, y: 34 }, { x: -21, y: 18 }, { x: -12, y: 0 }], '#f4bf9d', 9);
    line(g, [{ x: 10, y: 34 }, { x: 21, y: 18 }, { x: 12, y: 0 }], '#f4bf9d', 9);
    circle(g, 0, 23, 15, '#f4bf9d');
    g.fillStyle = '#442e40';
    g.beginPath();
    g.arc(0, 20, 15, Math.PI, Math.PI * 2);
    g.fill();
    g.fillStyle = '#f8d978';
    star(g, 0, 49, 7);
  }
  g.restore();
}

export function drawScene(g: Context, scene: Scene): void {
  const { params, phase, speed, flight, releaseTime, animationTime, reducedMotion } = scene;
  const time = flight ? releaseTime * speed + animationTime * speed : scene.time * speed;
  const left = barPosition(time, params, phase, 'left');
  const right = barPosition(time, params, phase, 'right');
  const hands = partnerHands(time, params, phase);
  const finished = flight !== null && animationTime >= flight.duration;
  const missed = finished && !flight.caught;
  backdrop(g, time, reducedMotion, missed);
  apparatus(g, left, right);
  const sag = missed && !reducedMotion ? Math.max(0, 18 * Math.sin((animationTime - flight.duration) / 95)) : 0;
  net(g, sag);
  acrobat(g, hands, true, false);
  if (!flight) {
    acrobat(g, left, false, false);
  } else {
    let flyer = flightPosition(flight, animationTime, speed);
    if (finished && flight.caught) flyer = hands;
    if (missed) flyer = { x: Math.max(100, Math.min(860, flyer.x)), y: 530 + sag };
    if (!reducedMotion && !finished) {
      const trail = flightPosition(flight, Math.max(0, animationTime - 80 / speed), speed);
      line(g, [trail, flyer], 'rgba(255, 244, 205, 0.5)', 8);
    }
    acrobat(g, flyer, false, true);
    if (finished) {
      g.fillStyle = flight.caught ? '#ffe481' : '#ffe79a';
      for (let i = 0; i < 5; i++) {
        const angle = i * Math.PI * 2 / 5 + (reducedMotion ? 0 : animationTime / 500);
        star(g, flyer.x + Math.cos(angle) * 55, flyer.y + Math.sin(angle) * 45, 9, angle);
      }
    }
  }
  g.textAlign = 'center';
  g.font = 'bold 44px system-ui, sans-serif';
  g.lineWidth = 7;
  g.strokeStyle = '#fff1ce';
  g.fillStyle = finished ? (flight!.caught ? '#227963' : '#a52c42') : '#56354b';
  const label = finished ? (flight!.caught ? 'CAUGHT!' : 'MISSED!') : 'REACH YOUR PARTNER!';
  g.strokeText(label, 480, 49);
  g.fillText(label, 480, 49);
}
