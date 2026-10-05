export interface Clock {
  run(step: (dt: number) => boolean, signal?: AbortSignal): Promise<void>;
}

const MAX_DT = 50;
const FIRST_DT = 1000 / 60;
const MAX_FRAMES = 100_000;

export class RafClock implements Clock {
  paused = false;
  private cancel: (() => void) | null = null;
  private resumeLoop: (() => void) | null = null;
  private readonly onVisibility = () => {
    if (document.hidden) this.pause();
  };

  constructor() {
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.resumeLoop?.();
  }

  dispose(): void {
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.cancel?.();
  }

  run(step: (dt: number) => boolean, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      if (signal?.aborted) return resolve();
      let last: number | null = null;
      let handle = 0;
      const finish = () => {
        signal?.removeEventListener('abort', onAbort);
        this.cancel = this.resumeLoop = null;
        resolve();
      };
      const onAbort = () => {
        if (handle) cancelAnimationFrame(handle);
        handle = 0;
        finish();
      };
      signal?.addEventListener('abort', onAbort, { once: true });
      const frame = (now: number) => {
        handle = 0;
        if (this.paused) {
          last = null;
          return;
        }
        const dt = last === null ? FIRST_DT : Math.min(MAX_DT, now - last);
        last = now;
        if (dt > 0 && !step(dt)) {
          finish();
          return;
        }
        handle = requestAnimationFrame(frame);
      };
      this.resumeLoop = () => {
        if (!handle) handle = requestAnimationFrame(frame);
      };
      this.cancel = onAbort;
      handle = requestAnimationFrame(frame);
    });
  }
}

export class ManualClock implements Clock {
  framesRun = 0;
  constructor(readonly frameMs = 1000 / 60) {}

  async run(step: (dt: number) => boolean, signal?: AbortSignal): Promise<void> {
    for (let i = 0; i < MAX_FRAMES; i++) {
      if (signal?.aborted) return;
      this.framesRun++;
      if (!step(this.frameMs)) return;
    }
    throw new Error(`ManualClock exceeded ${MAX_FRAMES} frames`);
  }
}
