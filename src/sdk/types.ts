export const CONTRACT_VERSION = 1 as const;

/** Logical stage size. Games always draw in this coordinate space. */
export const STAGE_WIDTH = 960;
export const STAGE_HEIGHT = 720; // 4:3

export type Outcome = 'win' | 'lose';
export type ControlScheme = 'action' | 'directions' | 'pointer';
export type InputAction = 'action' | 'up' | 'down' | 'left' | 'right';
export type LifecyclePhase =
  | 'load' | 'preload' | 'create' | 'start' | 'play' | 'end' | 'settle' | 'destroy';

// ---------- Manifest (src/games/<id>/manifest.ts, export const manifest) ----------
export interface GameManifest {
  /** Must equal CONTRACT_VERSION. */
  contractVersion: typeof CONTRACT_VERSION;
  /** Must equal the directory name. /^[a-z][a-z0-9-]{1,30}$/ */
  id: string;
  /** Display name, 1–24 chars. */
  title: string;
  /** The one-word imperative flashed before play, e.g. "JUMP!". /^[A-Z][A-Z !?]{0,11}$/ */
  verb: string;
  /** ≤ 140 chars, shown in the gallery. */
  description: string;
  /** Which inputs the game reads. Non-empty. Declared input intent. */
  controls: readonly ControlScheme[];
  /** Short player-facing controls line: keys/buttons, then the action in parentheses,
   *  e.g. 'Space/Click (Jump)' or 'Arrows (Move), Space (Fire)'. ≤ 48 chars. */
  controlHint: string;
  /** Round length at speed 1.0, integer ms in [3000, 8000]. Host scales it. */
  baseDurationMs: number;
  /** Result if the timer expires before the game calls resolve(). */
  outcomeOnTimeout: Outcome;
  /** ≤ 5 kebab-case tags. */
  tags?: readonly string[];
  /** false = excluded from sessions (still in the gallery, marked WIP). Default true. */
  enabled?: boolean;
}

// ---------- Values the host passes in ----------
export interface Difficulty {
  /** Tempo multiplier, 1.0 – 2.5. Scale your game's motion by this. */
  readonly speed: number;
  /** Content tier. Use it to add hazards or complexity, not just speed. */
  readonly level: 1 | 2 | 3;
  /** 0-based count of completed rounds in this session (0 in practice mode). */
  readonly round: number;
}

export interface Stage {
  readonly width: typeof STAGE_WIDTH;
  readonly height: typeof STAGE_HEIGHT;
  /** CSS pixels per logical pixel (changes on resize). Only needed for raw canvas work. */
  readonly scale: number;
}

export interface FrameInfo {
  /** ms since the previous tick, clamped to (0, 50]. */
  readonly dt: number;
  /** ms of play time since start() (frozen during settle). */
  readonly elapsed: number;
  /** ms until timeout (0 during settle). */
  readonly remaining: number;
  /** 'play' until resolved; 'settle' for ~800 ms after end(). */
  readonly phase: 'play' | 'settle';
}

export interface PointerState {
  /** Stage coordinates (0..960, 0..720). */
  readonly x: number;
  readonly y: number;
  readonly down: boolean;
  /** Pointer is currently over the stage. */
  readonly inside: boolean;
}

export interface InputApi {
  /** Held this frame. */
  isDown(action: InputAction): boolean;
  /** Went down at least once since the previous tick (latched, so short taps are never lost). */
  wasPressed(action: InputAction): boolean;
  /** Went up at least once since the previous tick. */
  wasReleased(action: InputAction): boolean;
  readonly pointer: PointerState;
}

export interface Rng {
  /** [0, 1) */
  next(): number;
  /** Integer in [min, max]. */
  int(min: number, max: number): number;
  /** Float in [min, max). */
  range(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  chance(probability: number): boolean;
}

export interface PreloadContext {
  /** Resolves when the image is decoded. Rejects on error or abort. */
  loadImage(url: string): Promise<HTMLImageElement>;
  readonly difficulty: Difficulty;
  readonly rng: Rng;
  readonly signal: AbortSignal;
}

export interface CanvasHandle {
  readonly canvas: HTMLCanvasElement;
  /** Pre-transformed: draw in logical stage coordinates. */
  readonly g: CanvasRenderingContext2D;
}

export interface GameContext {
  /** Game-owned container. Exactly 960×720 logical px, overflow hidden, CSS-contained.
   *  Has data-game="<id>". The host empties it after destroy(). */
  readonly root: HTMLDivElement;
  readonly stage: Stage;
  readonly difficulty: Difficulty;
  /** Already scaled by difficulty.speed. */
  readonly timeLimitMs: number;
  readonly input: InputApi;
  /** Seeded; the same seed always gives the same sequence. Use this instead of Math.random. */
  readonly rng: Rng;
  /** Aborted at teardown. Pass to every addEventListener call inside root. */
  readonly signal: AbortSignal;
  /** Report the outcome. First call wins; later calls and calls outside 'play' are ignored. */
  resolve(outcome: Outcome): void;
  /** Current resolution, or null. */
  readonly resolved: Outcome | null;
  /** Creates a full-stage canvas inside root, HiDPI-aware and resize-aware. */
  createCanvas(options?: { pixelArt?: boolean }): CanvasHandle;
  /** User prefers reduced motion: skip shakes and flashes. */
  readonly reducedMotion: boolean;
}

// ---------- What the game returns ----------
export interface GameInstance {
  /** The intro ended and the timer starts now. Optional. */
  start?(): void;
  /** Called once per frame during 'play' and 'settle'. Required. */
  tick(frame: FrameInfo): void;
  /** Called exactly once with the final outcome. Show freeze or celebration poses here. */
  end?(outcome: Outcome, via: 'game' | 'timeout'): void;
  /** Release anything not tied to ctx.signal or ctx.root. Optional. */
  destroy?(): void;
}

// ---------- The module (src/games/<id>/index.ts, export default) ----------
export interface MicroGame<A = void> {
  contractVersion: typeof CONTRACT_VERSION;
  /** Load assets before the round. ≤ 3000 ms. The return value is passed to create(). */
  preload?(ctx: PreloadContext): Promise<A>;
  /** Build initial DOM and state, draw the first frame, return the instance. Must be synchronous. */
  create(ctx: GameContext, assets: A): GameInstance;
}

// ---------- Host-side result (games never construct this) ----------
export type RoundResult =
  | { kind: Outcome; via: 'game' | 'timeout'; elapsedMs: number; gameId: string }
  | { kind: 'error'; phase: LifecyclePhase; error: unknown; elapsedMs: number; gameId: string };

/** Identity helpers for inference and autocompletion. */
export const defineGame = <A = void>(game: MicroGame<A>): MicroGame<A> => game;
export const defineManifest = <M extends GameManifest>(m: M): M => m;
