export const SAVE_KEY = 'agentic-arcade:save';
export const SCHEMA_VERSION = 1;

export interface SaveV1 {
  schemaVersion: 1;
  highScore: number;
  sessionsPlayed: number;
  perGame: Record<string, { plays: number; wins: number; errors: number }>;
  settings: { reducedMotion: 'system' | 'on' | 'off' };
}

type Backend = Pick<Storage, 'getItem' | 'setItem'>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Migrations = Record<number, (old: any) => any>;

export const MIGRATIONS: Migrations = {};

export const defaultSave = (): SaveV1 => ({
  schemaVersion: 1,
  highScore: 0,
  sessionsPlayed: 0,
  perGame: {},
  settings: { reducedMotion: 'system' },
});

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function isSaveShape(v: unknown): v is SaveV1 {
  if (!isRecord(v) || !isRecord(v.perGame) || !isRecord(v.settings)) return false;
  return (
    typeof v.highScore === 'number' &&
    typeof v.sessionsPlayed === 'number' &&
    ['system', 'on', 'off'].includes(v.settings.reducedMotion as string) &&
    Object.values(v.perGame).every(
      (g) => isRecord(g) && typeof g.plays === 'number' && typeof g.wins === 'number' && typeof g.errors === 'number',
    )
  );
}

function defaultBackend(): Backend | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export interface SaveStore {
  readonly data: Readonly<SaveV1>;
  update(fn: (draft: SaveV1) => void): void;
  readonly readOnly: boolean;
  readonly persistent: boolean;
}

export function createSaveStore(backend: Backend | undefined = defaultBackend(), migrations: Migrations = MIGRATIONS): SaveStore {
  let data = defaultSave();
  let readOnly = false;
  let persistent = backend !== undefined;
  let warned = false;
  const warnOnce = (msg: string, err?: unknown) => {
    if (warned) return;
    warned = true;
    console.warn(`[arcade] ${msg}`, err ?? '');
  };

  const backup = (raw: string) => {
    try {
      backend!.setItem(`${SAVE_KEY}.corrupt-${Date.now()}`, raw);
    } catch {
      /* best effort */
    }
  };

  const load = () => {
    if (!backend) return;
    let raw: string | null;
    try {
      raw = backend.getItem(SAVE_KEY);
    } catch (err) {
      persistent = false;
      warnOnce('localStorage unavailable; progress will not persist', err);
      return;
    }
    if (raw === null) return;
    try {
      let parsed: unknown = JSON.parse(raw);
      if (!isRecord(parsed) || !Number.isInteger(parsed.schemaVersion) || (parsed.schemaVersion as number) < 0)
        throw new Error('bad schemaVersion');
      let version = parsed.schemaVersion as number;
      if (version > SCHEMA_VERSION) {
        if (!isSaveShape(parsed)) throw new Error('bad shape');
        data = parsed;
        readOnly = true;
        return;
      }
      while (version < SCHEMA_VERSION) {
        const migrate = migrations[version];
        if (!migrate) throw new Error(`no migration from v${version}`);
        parsed = migrate(parsed);
        version++;
        (parsed as Record<string, unknown>).schemaVersion = version;
      }
      if (!isSaveShape(parsed)) throw new Error('bad shape');
      data = parsed;
    } catch {
      backup(raw);
    }
  };
  load();

  return {
    get data() {
      return data;
    },
    get readOnly() {
      return readOnly;
    },
    get persistent() {
      return persistent && !readOnly;
    },
    update(fn) {
      const draft = structuredClone(data);
      fn(draft);
      data = draft;
      if (readOnly || !backend || !persistent) return;
      try {
        backend.setItem(SAVE_KEY, JSON.stringify(data));
      } catch (err) {
        persistent = false;
        warnOnce('could not write save; keeping progress in memory', err);
      }
    },
  };
}
