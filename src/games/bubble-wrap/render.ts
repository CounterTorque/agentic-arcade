import { bubblePos, RADIUS, type State } from './logic';

type Ctx = CanvasRenderingContext2D;

function circle(g: Ctx, x: number, y: number, radius: number, color: string): void {
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y, radius, 0, Math.PI * 2);
  g.fill();
}

export function draw(g: Ctx, state: State, reducedMotion: boolean): void {
  g.fillStyle = '#203e58';
  g.fillRect(0, 0, 960, 720);
  g.fillStyle = '#2b536d';
  g.fillRect(0, 105, 960, 510);

  const xs = state.bubbles.map((bubble) => bubble.x + state.offset);
  const ys = state.bubbles.map((bubble) => bubble.y);
  const left = Math.min(...xs) - 65;
  const top = Math.min(...ys) - 65;
  g.fillStyle = '#88c6d0';
  g.fillRect(left, top, Math.max(...xs) - left + 65, Math.max(...ys) - top + 65);
  g.strokeStyle = '#b6e6e6';
  g.lineWidth = 5;
  g.strokeRect(left, top, Math.max(...xs) - left + 65, Math.max(...ys) - top + 65);

  for (const bubble of state.bubbles) {
    const { x, y } = bubblePos(state, bubble);
    if (bubble.popped) {
      circle(g, x, y, RADIUS, '#76b5c1');
      circle(g, x, y, RADIUS - 7, '#99ccd1');
      if (!reducedMotion && state.elapsed - bubble.poppedAt < 180) {
        g.fillStyle = '#fff9c9';
        g.font = 'bold 30px system-ui, sans-serif';
        g.textAlign = 'center';
        g.fillText('✦', x, y + 10);
      }
    } else {
      circle(g, x + 3, y + 5, RADIUS, '#5795a5');
      circle(g, x, y, RADIUS, '#c2edf0');
      circle(g, x, y, RADIUS - 5, '#8dd0df');
      circle(g, x - 12, y - 13, 10, '#e4ffff');
      circle(g, x + 15, y + 17, 5, '#b8edf1');
    }
    if (bubble === state.escaped) {
      g.strokeStyle = '#ed4354';
      g.lineWidth = 7;
      g.beginPath();
      g.arc(Math.min(x, 960 - RADIUS - 4), y, RADIUS + 4, 0, Math.PI * 2);
      g.stroke();
    }
  }

  g.textAlign = 'center';
  g.font = 'bold 30px system-ui, sans-serif';
  g.fillStyle = '#e5faff';
  g.fillText(`BUBBLES LEFT: ${state.bubbles.filter((bubble) => !bubble.popped).length}`, 480, 67);
  g.font = 'bold 27px system-ui, sans-serif';
  g.fillStyle = '#c9eff2';
  if (!state.verdict) g.fillText('POP THEM BEFORE THEY DRIFT AWAY  →', 480, 670);
  else {
    g.font = 'bold 52px system-ui, sans-serif';
    g.fillStyle = state.verdict === 'win' ? '#c9ffb5' : '#ffb8b6';
    g.fillText(state.verdict === 'win' ? 'ALL POPPED!' : state.escaped ? 'MISSED ONE!' : 'TIME UP!', 480, 675);
  }
}
