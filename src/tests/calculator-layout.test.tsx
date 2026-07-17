import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { BudgetPlannerPage } from '../calculators/BudgetPlannerPage';
import { CreditCardPayoffCalculatorPage } from '../calculators/CreditCardPayoffCalculatorPage';
import { HourlyIncomeCalculatorPage } from '../calculators/HourlyIncomeCalculatorPage';
import { LoanPaymentCalculatorPage } from '../calculators/LoanPaymentCalculatorPage';
import { MortgageCalculatorPage } from '../calculators/MortgageCalculatorPage';
import { RetirementCalculatorPage } from '../calculators/RetirementCalculatorPage';
import { SalaryCalculatorPage } from '../calculators/SalaryCalculatorPage';
import { SavingsGrowthCalculatorPage } from '../calculators/SavingsGrowthCalculatorPage';
import { createStorageMock, renderWithApp } from './renderWithApp';

const calculators = [
  {
    name: 'hourly calculator',
    Component: HourlyIncomeCalculatorPage,
    primaryHeading: 'Estimated annual gross income',
  },
  {
    name: 'salary calculator',
    Component: SalaryCalculatorPage,
    primaryHeading: 'Estimated monthly take-home income',
  },
  {
    name: 'loan calculator',
    Component: LoanPaymentCalculatorPage,
    primaryHeading: 'Estimated monthly payment',
  },
  {
    name: 'savings calculator',
    Component: SavingsGrowthCalculatorPage,
    primaryHeading: 'Projected future balance',
  },
  {
    name: 'credit card calculator',
    Component: CreditCardPayoffCalculatorPage,
    primaryHeading: 'Estimated payoff time',
  },
  {
    name: 'mortgage calculator',
    Component: MortgageCalculatorPage,
    primaryHeading: 'Estimated total monthly housing payment',
  },
  {
    name: 'budget calculator',
    Component: BudgetPlannerPage,
    primaryHeading: 'Estimated monthly remaining cash',
  },
  {
    name: 'retirement calculator',
    Component: RetirementCalculatorPage,
    primaryHeading: 'Projected inflation-adjusted retirement balance',
  },
] as const;

