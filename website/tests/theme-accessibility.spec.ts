import { expect, test, type Locator, type Page } from '@playwright/test';

type Box = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

type HeroLayout = {
  heroDisplay: string;
  heroDirection: string;
  containerDisplay: string;
  containerDirection: string;
  titleFontSize: number;
  headingCount: number;
  visibleImageCount: number;
  horizontalOverflow: number;
  viewportHeight: number;
  hero: Box;
  container: Box;
  image: Box;
  actions: Box;
};

async function readHeroLayout(page: Page): Promise<HeroLayout> {
  const hero = page.locator('.rp-home-hero');
  await expect(hero).toBeVisible();
  await expect(page.locator('.rp-home-hero__image-img:visible')).toHaveCount(1);

  return page.evaluate(() => {
    const getRequiredElement = (selector: string): HTMLElement => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing homepage element: ${selector}`);
      return element;
    };
    const getBox = (element: HTMLElement): Box => {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height
      };
    };

    const heroElement = getRequiredElement('.rp-home-hero');
    const containerElement = getRequiredElement('.rp-home-hero__container');
    const titleElement = getRequiredElement('.rp-home-hero__title');
    const imageElement = getRequiredElement('.rp-home-hero__image');
    const actionsElement = getRequiredElement('.rp-home-hero__actions');
    const heroStyle = getComputedStyle(heroElement);
    const containerStyle = getComputedStyle(containerElement);
    const titleStyle = getComputedStyle(titleElement);
    const visibleImageCount = Array.from(
      document.querySelectorAll<HTMLElement>('.rp-home-hero__image-img')
    ).filter(element => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    }).length;

    return {
      heroDisplay: heroStyle.display,
      heroDirection: heroStyle.flexDirection,
      containerDisplay: containerStyle.display,
      containerDirection: containerStyle.flexDirection,
      titleFontSize: Number.parseFloat(titleStyle.fontSize),
      headingCount: document.querySelectorAll('h1').length,
      visibleImageCount,
      horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
      viewportHeight: window.innerHeight,
      hero: getBox(heroElement),
      container: getBox(containerElement),
      image: getBox(imageElement),
      actions: getBox(actionsElement)
    };
  });
}

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

for (const scenario of [
  { name: 'English light', route: './', colorScheme: 'light' as const },
  { name: 'Chinese dark', route: './zh/', colorScheme: 'dark' as const }
]) {
  test(`${scenario.name} desktop homepage keeps the two-column hero geometry`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: scenario.colorScheme });
    await page.goto(scenario.route);

    const layout = await readHeroLayout(page);

    expect(layout.heroDisplay).toBe('flex');
    expect(layout.heroDirection).toBe('row');
    expect(layout.containerDisplay).toBe('flex');
    expect(layout.containerDirection).toBe('column');
    expect(layout.titleFontSize).toBeGreaterThanOrEqual(56);
    expect(layout.headingCount).toBe(1);
    expect(layout.visibleImageCount).toBe(1);
    expect(layout.horizontalOverflow).toBeLessThanOrEqual(0);
    expect(layout.container.right).toBeLessThanOrEqual(layout.image.left + 1);
    expect(layout.image.left).toBeGreaterThan(layout.container.left);
    expect(layout.image.right).toBeLessThanOrEqual(layout.hero.right + 1);
    expect(layout.image.top).toBeLessThan(layout.viewportHeight);
    expect(layout.actions.bottom).toBeLessThan(layout.viewportHeight);
  });
}

for (const scenario of [
  { name: 'English dark', route: './', colorScheme: 'dark' as const },
  { name: 'Chinese light', route: './zh/', colorScheme: 'light' as const }
]) {
  test(`${scenario.name} mobile homepage keeps the stacked hero geometry`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: scenario.colorScheme });
    await page.goto(scenario.route);

    const layout = await readHeroLayout(page);

    expect(layout.heroDisplay).toBe('flex');
    expect(layout.heroDirection).toBe('column-reverse');
    expect(layout.containerDisplay).toBe('flex');
    expect(layout.containerDirection).toBe('column');
    expect(layout.titleFontSize).toBeGreaterThanOrEqual(36);
    expect(layout.titleFontSize).toBeLessThanOrEqual(48);
    expect(layout.headingCount).toBe(1);
    expect(layout.visibleImageCount).toBe(1);
    expect(layout.horizontalOverflow).toBeLessThanOrEqual(0);
    expect(layout.image.bottom).toBeLessThanOrEqual(layout.container.top + 1);
    expect(layout.image.left).toBeGreaterThanOrEqual(layout.hero.left);
    expect(layout.image.right).toBeLessThanOrEqual(layout.hero.right + 1);
    expect(layout.actions.left).toBeGreaterThanOrEqual(layout.hero.left);
    expect(layout.actions.right).toBeLessThanOrEqual(layout.hero.right + 1);
  });
}
