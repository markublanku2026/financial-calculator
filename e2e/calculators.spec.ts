import type { Page } from 'playwright/test';
import { test, expect, assertOnlyPreferenceStorage, expectNoHorizontalOverflow, mockClipboard, readClipboardWrites } from './fixtures';

async function expectTableRowCount(page: Page, name: RegExp, count: number) {
  await expect(page.getByRole('table', { name })).toBeVisible();
  await expect(page.getByRole('table', { name }).locator('tr')).toHaveCount(count);
}

test('hourly calculator handles calculation, copy result, reset, and shared links safely', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await mockClipboard(page, 'success');

  await page.goto('/calculators/hourly-to-annual-income');
  await expect(page.getByText('No result yet')).toBeVisible();
  await page.getByLabel('Hourly wage').fill('30');
  await page.getByLabel('Hours per week').fill('40');
  await page.getByLabel('Weeks worked per year').fill('50');
  await page.getByLabel('Planned annual work hours').fill('2000');
  await page.getByLabel('Optional flat deduction estimate').fill('20');
  await page.getByRole('button', { name: 'Calculate' }).click();

  await expect(page.getByRole('heading', { name: 'Estimated annual gross income' })).toBeVisible();
  await expect(page.getByText('$60,000.00')).toBeVisible();
  await expect(page.getByText(/Estimated annual take-home income/)).toBeVisible();

  await page.getByRole('button', { name: 'Copy result' }).click();
  await expect(page.getByText('Result copied.')).toBeVisible();
  const resultCopies = await readClipboardWrites(page);
  expect(resultCopies.at(-1)).toContain('Estimated annual gross income: $60,000.00.');

  await page.getByRole('button', { name: 'Share calculation' }).click();
  await expect(page.getByText('Share link copied.')).toBeVisible();
  const clipboardWrites = await readClipboardWrites(page);
  const shareUrl = clipboardWrites.at(-1) ?? '';
  expect(shareUrl).toContain('rate=30');
  expect(shareUrl).toContain('hours=40');

  await page.getByRole('button', { name: 'Start over' }).click();
  await expect(page.getByText('No result yet')).toBeVisible();

  const sharedPage = await context.newPage();
  await sharedPage.goto(`${new URL(shareUrl).pathname}${new URL(shareUrl).search}&unknown=1`);
  await expect(sharedPage.getByText(/Values were loaded from a shared link/)).toBeVisible();
  await expect(sharedPage.getByText('No result yet')).toBeVisible();
  await expect(sharedPage.getByLabel('Hourly wage')).toHaveValue('30');
  await sharedPage.getByRole('button', { name: 'Calculate' }).click();
  await expect(sharedPage.getByText('$60,000.00')).toBeVisible();

  const malformedPage = await context.newPage();
  await malformedPage.goto('/calculators/hourly-to-annual-income?rate=bad&hours=40&weeks=50');
  await expect(malformedPage.getByText(/Some invalid values were ignored/i)).toBeVisible();
  await expect(malformedPage.getByLabel('Hourly wage')).toHaveValue('28');
  await expect(malformedPage.getByLabel('Hours per week')).toHaveValue('40');
  await context.close();
});

test('salary calculator preserves the last valid result when a later submission is invalid', async ({ page }) => {
  await page.goto('/calculators/salary');
  await page.getByRole('button', { name: 'Calculate' }).click();
  await expect(page.getByRole('heading', { name: 'Estimated monthly take-home income' })).toBeVisible();
  await expect(page.getByText('$5,700.00')).toBeVisible();
  await expect(page.getByText(/Estimated gross selected pay period/)).toBeVisible();

  await page.getByLabel('Annual salary').fill('0');
  await page.getByRole('button', { name: 'Calculate' }).click();
  await expect(page.getByText('Annual salary must be greater than 0.')).toBeVisible();
  await expect(page.getByText('$5,700.00')).toBeVisible();

  await page.getByRole('button', { name: 'Start over' }).click();
  await expect(page.getByText('No result yet')).toBeVisible();
});

test('loan calculator supports schedule disclosure, keyboard expansion, share links, and chart reconciliation', async ({ page }) => {
  await mockClipboard(page, 'success');
  await page.goto('/calculators/loan-payment');
  await page.getByRole('button', { name: 'Calculate' }).click();

  await expect(page.locator('.primary-result-value')).toHaveText('$489.15');
  await expectTableRowCount(page, /monthly amortization schedule/i, 13);
  await expect(page.getByText(/Total principal repaid: \$25,000.00\./)).toBeVisible();
  await expect(page.getByText(/Total interest paid: \$4,349.22\./)).toBeVisible();

  const toggle = page.getByRole('button', { name: /show full amortization schedule/i });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Show fewer rows' })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('table', { name: /monthly amortization schedule/i }).locator('tr')).toHaveCount(61);
  await page.getByRole('button', { name: 'Show fewer rows' }).click();
  await expectTableRowCount(page, /monthly amortization schedule/i, 13);
  await expect(page.getByRole('table', { name: /amortization summary/i })).toBeVisible();

  await page.getByRole('button', { name: 'Share calculation' }).click();
  const sharedUrl = (await readClipboardWrites(page)).at(-1) ?? '';
  expect(sharedUrl).toContain('principal=25000');
  expect(sharedUrl).toContain('rate=6.5');

  await page.getByLabel('Loan amount').fill('50000');
  await page.getByRole('button', { name: 'Share calculation' }).click();
  const unchangedShareUrl = (await readClipboardWrites(page)).at(-1) ?? '';
  expect(unchangedShareUrl).toContain('principal=25000');
  expect(unchangedShareUrl).not.toContain('principal=50000');

  await page.goto(`${new URL(sharedUrl).pathname}${new URL(sharedUrl).search}`);
  await expect(page.getByText(/Values were loaded from a shared link/)).toBeVisible();
  await expect(page.getByText('No result yet')).toBeVisible();
  await page.getByRole('button', { name: 'Calculate' }).click();
  await expect(page.locator('.primary-result-value')).toHaveText('$489.15');
});

