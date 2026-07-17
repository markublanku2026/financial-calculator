import { test, expect, expectNoHorizontalOverflow, expectSingleH1 } from './fixtures';

test('homepage search, reset, recommendations, and headings work', async ({ page }) => {
  await page.goto('/');
  await expectSingleH1(page);
  await expect(page.getByRole('heading', { name: /plan with browser-based calculators/i })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open calculator' }).first()).toBeVisible();

  const search = page.getByLabel('Search by name, category, keyword, or common term');
  await search.fill('home loan');
  await expect(page.getByRole('heading', { name: 'Mortgage Calculator', exact: true })).toBeVisible();

  await search.fill('annual pay');
  await expect(page.getByRole('heading', { name: 'Salary Calculator', exact: true })).toBeVisible();

  await search.fill('pension planning');
  await expect(page.getByRole('heading', { name: 'Retirement Calculator', exact: true })).toBeVisible();

  await search.fill('mortgaged');
  await expect(page.getByText('No calculator matches that search')).toBeVisible();
  await expect(page.getByText('Recommended calculators')).toBeVisible();
  await page.getByRole('button', { name: 'Reset search' }).click();

  await expect(page.getByRole('link', { name: 'Open calculator' }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('calculator directory supports categories, favorites, search, recent history, and persistence', async ({ page }) => {
  await page.goto('/calculators');
  await expectSingleH1(page);
  await expect(page.getByRole('heading', { name: 'Categories', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Favorites', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Income', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Borrowing', exact: true })).toBeVisible();

  const search = page.getByLabel('Search calculators');
  await search.fill('mortgage');
  await expect(page.getByRole('heading', { name: 'Mortgage Calculator' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Loan Payment Calculator' })).not.toBeVisible();

  const favoritesSection = page.locator('section.card').filter({ has: page.getByRole('heading', { name: 'Favorites', exact: true }) });

  await page.getByRole('button', { name: /add favorite mortgage calculator/i }).first().click();
  await expect(favoritesSection.getByRole('heading', { name: 'Mortgage Calculator', exact: true })).toBeVisible();
  await page.reload();
  await expect(favoritesSection.getByRole('heading', { name: 'Mortgage Calculator', exact: true })).toBeVisible();

  await page.getByRole('button', { name: /remove favorite mortgage calculator/i }).first().click();
  await expect(page.getByText('No favorites yet')).toBeVisible();

  await page.getByRole('button', { name: /add favorite mortgage calculator/i }).first().click();
  await page.getByRole('button', { name: 'Clear favorites' }).click();
  await expect(page.getByText('No favorites yet')).toBeVisible();

  await page.getByRole('link', { name: 'Open calculator' }).first().click();
  await page.goto('/calculators/loan-payment');
  await page.goto('/calculators/loan-payment');
  await page.goto('/');

  const recentSection = page.locator('section.card').filter({ has: page.getByRole('heading', { name: 'Recently used calculators', exact: true }) });
  await expect(page.getByRole('heading', { name: 'Recently used calculators', exact: true })).toBeVisible();
  await expect(recentSection.getByRole('heading', { name: 'Loan Payment Calculator', exact: true })).toBeVisible();
  await expect(recentSection.locator('h2', { hasText: 'Loan Payment Calculator' })).toHaveCount(1);

  await page.getByRole('button', { name: 'Clear recent history' }).click();
  await expect(page.getByText('No recent calculators yet')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});
