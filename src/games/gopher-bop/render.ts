import type { PointerState } from '@arcade/sdk';
import { active, holeRect, levelParams, popOffset, type State } from './logic';

type Ctx = CanvasRenderingContext2D;

function ellipse(g: Ctx, x: number, y: number, rx: number, ry: number, color: string): void {
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}

export function draw(g: Ctx, state: State, pointer: PointerState, reducedMotion: boolean): void {
  g.fillStyle = '#a4d46f';
  g.fillRect(0, 0, 960, 720);
  g.fillStyle = '#d6ec9b';
  g.fillRect(0, 0, 960, 115);
  g.textAlign = 'center';
  g.font = 'bold 30px system-ui, sans-serif';
  g.fillStyle = '#325327';
  g.fillText(`GOPHERS: ${state.hits} / ${levelParams(state.level).hits}`, 480, 68);
  const { cols, rows } = levelParams(state.level);
  for (let i = 0; i < cols * rows; i++) {
    const { x, y } = holeRect(state.level, i);
    ellipse(g, x, y + 30, 78, 31, '#729c4d');
    ellipse(g, x, y + 20, 67, 25, '#503b2c');
    const pop = state.pops.find((p) => p.hole === i && active(p, state.elapsed));
    if (pop) {
      const offset = reducedMotion ? 0 : popOffset(pop, state.elapsed);
      const cy = y - 35 + offset;
      if (pop.kind === 'rabbit') {
        ellipse(g, x - 23, cy - 45, 13, 40, '#fff9ee');
        ellipse(g, x + 23, cy - 45, 13, 40, '#fff9ee');
        ellipse(g, x - 23, cy - 48, 5, 26, '#edabc2');
        ellipse(g, x + 23, cy - 48, 5, 26, '#edabc2');
      } else {
        ellipse(g, x - 37, cy - 31, 15, 16, '#80502f');
        ellipse(g, x + 37, cy - 31, 15, 16, '#80502f');
      }
      ellipse(g, x, cy, 52, 58, pop.kind === 'rabbit' ? '#fff9ee' : '#aa7042');
      ellipse(g, x - 18, cy - 11, 5, 7, '#342b27');
      ellipse(g, x + 18, cy - 11, 5, 7, '#342b27');
      ellipse(g, x, cy + 12, 17, 11, pop.kind === 'rabbit' ? '#f4c7c9' : '#e8bb87');
      ellipse(g, x, cy + 6, 5, 4, '#523c32');
      if (state.rabbitHit === i) {
        g.font = 'bold 48px system-ui, sans-serif';
        g.fillStyle = '#c12d29';
        g.fillText('✗', x + 61, cy - 40);
      }
    }
    if (state.bonk?.hole === i && (state.verdict === 'win' || state.elapsed < state.bonk.until)) {
      g.font = 'bold 38px system-ui, sans-serif';
      g.fillStyle = '#fff38b';
      g.fillText('✦', x, y - 40);
    }
  }
  g.font = 'bold 26px system-ui, sans-serif';
  g.fillStyle = '#325327';
  if (!state.verdict) g.fillText('BOP BROWN GOPHERS — NOT WHITE RABBITS!', 480, 675);
  else {
    g.font = 'bold 54px system-ui, sans-serif';
    g.fillStyle = state.verdict === 'win' ? '#28683f' : '#b12f2b';
    g.fillText(state.verdict === 'win' ? 'BOPPED!' : state.rabbitHit !== null ? 'RABBIT!' : 'TOO SLOW!', 480, 675);
  }
  if (pointer.inside && !state.verdict) {
    g.save();
    g.translate(pointer.x, pointer.y);
    g.strokeStyle = '#70472e';
    g.lineWidth = 10;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(8, 8);
    g.lineTo(42, 49);
    g.stroke();
    g.fillStyle = '#e8bc65';
    g.fillRect(-16, -13, 35, 25);
    g.restore();
  }
}