describe('calculator layout migration', () => {
  it.each(calculators)('$name shows an empty state, calculates, and resets', async ({ Component, primaryHeading }) => {
    const user = userEvent.setup();
    renderWithApp(<Component />);

    expect(screen.getByText('No result yet')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(screen.getByRole('heading', { name: primaryHeading })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy result' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Calculation assumptions' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start over' }));

    expect(screen.getByText('No result yet')).toBeInTheDocument();
  });

  it('limits the loan schedule to the first 12 rows until expanded and collapses again', async () => {
    const user = userEvent.setup();
    renderWithApp(<LoanPaymentCalculatorPage />);

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    const initialTable = screen.getByRole('table', { name: /monthly amortization schedule/i });
    expect(within(initialTable).getAllByRole('row')).toHaveLength(13);

    const toggle = screen.getByRole('button', { name: /show full amortization schedule/i });
    await user.click(toggle);

    const expandedTable = screen.getByRole('table', { name: /monthly amortization schedule/i });
    expect(within(expandedTable).getAllByRole('row')).toHaveLength(61);

    await user.click(screen.getByRole('button', { name: 'Show fewer rows' }));
    expect(within(screen.getByRole('table', { name: /monthly amortization schedule/i })).getAllByRole('row')).toHaveLength(13);
  });

  it('allows keyboard activation of expandable schedules and stores only expansion preferences', async () => {
    const user = userEvent.setup();
    const storage = createStorageMock();
    renderWithApp(<LoanPaymentCalculatorPage />, { storage });

    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    const toggle = screen.getByRole('button', { name: /show full amortization schedule/i });
    toggle.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('button', { name: 'Show fewer rows' })).toHaveAttribute('aria-expanded', 'true');

    const dump = storage.dump();
    expect(Object.keys(dump)).toEqual(['financial-calculator-preferences']);
    const preferences = JSON.parse(dump['financial-calculator-preferences']);
    expect(preferences.schedulesExpanded).toBe(true);
    expect(dump['financial-calculator-preferences']).not.toContain('25000');
    expect(dump['financial-calculator-preferences']).not.toContain('489');
  });

  it('limits the mortgage schedule to the first 12 rows until expanded', async () => {
    const user = userEvent.setup();
    renderWithApp(<MortgageCalculatorPage />);

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    const initialTable = screen.getByRole('table', { name: /monthly amortization schedule/i });
    expect(within(initialTable).getAllByRole('row')).toHaveLength(13);

    await user.click(screen.getByRole('button', { name: /show full amortization schedule/i }));
    expect(within(screen.getByRole('table', { name: /monthly amortization schedule/i })).getAllByRole('row')).toHaveLength(361);
  });

  it('limits the credit-card schedule to the first 12 rows until expanded', async () => {
    const user = userEvent.setup();
    renderWithApp(<CreditCardPayoffCalculatorPage />);

    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    const initialTable = screen.getByRole('table', { name: /monthly payoff schedule/i });
    expect(within(initialTable).getAllByRole('row')).toHaveLength(13);

    await user.click(screen.getByRole('button', { name: /show full payoff schedule/i }));
    expect(within(screen.getByRole('table', { name: /monthly payoff schedule/i })).getAllByRole('row').length).toBeGreaterThan(13);
  });

  it('shows year-by-year savings rows only after a valid calculation', async () => {
    const user = userEvent.setup();
    renderWithApp(<SavingsGrowthCalculatorPage />);

    expect(screen.queryByRole('table', { name: /year-by-year breakdown/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(within(screen.getByRole('table', { name: /year-by-year breakdown/i })).getAllByRole('row')).toHaveLength(16);
  });

  it('shows year-by-year retirement rows only after a valid calculation', async () => {
    const user = userEvent.setup();
    renderWithApp(<RetirementCalculatorPage />);

    expect(screen.queryByRole('table', { name: /year-by-year projection/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(within(screen.getByRole('table', { name: /year-by-year projection/i })).getAllByRole('row')).toHaveLength(31);
  });

  it('rejects over-limit loan terms and accepts the maximum valid term', async () => {
    const user = userEvent.setup();
    renderWithApp(<LoanPaymentCalculatorPage />);

    const termInput = screen.getByLabelText('Loan term in years');
    await user.clear(termInput);
    await user.type(termInput, '51');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByText('Loan term in years must be no more than 50.')).toBeInTheDocument();

    await user.clear(termInput);
    await user.type(termInput, '50');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByRole('heading', { name: 'Estimated monthly payment' })).toBeInTheDocument();
  });

  it('rejects over-limit mortgage terms and accepts the maximum valid term', async () => {
    const user = userEvent.setup();
    renderWithApp(<MortgageCalculatorPage />);

    const termInput = screen.getByLabelText('Loan term in years');
    await user.clear(termInput);
    await user.type(termInput, '51');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByText('Loan term in years must be no more than 50.')).toBeInTheDocument();

    await user.clear(termInput);
    await user.type(termInput, '50');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByRole('heading', { name: 'Estimated total monthly housing payment' })).toBeInTheDocument();
  });

  it('rejects over-limit credit-card payoff periods and preserves insufficient-payment validation', async () => {
    const user = userEvent.setup();
    renderWithApp(<CreditCardPayoffCalculatorPage />);

    await user.clear(screen.getByLabelText('Monthly payment'));
    await user.type(screen.getByLabelText('Monthly payment'), '50');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByText('Payment must be higher than the first month of interest to reduce the balance.')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Payoff mode'), 'months');
    const monthsInput = screen.getByLabelText('Desired payoff period in months');
    await user.clear(monthsInput);
    await user.type(monthsInput, '1201');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByText('Desired payoff period in months must be no more than 1200.')).toBeInTheDocument();
  });

  it('rejects over-limit savings years', async () => {
    const user = userEvent.setup();
    renderWithApp(<SavingsGrowthCalculatorPage />);

    const yearsInput = screen.getByLabelText('Years to grow');
    await user.clear(yearsInput);
    await user.type(yearsInput, '101');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByText('Years to grow must be no more than 100.')).toBeInTheDocument();
  });

  it('rejects retirement ages beyond the supported maximum', async () => {
    const user = userEvent.setup();
    renderWithApp(<RetirementCalculatorPage />);

    const retirementAgeInput = screen.getByLabelText('Retirement age');
    await user.clear(retirementAgeInput);
    await user.type(retirementAgeInput, '101');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByText('Retirement age must be no more than 100.')).toBeInTheDocument();
  });
});
