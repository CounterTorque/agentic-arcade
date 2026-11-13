import type { Page } from '@playwright/test';

export const SMOKE_GAMES = ['jump'];

export function selectE2eGames(all: string[], env: { GAME?: string; GAMES?: string; TEST_DEPTH?: string }): string[] {
  if (env.GAME) return all.filter((id) => id === env.GAME);
  if (env.TEST_DEPTH === 'full') return all;
  const selected = new Set([...SMOKE_GAMES, ...(env.GAMES ?? '').split(',').map((id) => id.trim()).filter(Boolean)]);
  return all.filter((id) => selected.has(id));
}

export function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  return errors;
}
