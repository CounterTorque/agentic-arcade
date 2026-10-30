import type { PointerState } from '@arcade/sdk';
import { levelParams, litCount, windowRect, type State } from './logic';

type Ctx = CanvasRenderingContext2D;

export function draw(g: Ctx, state: State, pointer: PointerState, time: number, reducedMotion: boolean): void {
  g.fillStyle = '#111b38';
  g.fillRect(0, 0, 960, 720);
  g.fillStyle = '#f7e8bd';
  g.beginPath();
  g.arc(100, 100, 38, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#bdcdec';
  for (const [x, y] of [[196, 92], [302, 48], [605, 58], [765, 115], [861, 53], [83, 270], [879, 302]]) {
    g.fillRect(x, y, 4, 4);
  }

  const { cols, rows } = levelParams(state.level);
  const left = 480 - (cols - 1) * 60 - 65;
  const top = 625 - rows * 76 - 28;
  const width = (cols - 1) * 120 + 130;
  g.fillStyle = '#3d4560';
  g.fillRect(left, top, width, 670 - top);
  g.fillStyle = '#68718a';
  g.fillRect(left - 12, top, width + 24, 15);
  g.fillStyle = '#0b1327';
  g.fillRect(0, 670, 960, 50);

  for (let i = 0; i < state.lit.length; i++) {
    const rect = windowRect(state.level, i);
    const warning = state.pendingRelights.some((relight) => relight.warned && relight.target === i);
    const blink = warning && (reducedMotion || Math.floor(time / 100) % 2 === 0);
    g.fillStyle = state.lit[i] ? '#ffdb75' : blink && !reducedMotion ? '#b59b68' : '#202c45';
    g.fillRect(rect.x, rect.y, rect.width, rect.height);
    if (state.lit[i]) {
      g.fillStyle = '#fff0b3';
      g.fillRect(rect.x + 5, rect.y + 5, rect.width - 10, 4);
    }
    g.strokeStyle = state.verdict === 'lose' && state.lit[i] ? '#ff6b6b' : warning ? '#fff0a1' : '#77839a';
    g.lineWidth = warning || (state.verdict === 'lose' && state.lit[i]) ? 4 : 2;
    g.strokeRect(rect.x, rect.y, rect.width, rect.height);
    g.beginPath();
    g.moveTo(rect.x + rect.width / 2, rect.y);
    g.lineTo(rect.x + rect.width / 2, rect.y + rect.height);
    g.stroke();
  }

  g.textAlign = 'center';
  g.font = 'bold 26px system-ui, sans-serif';
  g.fillStyle = '#e0e8f8';
  if (!state.verdict) g.fillText(`${litCount(state)} LIGHTS ON — KEEP THEM OFF!`, 480, 703);
  else {
    g.font = 'bold 54px system-ui, sans-serif';
    g.fillStyle = state.verdict === 'win' ? '#b8f2dc' : '#ff9990';
    g.fillText(state.verdict === 'win' ? 'GOOD NIGHT!' : 'TOO BRIGHT!', 480, 75);
  }

  if (!state.verdict && pointer.inside) {
    g.strokeStyle = '#ffffff';
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
