import { expect, test } from '@playwright/test';

test('placeholder app loads without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Agentic Arcade' })).toBeVisible();
  await expect(page.getByTestId('stage')).toBeVisible();
  expect(errors).toEqual([]);
});