test('savings calculator updates for contribution timing and supports shared URLs without auto-calculating', async ({ page }) => {
  await mockClipboard(page, 'success');
  await page.goto('/calculators/savings-growth');
  await page.getByRole('button', { name: 'Calculate' }).click();
  const endingBalance = await page.locator('.primary-result-value').textContent();
  await expect(page.getByRole('table', { name: /year-by-year breakdown/i })).toBeVisible();
  await expect(page.getByText(/Starting balance:/)).toBeVisible();
  await expect(page.getByText(/Added contributions:/)).toBeVisible();
  await expect(page.getByText(/Estimated interest earned:/)).toBeVisible();
  await expect(page.getByText(/Projected final balance:/)).toBeVisible();

  await page.getByLabel('Contribution timing').selectOption('beginning');
  await page.getByRole('button', { name: 'Calculate' }).click();
  await expect(page.locator('.primary-result-value')).not.toHaveText(endingBalance ?? '');

  await page.getByRole('button', { name: 'Share calculation' }).click();
  const shareUrl = (await readClipboardWrites(page)).at(-1) ?? '';
  expect(shareUrl).toContain('timing=beginning');

  await page.goto(`${new URL(shareUrl).pathname}${new URL(shareUrl).search}`);
  await expect(page.getByText(/Values were loaded from a shared link/)).toBeVisible();
  await expect(page.getByText('No result yet')).toBeVisible();
  await expect(page.getByLabel('Contribution timing')).toHaveValue('beginning');
});

test('credit-card payoff calculator covers fixed payment, insufficient payment, and target-month modes', async ({ page }) => {
  await mockClipboard(page, 'success');
  await page.goto('/calculators/credit-card-payoff');
  await page.getByRole('button', { name: 'Calculate' }).click();
  await expect(page.getByRole('heading', { name: 'Estimated payoff time' })).toBeVisible();
  await expectTableRowCount(page, /monthly payoff schedule/i, 13);
  await page.getByRole('button', { name: /show full payoff schedule/i }).click();
  await expect(page.getByRole('table', { name: /monthly payoff schedule/i }).locator('tr').count()).resolves.toBeGreaterThan(13);
  await expect(page.getByRole('img', { name: /credit-card balance decline/i })).toBeVisible();

  await page.getByLabel('Monthly payment').fill('50');
  await page.getByRole('button', { name: 'Calculate' }).click();
  await expect(page.getByText(/Payment must be higher than the first month of interest/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Estimated payoff time' })).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Balance decline' })).not.toBeVisible();
  await expect(page.getByRole('table', { name: /monthly payoff schedule/i })).not.toBeVisible();

  await page.getByLabel('Payoff mode').selectOption('months');
  await page.getByLabel('Desired payoff period in months').fill('24');
  await page.getByRole('button', { name: 'Calculate' }).click();
  await expect(page.getByText(/Required payment to reach the selected payoff period:/)).toBeVisible();
  await page.getByRole('button', { name: 'Share calculation' }).click();
  const shareUrl = (await readClipboardWrites(page)).at(-1) ?? '';
  expect(shareUrl).toContain('mode=months');
  expect(shareUrl).toContain('months=24');
  expect(shareUrl).not.toContain('payment=');

  await page.goto('/calculators/credit-card-payoff?balance=8000&apr=19.99&mode=months&payment=999&months=24');
  await expect(page.getByLabel('Payoff mode')).toHaveValue('months');
  await expect(page.getByLabel('Desired payoff period in months')).toHaveValue('24');
  await expect(page.getByLabel('Monthly payment')).not.toBeVisible();
});

