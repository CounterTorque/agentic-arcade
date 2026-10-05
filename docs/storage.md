# Storage

Persistence is owned by `src/framework/storage.ts`; games have no storage access. The app uses one store, `src/app/save.ts` (`save`).

- **Key:** `agentic-arcade:save` (one JSON document in `localStorage`).
- **Writes:** one `JSON.stringify` per `save.update(...)`. Session results are written once at game over; Practice writes after each round; settings write on change. Nothing is written per frame.

## Schema (`SaveV1`, `schemaVersion: 1`)

```ts
interface SaveV1 {
  schemaVersion: 1;
  highScore: number;                  // best session score (wins)
  sessionsPlayed: number;             // finished sessions (game over reached)
  perGame: Record<string, { plays: number; wins: number; errors: number }>; // unknown ids are preserved
  settings: { reducedMotion: 'system' | 'on' | 'off' };
}
```

## API

`createSaveStore(backend?, migrations?)` returns `{ data, update(fn), readOnly, persistent }`. `data` is a snapshot object that is replaced on each update (clone-on-write); `update` hands `fn` a draft copy. `backend` defaults to `globalThis.localStorage` (guarded by try/catch).

## Migrations

`MIGRATIONS: Record<number, (old) => new>` maps version N to N+1 and is applied in order on load; `schemaVersion` is stamped after each step. To change the schema:

1. Bump `SCHEMA_VERSION` and the `SaveV1` type (add a new interface if the shape changes), update `defaultSave()` and the shape check.
2. Add `MIGRATIONS[N]` converting vN to vN+1.
3. Add a unit test in `tests/unit/storage.test.ts` with a vN fixture.
4. Record an ADR in `docs/adr/`.

## Failure behavior

| Situation | Behavior |
|---|---|
| `localStorage` missing, or `getItem` throws (privacy mode, `SecurityError`) | in-memory store for the page lifetime; `console.warn` once; `persistent` is false and the Lobby shows a notice |
| Corrupt JSON, bad `schemaVersion`, wrong shape, or a missing migration | raw string copied to `agentic-arcade:save.corrupt-<Date.now()>`, then defaults |
| `schemaVersion` newer than known (e.g. after a rollback) | loaded into memory as read-only (`readOnly: true`); never written back |
| `setItem` throws (e.g. `QuotaExceededError`) | state kept in memory; warns once; `persistent` becomes false |
| Several tabs | last write wins; no `storage` event sync |
