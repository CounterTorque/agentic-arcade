import { describe, expect, it } from 'vitest';
import { findDuplicateTitles, validateManifest } from '../../src/framework/manifest-schema';

const valid = {
  contractVersion: 1,
  id: 'my-game',
  title: 'My Game',
  verb: 'JUMP!',
  description: 'desc',
  controlHint: 'Space/Click (Jump)',
  controls: ['action'],
  baseDurationMs: 5000,
  outcomeOnTimeout: 'win',
};
const errs = (patch: Record<string, unknown>) => validateManifest({ ...valid, ...patch }, 'my-game');

describe('validateManifest', () => {
  it('accepts a valid manifest', () => {
    expect(errs({})).toEqual([]);
    expect(errs({ tags: ['a', 'b-c'], enabled: false })).toEqual([]);
    expect(errs({ controlHint: 'Arrows (Move), Space (Fire)' })).toEqual([]);
  });

  it.each([
    ['non-object', null],
  ])('%s', (_n, m) => expect(validateManifest(m, 'x').length).toBe(1));

  it.each<[string, Record<string, unknown>]>([
    ['contractVersion', { contractVersion: 2 }],
    ['id format', { id: 'My_Game' }],
    ['id/dir mismatch', { id: 'other-game' }],
    ['id too short', { id: 'a' }],
    ['empty title', { title: '' }],
    ['long title', { title: 'x'.repeat(25) }],
    ['lowercase verb', { verb: 'jump!' }],
    ['long verb', { verb: 'ABCDEFGHIJKLM' }],
    ['empty description', { description: ' ' }],
    ['long description', { description: 'x'.repeat(141) }],
    ['missing controlHint', { controlHint: undefined }],
    ['empty controlHint', { controlHint: '' }],
    ['too long controlHint', { controlHint: `Space (${'x'.repeat(48)})` }],
    ['controlHint without parentheses', { controlHint: 'Arrows' }],
    ['controlHint with empty parentheses', { controlHint: 'Arrows ()' }],
    ['controlHint without a key before parentheses', { controlHint: '(Move)' }],
    ['no controls', { controls: [] }],
    ['unknown control', { controls: ['keyboard'] }],
    ['duplicate controls', { controls: ['action', 'action'] }],
    ['duration low', { baseDurationMs: 2999 }],
    ['duration high', { baseDurationMs: 8001 }],
    ['duration float', { baseDurationMs: 4000.5 }],
    ['bad timeout outcome', { outcomeOnTimeout: 'draw' }],
    ['too many tags', { tags: ['a', 'b', 'c', 'd', 'e', 'f'] }],
    ['non-kebab tag', { tags: ['Bad Tag'] }],
    ['enabled type', { enabled: 'yes' }],
  ])('rejects %s', (_n, patch) => {
    expect(errs(patch).length).toBeGreaterThan(0);
  });
});

describe('controlHint message', () => {
  it('shows the expected format with an example', () => {
    expect(errs({ controlHint: 'Arrows' }).join(' ')).toContain("e.g. 'Space/Click (Jump)'");
  });
});

describe('findDuplicateTitles', () => {
  it('finds case-insensitive duplicates', () => {
    expect(findDuplicateTitles([{ title: 'Jump' }, { title: 'Run' }, { title: 'jump' }])).toEqual(['jump']);
    expect(findDuplicateTitles([{ title: 'A' }, { title: 'B' }])).toEqual([]);
  });
});
