import { expect, test, type Locator, type Page } from '@playwright/test';

async function openMobileNavigation(page: Page): Promise<void> {
  await page.locator('.rp-nav-hamburger__sm:visible').click();
  await expect(page.locator('.rp-nav-screen--open')).toBeVisible();
}

async function tabTo(page: Page, target: Locator): Promise<void> {
  for (let step = 0; step < 40; step += 1) {
    await page.keyboard.press('Tab');
    if (await target.evaluate(element => element === document.activeElement)) return;
  }

  throw new Error('Theme switch was not reachable within 40 Tab steps');
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.addInitScript(() => localStorage.clear());
});

test('mobile theme switch keeps keyboard and pressed-state semantics', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));

  await page.goto('./');
  await openMobileNavigation(page);

  const themeSwitch = page.getByRole('button', { name: 'Dark theme' });
  await expect(themeSwitch).toBeVisible();
  await expect(themeSwitch).toHaveAttribute('aria-pressed', 'false');
  await tabTo(page, themeSwitch);

  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveClass(/\bdark\b/);
  await expect(themeSwitch).toHaveAttribute('aria-pressed', 'true');

  await page.keyboard.press('Space');
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  await expect(themeSwitch).toHaveAttribute('aria-pressed', 'false');
  expect(pageErrors).toEqual([]);
});

test('Chinese page exposes the localized theme-switch name', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', error => pageErrors.push(error));

  await page.goto('./zh/');
  await openMobileNavigation(page);

  const themeSwitch = page.getByRole('button', { name: '深色主题' });
  await expect(themeSwitch).toBeVisible();
  await expect(themeSwitch).toHaveAttribute('aria-pressed', 'false');
  expect(pageErrors).toEqual([]);
});
