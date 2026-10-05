import type { Difficulty, RoundResult } from '@arcade/sdk';
import type { RegistryEntry } from '../registry';
import { difficultyForRound } from './difficulty';
import { createRng } from './rng';

export interface SessionOptions {
  entries: RegistryEntry[];
  seed: number;
  lives?: number;
}

export class Session {
  lives: number;
  score = 0;
  round = 0;
  readonly benched = new Set<string>();
  private readonly entries: RegistryEntry[];
  private readonly rng: ReturnType<typeof createRng>;
  private bag: RegistryEntry[] = [];
  private lastId: string | null = null;

  constructor({ entries, seed, lives = 4 }: SessionOptions) {
    this.entries = entries.filter((e) => e.manifest.enabled !== false);
    this.rng = createRng(seed);
    this.lives = lives;
  }

  private playable(): RegistryEntry[] {
    return this.entries.filter((e) => !this.benched.has(e.id));
  }

  get over(): boolean {
    return this.lives <= 0 || this.playable().length === 0;
  }

  next(): { entry: RegistryEntry; difficulty: Difficulty; seed: number } {
    this.bag = this.bag.filter((e) => !this.benched.has(e.id));
    if (this.bag.length === 0) {
      const pool = this.playable();
      if (pool.length === 0) throw new Error('no playable games');
      for (let i = pool.length - 1; i > 0; i--) {
        const j = this.rng.int(0, i);
        [pool[i], pool[j]] = [pool[j]!, pool[i]!];
      }
      if (pool.length > 1 && pool[0]!.id === this.lastId) {
        const j = this.rng.int(1, pool.length - 1);
        [pool[0], pool[j]] = [pool[j]!, pool[0]!];
      }
      this.bag = pool;
    }
    const entry = this.bag.shift()!;
    this.lastId = entry.id;
    return { entry, difficulty: difficultyForRound(this.round), seed: Math.floor(this.rng.next() * 2 ** 32) };
  }

  record(result: RoundResult): void {
    if (result.kind === 'error') {
      this.benched.add(result.gameId);
      return;
    }
    if (result.kind === 'win') this.score++;
    else this.lives--;
    this.round++;
  }
}
