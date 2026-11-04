import type { PointerState } from '@arcade/sdk';
import { cellRect, levelParams, type Difference, type State } from './logic';

type Ctx = CanvasRenderingContext2D;

const PALETTES = [
  { face: '#ffcc72', shade: '#e9aa65', subtle: '#f2b97a', contrast: '#75cbd0' },
  { face: '#8bd9cb', shade: '#63b6aa', subtle: '#78c6ba', contrast: '#f5a773' },
  { face: '#f5aeb5', shade: '#d8899b', subtle: '#e99ba9', contrast: '#83d1bb' },
];

function drawFace(g: Ctx, x: number, y: number, size: number, palette: typeof PALETTES[number], difference: Difference | null): void {
  g.save();
  g.translate(x, y);
  if (difference === 'rotation') g.rotate(Math.PI / 18);
  const radius = size * 0.32;
  g.fillStyle = difference === 'contrast' ? palette.contrast : difference === 'shade' ? palette.shade : difference === 'subtle-shade' ? palette.subtle : palette.face;
  g.strokeStyle = '#35415c';
  g.lineWidth = Math.max(2, size * 0.025);
  g.beginPath();
  g.arc(0, size * 0.05, radius, 0, Math.PI * 2);
  g.fill();
  g.stroke();

  g.fillStyle = '#35415c';
  g.beginPath();
  g.ellipse(-size * 0.11, 0, size * 0.03, size * 0.045, 0, 0, Math.PI * 2);
  g.fill();
  if (difference !== 'missing-eye') {
    g.beginPath();
    g.ellipse(size * 0.11, 0, size * 0.03, size * 0.045, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(-size * 0.15, -size * 0.09);
  g.lineTo(-size * 0.07, -size * 0.1);
  if (difference !== 'missing-eyebrow') {
    g.moveTo(size * 0.07, -size * 0.1);
    g.lineTo(size * 0.15, -size * 0.09);
  }
  g.stroke();
  g.beginPath();
  if (difference === 'frown') {
    g.arc(0, size * 0.24, size * 0.11, Math.PI * 1.15, Math.PI * 1.85);
  } else {
    g.arc(0, size * 0.08, size * 0.12, Math.PI * 0.15, Math.PI * 0.85);
  }
  g.stroke();

  g.save();
  g.translate(0, -size * 0.23);
  if (difference === 'tilted-hat') g.rotate(-Math.PI / 9);
  g.fillStyle = '#5c6bb0';
  g.fillRect(-size * 0.17, -size * 0.14, size * 0.34, size * 0.15);
  g.fillStyle = '#35415c';
  g.fillRect(-size * 0.23, 0, size * 0.46, size * 0.045);
  g.restore();
  g.restore();
}

export function draw(g: Ctx, state: State, pointer: PointerState, time: number, reducedMotion: boolean): void {
  g.fillStyle = '#f6f1df';
  g.fillRect(0, 0, 960, 720);
  g.fillStyle = '#35415c';
  g.textAlign = 'center';
  g.font = 'bold 36px system-ui, sans-serif';
  const message = !state.verdict ? 'FIND THE ODD ONE!' : state.verdict === 'win' ? 'SPOTTED!' : state.clicked === null ? 'TOO SLOW!' : 'WRONG ONE!';
  g.fillText(message, 480, 55);

  const { size } = levelParams(state.level);
  const bob = reducedMotion ? 0 : Math.sin(time / 500) * 2;
  for (let i = 0; i < size * size; i++) {
    const rect = cellRect(state.level, i);
    g.fillStyle = '#ffffff';
    g.fillRect(rect.x, rect.y, rect.width, rect.height);
    if (state.verdict && (i === state.odd || i === state.clicked)) {
      g.strokeStyle = i === state.odd ? '#218765' : '#d14c52';
      g.lineWidth = 5;
      g.strokeRect(rect.x + 3, rect.y + 3, rect.width - 6, rect.height - 6);
    }
    drawFace(g, rect.x + rect.width / 2, rect.y + rect.height / 2 + bob, rect.width, PALETTES[state.palette], i === state.odd ? state.difference : null);
  }

  if (!state.verdict && pointer.inside) {
    g.strokeStyle = '#35415c';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(pointer.x, pointer.y, 9, 0, Math.PI * 2);
    g.moveTo(pointer.x - 15, pointer.y);
    g.lineTo(pointer.x + 15, pointer.y);
    g.moveTo(pointer.x, pointer.y - 15);
    g.lineTo(pointer.x, pointer.y + 15);
    g.stroke();
  }
}
