import { expect, test } from '@playwright/test';

test('idle jump loses by being hit', async ({ page }) => {
  test.setTimeout(30_000);
  await page.goto('./#/play/jump?seed=1');
  await page.waitForFunction(() => window.__ARCADE__?.lastRound, undefined, { timeout: 20_000 });
  const round = await page.evaluate(() => {
    const r = window.__ARCADE__!.lastRound!;
    return { kind: r.kind, via: r.kind === 'error' ? null : r.via };
  });
  expect(round).toEqual({ kind: 'lose', via: 'game' });
});
