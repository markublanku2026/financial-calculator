import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { BudgetPlannerPage } from '../calculators/BudgetPlannerPage';
import { CreditCardPayoffCalculatorPage } from '../calculators/CreditCardPayoffCalculatorPage';
import { LoanPaymentCalculatorPage } from '../calculators/LoanPaymentCalculatorPage';
import { MortgageCalculatorPage } from '../calculators/MortgageCalculatorPage';
import { RetirementCalculatorPage } from '../calculators/RetirementCalculatorPage';
import { SavingsGrowthCalculatorPage } from '../calculators/SavingsGrowthCalculatorPage';
import { sampleChartSeries } from '../utils/chart';
import { renderWithApp } from './renderWithApp';

describe('chart utilities', () => {
  it('samples long series while preserving the first and final points', () => {
    const series = Array.from({ length: 40 }, (_, index) => ({ label: `Month ${index + 1}`, value: 40 - index }));
    const sampled = sampleChartSeries(series, 12);

    expect(sampled).toHaveLength(12);
    expect(sampled[0]).toEqual(series[0]);
    expect(sampled.at(-1)).toEqual(series.at(-1));
  });

  it('deduplicates adjacent duplicates and omits non-finite chart values', () => {
    const sampled = sampleChartSeries(
      [
        { label: 'Start', value: 100 },
        { label: 'Month 1', value: 100 },
        { label: 'Month 2', value: Number.NaN },
        { label: 'Month 3', value: 80 },
        { label: 'Month 4', value: 80 },
      ],
      10,
    );

    expect(sampled).toEqual([
      { label: 'Start', value: 100 },
      { label: 'Month 1', value: 100 },
      { label: 'Month 3', value: 80 },
      { label: 'Month 4', value: 80 },
    ]);
  });

  it('handles empty and one-point series safely', () => {
    expect(sampleChartSeries([], 10)).toEqual([]);
    expect(sampleChartSeries([{ label: 'Only', value: 25 }], 10)).toEqual([{ label: 'Only', value: 25 }]);
  });
});