test('mortgage calculator works at desktop and 320px mobile with share links and no overflow', async ({ page }) => {
  await mockClipboard(page, 'success');
  await page.goto('/calculators/mortgage');
  await page.getByRole('button', { name: 'Calculate' }).click();
  await expect(page.getByRole('heading', { name: 'Estimated total monthly housing payment' })).toBeVisible();
  const mortgageResults = page.locator('.secondary-result-grid');
  await expect(mortgageResults).toContainText('Principal and interest');
  await expect(mortgageResults).toContainText('Property tax');
  await expect(mortgageResults).toContainText('Insurance');
  await expect(mortgageResults).toContainText('HOA');
  await expect(mortgageResults).toContainText('Mortgage insurance');
  await expectTableRowCount(page, /monthly amortization schedule/i, 13);
  await page.getByRole('button', { name: /show full amortization schedule/i }).click();
  await expect(page.getByRole('table', { name: /monthly amortization schedule/i }).locator('tr')).toHaveCount(361);

  await page.getByRole('button', { name: 'Share calculation' }).click();
  const shareUrl = (await readClipboardWrites(page)).at(-1) ?? '';
  await page.goto(`${new URL(shareUrl).pathname}${new URL(shareUrl).search}`);
  await expect(page.getByText(/Values were loaded from a shared link/)).toBeVisible();
  await expect(page.getByText('No result yet')).toBeVisible();

  await page.setViewportSize({ width: 320, height: 568 });
  await expect(page.getByText(/Values were loaded from a shared link/)).toBeVisible();
  await page.getByRole('button', { name: 'Calculate' }).click();
  await expect(page.getByRole('heading', { name: 'Estimated total monthly housing payment' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page.getByRole('button', { name: 'Calculate' })).toBeVisible();
});

test('budget planner handles overspending, zero income, ranking, and reset', async ({ page }) => {
  await page.goto('/calculators/budget-planner');
  await page.getByRole('button', { name: 'Calculate' }).click();
  await expect(page.getByRole('heading', { name: 'Estimated monthly remaining cash' })).toBeVisible();
  await expect(page.getByText(/Budget note|Budget warning/)).toBeVisible();
  await expect(page.locator('.simple-bar-row').first()).toContainText('Housing');
  await expect(page.locator('.primary-result')).toContainText('Estimated monthly remaining cash');
  const budgetChartLabels = await page.locator('.simple-bar-row > span:first-child').allTextContents();
  expect(budgetChartLabels).not.toContain('Remaining cash');

  await page.getByLabel('Monthly income').fill('0');
  for (const label of ['Housing amount', 'Transportation amount', 'Food amount', 'Utilities amount', 'Insurance amount', 'Entertainment amount']) {
    await page.getByLabel(label).fill('100');
  }
  await page.getByRole('button', { name: 'Calculate' }).click();
  await expect(page.getByText('Expenses exceed income')).toBeVisible();
  await expect(page.locator('.secondary-result-grid')).toContainText('0.00%');

  for (const label of ['Housing amount', 'Transportation amount', 'Food amount', 'Utilities amount', 'Insurance amount', 'Entertainment amount']) {
    await page.getByLabel(label).fill('0');
  }
  await page.getByRole('button', { name: 'Calculate' }).click();
  await expect(page.getByText('No positive expense categories are available to chart yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Start over' }).click();
  await expect(page.getByText('No result yet')).toBeVisible();
});

test('retirement calculator shows nominal and inflation-adjusted balances with hypothetical wording', async ({ page }) => {
  await page.goto('/calculators/retirement');
  await page.getByRole('button', { name: 'Calculate' }).click();
  const firstValue = await page.locator('.primary-result-value').textContent();
  await expect(page.locator('.secondary-result-grid')).toContainText('Projected nominal balance');
  await expect(page.locator('.chart-card')).toContainText('Inflation-adjusted balance');
  await expect(page.getByRole('table', { name: /year-by-year projection/i })).toBeVisible();
  await expect(page.getByText(/These projections are hypothetical and do not imply guaranteed returns/)).toBeVisible();
  await expect(page.getByText(/not guaranteed/)).toBeVisible();

  await page.getByLabel('Contribution timing').selectOption('beginning');
  await page.getByRole('button', { name: 'Calculate' }).click();
  await expect(page.locator('.primary-result-value')).not.toHaveText(firstValue ?? '');
});

test('clipboard failures and missing clipboard support do not break calculator results', async ({ browser }) => {
  const rejectingContext = await browser.newContext();
  const rejectingPage = await rejectingContext.newPage();
  await mockClipboard(rejectingPage, 'reject');
  await rejectingPage.goto('/calculators/hourly-to-annual-income');
  await rejectingPage.getByRole('button', { name: 'Calculate' }).click();
  await rejectingPage.getByRole('button', { name: 'Copy result' }).click();
  await expect(rejectingPage.getByText('Copy failed on this device.')).toBeVisible();
  await expect(rejectingPage.getByRole('heading', { name: 'Estimated annual gross income' })).toBeVisible();
  await rejectingContext.close();

  const missingContext = await browser.newContext();
  const missingPage = await missingContext.newPage();
  await mockClipboard(missingPage, 'missing');
  await missingPage.goto('/calculators/loan-payment');
  await missingPage.getByRole('button', { name: 'Calculate' }).click();
  await missingPage.getByRole('button', { name: 'Share calculation' }).click();
  await expect(missingPage.getByText('Could not copy the share link.')).toBeVisible();
  await expect(missingPage.getByRole('heading', { name: 'Estimated monthly payment' })).toBeVisible();
  await assertOnlyPreferenceStorage(missingPage);
  await missingContext.close();
});
