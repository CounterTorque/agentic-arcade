import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import { trackErrors } from './helpers';

const gamesDir = 'src/games';
const ids = fs.existsSync(gamesDir)
  ? fs
      .readdirSync(gamesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && fs.existsSync(`${gamesDir}/${d.name}/manifest.ts`))
      .map((d) => d.name)
  : [];

for (const id of ids) {
  test(`game ${id} plays a round without errors`, async ({ page }, testInfo) => {
    test.setTimeout(45_000);
    const errors = trackErrors(page);
    await page.goto(`./#/play/${id}?seed=1`);
    await page.waitForFunction(() => window.__ARCADE__?.phase === 'play' || window.__ARCADE__?.lastRound, undefined, { timeout: 20_000 });
    if (await page.evaluate(() => window.__ARCADE__?.phase === 'play')) {
      await testInfo.attach('mid-round', { body: await page.screenshot(), contentType: 'image/png' });
    }
    await page.waitForFunction(() => window.__ARCADE__?.lastRound, undefined, { timeout: 20_000 });
    const round = await page.evaluate(() => {
      const r = window.__ARCADE__!.lastRound!;
      return { kind: r.kind, message: r.kind === 'error' ? String((r.error as Error)?.message ?? r.error) : '' };
    });
    expect(round.kind, round.message).not.toBe('error');
    expect(errors).toEqual([]);
  });
}
