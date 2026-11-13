import { describe, expect, test } from 'vitest';
import { selectE2eGames } from '../e2e/helpers';

describe('selectE2eGames', () => {
  const games = ['bar', 'foo', 'jump', 'other'];

  test('GAME overrides full and GAMES', () => {
    expect(selectE2eGames(games, { GAME: 'foo', GAMES: 'bar', TEST_DEPTH: 'full' })).toEqual(['foo']);
    expect(selectE2eGames(games, { GAME: 'missing' })).toEqual([]);
  });

  test('full selects every game', () => {
    expect(selectE2eGames(games, { TEST_DEPTH: 'full', GAMES: 'foo' })).toEqual(games);
  });

  test('smoke selects jump by default', () => {
    expect(selectE2eGames(games, {})).toEqual(['jump']);
  });

  test('smoke adds known GAMES in discovery order', () => {
    expect(selectE2eGames(games, { GAMES: 'foo, bar, missing, foo, ' })).toEqual(['bar', 'foo', 'jump']);
  });

  test('smoke handles a missing canary', () => {
    expect(selectE2eGames(['foo', 'bar'], {})).toEqual([]);
    expect(selectE2eGames(['foo', 'bar'], { GAMES: 'bar' })).toEqual(['bar']);
  });
});
