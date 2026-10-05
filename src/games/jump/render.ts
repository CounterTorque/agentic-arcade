import { STAGE_HEIGHT, STAGE_WIDTH, type GameContext } from '@arcade/sdk';
import { GROUND_Y, PLAYER, type Car, type JumpState } from './logic';

export type Pose = 'run' | 'shocked' | 'cheer';

const SHAKE_MS = 300;
const SHAKE_AMPLITUDE = 6;
const SHAKE_HZ = 22;
const LANE_DASH = 60;
const LANE_GAP = 50;
const SCROLL_SPEED = 520;

export function createRenderer(ctx: GameContext, assets: { player: HTMLImageElement }) {
  const { g } = ctx.createCanvas();
  const roadY = GROUND_Y;
  const laneY = GROUND_Y + (STAGE_HEIGHT - GROUND_Y) / 2;
  let pose: Pose = 'run';
  let shakeLeftMs = 0;
  let shakeMs = 0;
  let scroll = 0;

  function drawCar(c: Car) {
    const wheelR = Math.min(13, c.h * 0.24);
    const top = GROUND_Y - c.h;
    g.fillStyle = c.color;
    g.beginPath();
    if (c.shape === 'truck') {
      g.roundRect(c.x, top + c.h * 0.35, c.w * 0.34, c.h * 0.55, 6);
      g.roundRect(c.x + c.w * 0.37, top, c.w * 0.63, c.h * 0.9, 4);
    } else if (c.shape === 'van') {
      g.roundRect(c.x, top, c.w, c.h * 0.9, 10);
    } else {
      g.roundRect(c.x, top + c.h * 0.4, c.w, c.h * 0.5, 8);
      g.roundRect(c.x + c.w * 0.2, top, c.w * 0.5, c.h * 0.5, 8);
    }
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.75)';
    g.beginPath();
    if (c.shape === 'truck') g.roundRect(c.x + c.w * 0.05, top + c.h * 0.42, c.w * 0.22, c.h * 0.22, 3);
    else if (c.shape === 'van') g.roundRect(c.x + c.w * 0.06, top + c.h * 0.12, c.w * 0.3, c.h * 0.3, 4);
    else g.roundRect(c.x + c.w * 0.27, top + c.h * 0.08, c.w * 0.36, c.h * 0.26, 4);
    g.fill();
    g.fillStyle = '#ffe66d';
    g.fillRect(c.x, GROUND_Y - c.h * 0.42, 5, c.h * 0.14);
    g.fillStyle = '#1d1d1d';
    for (const wx of [c.x + c.w * 0.2, c.x + c.w * 0.8]) {
      g.beginPath();
      g.arc(wx, GROUND_Y - wheelR + 3, wheelR, 0, Math.PI * 2);
      g.fill();
    }
  }

  function drawScene(s: JumpState) {
    g.fillStyle = '#bde0fe';
    g.fillRect(-20, 0, STAGE_WIDTH + 40, roadY);
    g.fillStyle = '#6c757d';
    g.fillRect(-20, roadY, STAGE_WIDTH + 40, STAGE_HEIGHT - roadY + 20);
    g.fillStyle = '#f1f1f1';
    const period = LANE_DASH + LANE_GAP;
    for (let x = -((scroll % period) + period); x < STAGE_WIDTH + 20; x += period) g.fillRect(x, laneY - 3, LANE_DASH, 6);

    for (const c of s.cars) drawCar(c);

    const py = GROUND_Y - PLAYER.h - s.y;
    const shadow = Math.max(0.35, 1 - s.y / 300);
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.beginPath();
    g.ellipse(PLAYER.x + PLAYER.w / 2, GROUND_Y + 2, (PLAYER.w / 2) * shadow, 6 * shadow, 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = s.status === 'hit' ? 0.85 : 1;
    g.drawImage(assets.player, PLAYER.x, py, PLAYER.w, PLAYER.h);
    g.globalAlpha = 1;
    g.textAlign = 'center';
    if (s.status === 'hit' || pose === 'shocked') {
      g.fillStyle = '#d00000';
      g.font = 'bold 48px system-ui, sans-serif';
      g.fillText('!', PLAYER.x + PLAYER.w / 2, py - 12);
    } else if (pose === 'cheer') {
      g.fillStyle = '#2b9348';
      g.font = 'bold 36px system-ui, sans-serif';
      g.fillText('\u2605', PLAYER.x + PLAYER.w / 2, py - 10);
    }
    g.textAlign = 'start';
  }

  return {
    setPose(p: Pose) {
      pose = p;
      if (p === 'shocked' && !ctx.reducedMotion) shakeLeftMs = SHAKE_MS;
    },
    draw(s: JumpState, dtMs: number) {
      if (s.status === 'running') scroll += (SCROLL_SPEED * ctx.difficulty.speed * dtMs) / 1000;
      let shake = 0;
      if (shakeLeftMs > 0) {
        shakeMs += dtMs;
        shakeLeftMs = Math.max(0, shakeLeftMs - dtMs);
        shake = Math.sin((shakeMs / 1000) * SHAKE_HZ * Math.PI * 2) * SHAKE_AMPLITUDE * (shakeLeftMs / SHAKE_MS);
      }
      g.save();
      g.translate(shake, 0);
      drawScene(s);
      g.restore();
    },
    dispose() {
      shakeLeftMs = 0;
    },
  };
}