describe('chart integrations', () => {
  it('keeps charts hidden until a valid calculation is submitted', () => {
    renderWithApp(<LoanPaymentCalculatorPage />);
    expect(screen.queryByRole('heading', { name: 'Principal versus interest' })).not.toBeInTheDocument();

    renderWithApp(<SavingsGrowthCalculatorPage />);
    expect(screen.queryByRole('heading', { name: 'Savings breakdown' })).not.toBeInTheDocument();

    renderWithApp(<CreditCardPayoffCalculatorPage />);
    expect(screen.queryByRole('heading', { name: 'Balance decline' })).not.toBeInTheDocument();

    renderWithApp(<MortgageCalculatorPage />);
    expect(screen.queryByRole('heading', { name: 'Monthly payment composition' })).not.toBeInTheDocument();

    renderWithApp(<BudgetPlannerPage />);
    expect(screen.queryByRole('heading', { name: 'Expense distribution' })).not.toBeInTheDocument();

    renderWithApp(<RetirementCalculatorPage />);
    expect(screen.queryByRole('heading', { name: 'Projection summary' })).not.toBeInTheDocument();
  });

  it('shows the loan chart with numeric summary and keeps it tied to the last valid result after unsaved edits', async () => {
    const user = userEvent.setup();
    renderWithApp(<LoanPaymentCalculatorPage />);

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(screen.getByText(/Total principal repaid: \$25,000.00\./)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /loan summary comparing total principal repaid with total interest paid/i })).toBeInTheDocument();

    const amountInput = screen.getByLabelText('Loan amount');
    await user.clear(amountInput);
    await user.type(amountInput, '50000');

    expect(screen.getByText(/Total principal repaid: \$25,000.00\./)).toBeInTheDocument();
  });

  it('shows the savings chart with a full numeric alternative', async () => {
    const user = userEvent.setup();
    renderWithApp(<SavingsGrowthCalculatorPage />);

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(screen.getByText(/Starting balance: \$10,000.00\./)).toBeInTheDocument();
    expect(screen.getByText(/Added contributions: \$90,000.00\./)).toBeInTheDocument();
    expect(screen.getByText(/Projected final balance:/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /savings summary showing starting balance/i })).toBeInTheDocument();
  });

  it('hides the credit-card payoff chart when the payment is too low', async () => {
    const user = userEvent.setup();
    renderWithApp(<CreditCardPayoffCalculatorPage />);

    await user.clear(screen.getByLabelText('Monthly payment'));
    await user.type(screen.getByLabelText('Monthly payment'), '50');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(screen.getByText(/Payment must be higher than the first month of interest/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Balance decline' })).not.toBeInTheDocument();
  });

  it('renders mortgage composition without zero-value categories and uses responsive SVG markup', async () => {
    const user = userEvent.setup();
    const { container } = renderWithApp(<MortgageCalculatorPage />);

    await user.clear(screen.getByLabelText('Monthly HOA fee'));
    await user.type(screen.getByLabelText('Monthly HOA fee'), '0');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    const chart = screen.getByRole('img', { name: /mortgage payment composition/i });
    expect(chart).toBeInTheDocument();

    const chartLegend = chart.parentElement as HTMLElement;
    expect(within(chartLegend).queryByText('HOA')).not.toBeInTheDocument();
    expect(within(chartLegend).queryByText('Mortgage insurance')).not.toBeInTheDocument();

    const svg = container.querySelector('svg');
    expect(svg).not.toHaveAttribute('width');
  });

  it('shows an empty budget chart state when there are no positive expenses and does not divide by zero', async () => {
    const user = userEvent.setup();
    renderWithApp(<BudgetPlannerPage />);

    await user.clear(screen.getByLabelText('Monthly income'));
    await user.type(screen.getByLabelText('Monthly income'), '0');

    const amountFields = [
      'Housing amount',
      'Transportation amount',
      'Food amount',
      'Utilities amount',
      'Insurance amount',
      'Entertainment amount',
    ];

    for (const label of amountFields) {
      await user.clear(screen.getByLabelText(label));
      await user.type(screen.getByLabelText(label), '0');
    }

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(screen.getByText('No positive expense categories are available to chart yet.')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: /category percentages/i })).toBeInTheDocument();
    expect(screen.getAllByText('0.00%').length).toBeGreaterThan(0);
  });

  it('ranks budget categories by amount in the chart output', async () => {
    const user = userEvent.setup();
    const { container } = renderWithApp(<BudgetPlannerPage />);

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    const labels = Array.from(container.querySelectorAll('.simple-bar-row > span:first-child')).map((node) =>
      node.textContent?.trim(),
    );
    expect(labels.slice(0, 3)).toEqual(['Housing', 'Food', 'Transportation']);
  });

  it('shows the retirement chart with hypothetical wording and distinct nominal and inflation-adjusted values', async () => {
    const user = userEvent.setup();
    renderWithApp(<RetirementCalculatorPage />);

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(screen.getByText(/These projections are hypothetical and do not imply guaranteed returns\./)).toBeInTheDocument();
    expect(screen.getByText(/Projected nominal balance:/)).toBeInTheDocument();
    expect(screen.getByText(/Inflation-adjusted balance:/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /retirement projection summary comparing total contributions/i })).toBeInTheDocument();
  });

  it('keeps the credit-card line chart SVG responsive without fixed width attributes', async () => {
    const user = userEvent.setup();
    const { container } = renderWithApp(<CreditCardPayoffCalculatorPage />);

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    const chart = screen.getByRole('img', { name: /credit-card balance decline over the payoff period/i });
    expect(chart).toBeInTheDocument();

    const svg = within(chart).queryByRole('img');
    expect(svg).toBeNull();
    expect(container.querySelector('.line-chart')).not.toHaveAttribute('width');
  });
});
