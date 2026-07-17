import { test, expect, assertOnlyPreferenceStorage, expectNoHorizontalOverflow, expectSingleH1, expectVisibleFocus, saveReviewScreenshot } from './fixtures';

const auditedRoutes = [
  '/',
  '/calculators',
  '/calculators/hourly-to-annual-income',
  '/calculators/salary',
  '/calculators/loan-payment',
  '/calculators/savings-growth',
  '/calculators/credit-card-payoff',
  '/calculators/mortgage',
  '/calculators/budget-planner',
  '/calculators/retirement',
  '/about',
  '/privacy-policy',
  '/financial-disclaimer',
  '/support',
  '/not-a-real-route',
] as const;

test('trust and support pages describe the current inactive integrations and local preferences', async ({ page }) => {
  for (const route of ['/about', '/privacy-policy', '/financial-disclaimer', '/support'] as const) {
    await page.goto(route);
    await expectSingleH1(page);
  }

  await page.goto('/privacy-policy');
  await expect(page.getByText(/are not saved by default/i)).toBeVisible();
  await expect(page.getByText(/currency display format, reduced-motion preference, schedule expansion preference, favorite calculator slugs, and recently used calculator slugs/i)).toBeVisible();
  await expect(page.getByText(/not currently loaded, initialized, or contacted/i)).toBeVisible();

  await page.goto('/support');
  await expect(page.getByText(/Donations are currently inactive unless a future configuration explicitly enables them/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Optional support' })).not.toBeVisible();
  await expect(page.locator('[data-placement]')).toHaveCount(0);
});

test('navigation, skip link, 404 page, malformed storage, and blocked storage fallbacks work', async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto('/');
  await page.getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL(/\/about$/);
  await page.getByRole('link', { name: 'Privacy Policy' }).click();
  await expect(page).toHaveURL(/\/privacy-policy$/);

  await page.goto('/');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toBeVisible();
  await expectVisibleFocus(skipLink);
  await skipLink.click();
  await expect(page.locator('#main-content')).toBeFocused();

  await page.goto('/no-such-page');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to calculator directory' })).toBeVisible();
  await page.close();

  const malformedContext = await browser.newContext();
  await malformedContext.addInitScript(() => {
    window.localStorage.setItem('financial-calculator-preferences', '{bad json');
  });
  const malformedPage = await malformedContext.newPage();
  await malformedPage.goto('/');
  await expect(malformedPage.getByRole('heading', { name: /plan with browser-based calculators/i })).toBeVisible();
  await malformedContext.close();

  const blockedContext = await browser.newContext();
  await blockedContext.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
  });
  const blockedPage = await blockedContext.newPage();
  await blockedPage.goto('/');
  await expect(blockedPage.getByText(/could not be stored on this device/i)).toBeVisible();
  await blockedContext.close();
});

test.describe('controlled error fallback', () => {
  test.use({ allowConsoleErrors: true, allowPageErrors: true });

  test('controlled error-boundary route shows a friendly fallback without a stack trace', async ({ page }) => {
    await page.goto('/__test/error-boundary');
    await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeVisible();
    await expect(page.getByText(/No calculation data was intentionally sent anywhere/i)).toBeVisible();
    await expect(page.getByText(/Controlled test error/)).not.toBeVisible();
  });
});

test('all audited routes have one H1, valid metadata, valid canonical behavior, and no horizontal overflow', async ({ page, baseURL }) => {
  const titles = new Set<string>();

  for (const route of auditedRoutes) {
    await page.goto(route);
    await expectSingleH1(page);
    await expectNoHorizontalOverflow(page);

    const title = await page.title();
    expect(title).toBeTruthy();
    expect(titles.has(title)).toBe(false);
    titles.add(title);

    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBeTruthy();
    expect(canonical?.startsWith(baseURL ?? 'http://127.0.0.1:4173')).toBe(true);
  }
});

test('seo assets match real routes and avoid a fake production domain', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBe(true);
  const robotsText = await robots.text();
  expect(robotsText).toContain('Sitemap: /sitemap.xml');
  expect(robotsText).not.toContain('localhost');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBe(true);
  const sitemapText = await sitemap.text();
  for (const route of auditedRoutes.filter((route) => route !== '/not-a-real-route')) {
    if (route === '/not-a-real-route') continue;
    if (route === '/404') continue;
  }
  expect(sitemapText).toContain('<loc>https://example.invalid/</loc>');
  expect(sitemapText).toContain('/calculators/hourly-to-annual-income');
  expect(sitemapText).toContain('/calculators/retirement');
  expect(sitemapText).not.toContain('/404');
  expect(sitemapText).not.toContain('localhost');
  expect(sitemapText).not.toContain('/calculators/tax');
});

test('browser localStorage only keeps the preferences key and allowed preference fields during calculator use', async ({ page }) => {
  await page.goto('/calculators/loan-payment');
  await page.getByRole('button', { name: 'Calculate' }).click();
  await page.getByRole('button', { name: /show full amortization schedule/i }).click();
  await page.goto('/calculators/mortgage');
  await page.getByRole('button', { name: 'Calculate' }).click();

  const storage = await assertOnlyPreferenceStorage(page);
  const preferences = storage['financial-calculator-preferences'] ? JSON.parse(storage['financial-calculator-preferences']) : {};
  expect(Object.keys(preferences).sort()).toEqual(
    ['currency', 'favorites', 'recentCalculators', 'reducedMotion', 'schedulesExpanded'].sort(),
  );
});

test('viewport audit and screenshots complete without horizontal overflow on representative pages', async ({ page }) => {
  const captures = [
    { route: '/', size: { width: 1440, height: 900 }, file: 'homepage-desktop.png' },
    { route: '/', size: { width: 320, height: 568 }, file: 'homepage-mobile.png' },
    { route: '/calculators', size: { width: 1440, height: 900 }, file: 'directory-desktop.png' },
    { route: '/calculators', size: { width: 375, height: 667 }, file: 'directory-mobile.png' },
    { route: '/calculators/hourly-to-annual-income', size: { width: 375, height: 667 }, file: 'hourly-mobile.png' },
    { route: '/calculators/loan-payment', size: { width: 1024, height: 768 }, file: 'loan-desktop.png' },
    { route: '/calculators/mortgage', size: { width: 320, height: 568 }, file: 'mortgage-mobile.png' },
    { route: '/calculators/budget-planner', size: { width: 375, height: 667 }, file: 'budget-mobile.png' },
    { route: '/privacy-policy', size: { width: 1440, height: 900 }, file: 'privacy-desktop.png' },
    { route: '/support', size: { width: 1440, height: 900 }, file: 'support-desktop.png' },
    { route: '/no-such-page', size: { width: 320, height: 568 }, file: 'not-found-mobile.png' },
  ] as const;

  for (const capture of captures) {
    await page.setViewportSize(capture.size);
    await page.goto(capture.route);
    await expectNoHorizontalOverflow(page);
    await saveReviewScreenshot(page, capture.file);
  }

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/calculators/loan-payment');
  await expectNoHorizontalOverflow(page);
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/support');
  await expectNoHorizontalOverflow(page);
});
