import { STAGE_HEIGHT, STAGE_WIDTH, type InputAction, type InputApi } from '@arcade/sdk';

const KEY_MAP: Record<string, InputAction> = {
  ' ': 'action',
  Enter: 'action',
  z: 'action',
  j: 'action',
  ArrowUp: 'up',
  w: 'up',
  ArrowDown: 'down',
  s: 'down',
  ArrowLeft: 'left',
  a: 'left',
  ArrowRight: 'right',
  d: 'right',
};

export class InputController {
  private down = new Set<InputAction>();
  private pressed = new Set<InputAction>();
  private released = new Set<InputAction>();
  private ptr = { x: 0, y: 0, down: false, inside: false };
  private sources = new Map<InputAction, Set<string>>();

  readonly api: InputApi;

  constructor() {
    const snapshot = () => ({ ...this.ptr });
    this.api = {
      isDown: (a) => this.down.has(a),
      wasPressed: (a) => this.pressed.has(a),
      wasReleased: (a) => this.released.has(a),
      get pointer() {
        return snapshot();
      },
    };
  }

  press(a: InputAction, source = 'script'): void {
    let s = this.sources.get(a);
    if (!s) this.sources.set(a, (s = new Set()));
    s.add(source);
    if (!this.down.has(a)) {
      this.down.add(a);
      this.pressed.add(a);
    }
  }

  release(a: InputAction, source = 'script'): void {
    const s = this.sources.get(a);
    s?.delete(source);
    if (s && s.size > 0) return;
    if (this.down.delete(a)) this.released.add(a);
  }

  tap(a: InputAction): void {
    this.press(a);
    this.release(a);
  }

  setPointer(x: number, y: number, down = this.ptr.down, inside = true): void {
    const was = this.ptr.down;
    this.ptr = { x, y, down, inside };
    if (down && !was) this.press('action', 'pointer');
    if (!down && was) this.release('action', 'pointer');
  }

  reset(): void {
    this.down.clear();
    this.pressed.clear();
    this.released.clear();
    this.sources.clear();
    this.ptr = { ...this.ptr, down: false };
  }

  endFrame(): void {
    this.pressed.clear();
    this.released.clear();
  }

  attach(keyTarget: Window | Document, stageEl: HTMLElement, getScale: () => number): () => void {
    const ac = new AbortController();
    const opts = { signal: ac.signal };
    const keyHandler = (down: boolean) => (e: Event) => {
      const ev = e as KeyboardEvent;
      const key = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
      const action = KEY_MAP[key];
      if (!action) return;
      ev.preventDefault();
      if (ev.repeat) return;
      if (down) this.press(action, `key:${key}`);
      else this.release(action, `key:${key}`);
    };
    const toStage = (ev: PointerEvent) => {
      const r = stageEl.getBoundingClientRect();
      const s = getScale() || 1;
      return { x: (ev.clientX - r.left) / s, y: (ev.clientY - r.top) / s };
    };
    const inStage = (p: { x: number; y: number }) => p.x >= 0 && p.y >= 0 && p.x <= STAGE_WIDTH && p.y <= STAGE_HEIGHT;
    keyTarget.addEventListener('keydown', keyHandler(true), opts);
    keyTarget.addEventListener('keyup', keyHandler(false), opts);
    stageEl.addEventListener('pointermove', (e) => {
      const p = toStage(e);
      this.setPointer(p.x, p.y, this.ptr.down, inStage(p));
    }, opts);
    stageEl.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const p = toStage(e);
      this.setPointer(p.x, p.y, true, inStage(p));
    }, opts);
    stageEl.addEventListener('pointerup', (e) => {
      if (e.button !== 0) return;
      const p = toStage(e);
      this.setPointer(p.x, p.y, false, inStage(p));
    }, opts);
    stageEl.addEventListener('pointerleave', () => {
      this.ptr = { ...this.ptr, inside: false };
    }, opts);
    return () => ac.abort();
  }
}
