import { expect, test } from '@playwright/test';
import { trackErrors } from './helpers';

test('lobby renders with Play focused', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Agentic Arcade' })).toBeVisible();
  await expect(page.getByTestId('play')).toBeFocused();
  await expect(page.getByTestId('best-score')).toHaveText('0');
  expect(errors).toEqual([]);
});

test('unknown routes fall back to the lobby', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('./#/nope/at/all');
  await expect(page.getByRole('heading', { name: 'Agentic Arcade' })).toBeVisible();
  expect(page.url()).toMatch(/#\/$/);
  expect(errors).toEqual([]);
});

test('gallery lists every registered game', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('./#/gallery');
  await expect(page.getByRole('heading', { name: 'Gallery' })).toBeVisible();
  const shown = await page.getByTestId('game-card').evaluateAll((els) => els.map((e) => e.getAttribute('data-id')).sort());
  const registered = await page.evaluate(() => [...window.__ARCADE__!.games].sort());
  expect(registered.length).toBeGreaterThan(0);
  expect(shown).toEqual(registered);
  expect(errors).toEqual([]);
});

test('practice shows a not-found page for unknown ids', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('./#/play/definitely-missing');
  await expect(page.getByRole('heading', { name: 'Game not found' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to gallery' }).click();
  await expect(page.getByRole('heading', { name: 'Gallery' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Esc pauses a round and resumes it', async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto('./#/play/jump?seed=1');
  await page.waitForFunction(() => window.__ARCADE__?.phase === 'play');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('paused')).toBeVisible();
  const frozen = await page.getByTestId('timer').evaluate((el) => (el as HTMLElement).style.width);
  await page.waitForTimeout(400);
  expect(await page.getByTestId('timer').evaluate((el) => (el as HTMLElement).style.width)).toBe(frozen);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('paused')).toBeHidden();
  expect(errors).toEqual([]);
});

test('an idle session ends in game over and persists the result', async ({ page }) => {
  test.setTimeout(120_000);
  const errors = trackErrors(page);
  await page.goto('./#/session?seed=1');
  await expect(page.getByTestId('intermission')).toBeVisible();
  await expect(page.getByTestId('gameover')).toBeVisible({ timeout: 90_000 });
  const score = (await page.getByTestId('final-score').textContent())!.trim();

  await page.goto('./#/');
  await page.reload();
  await expect(page.getByTestId('best-score')).toHaveText(score);
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('agentic-arcade:save')!));
  expect(save.sessionsPlayed).toBe(1);
  expect(save.highScore).toBe(Number(score));
  expect(save.perGame.jump.plays).toBeGreaterThanOrEqual(4);
  expect(errors).toEqual([]);
});
