import type { ComponentType } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreditCardPayoffCalculatorPage } from '../calculators/CreditCardPayoffCalculatorPage';
import { HourlyIncomeCalculatorPage } from '../calculators/HourlyIncomeCalculatorPage';
import { LoanPaymentCalculatorPage } from '../calculators/LoanPaymentCalculatorPage';
import { MortgageCalculatorPage } from '../calculators/MortgageCalculatorPage';
import { SavingsGrowthCalculatorPage } from '../calculators/SavingsGrowthCalculatorPage';
import { copyTextToClipboard } from '../utils/clipboard';
import { createStorageMock, renderWithApp } from './renderWithApp';

vi.mock('../utils/clipboard', () => ({
  copyTextToClipboard: vi.fn(),
}));

type ShareableCalculatorCase = {
  name: string;
  route: string;
  malformedRoute: string;
  primaryHeading: string;
  Component: ComponentType;
  assertLoadedValues: () => void;
  assertMalformedValues: () => void;
};

const shareableCalculators: ShareableCalculatorCase[] = [
  {
    name: 'hourly income',
    route: '/calculators/hourly-to-annual-income?rate=31.75&hours=37.5&weeks=48&deduction=19.5',
    malformedRoute: '/calculators/hourly-to-annual-income?rate=oops&hours=37.5&weeks=48&deduction=19.5&junk=1',
    primaryHeading: 'Estimated annual gross income',
    Component: HourlyIncomeCalculatorPage,
    assertLoadedValues: () => {
      expect(screen.getByLabelText('Hourly wage')).toHaveValue(31.75);
      expect(screen.getByLabelText('Hours per week')).toHaveValue(37.5);
      expect(screen.getByLabelText('Weeks worked per year')).toHaveValue(48);
      expect(screen.getByLabelText('Optional flat deduction estimate')).toHaveValue(19.5);
    },
    assertMalformedValues: () => {
      expect(screen.getByLabelText('Hourly wage')).toHaveValue(28);
      expect(screen.getByLabelText('Hours per week')).toHaveValue(37.5);
      expect(screen.getByLabelText('Weeks worked per year')).toHaveValue(48);
    },
  },
  {
    name: 'loan payment',
    route: '/calculators/loan-payment?principal=15000.5&rate=7.25&years=4',
    malformedRoute: '/calculators/loan-payment?principal=15000.5&rate=bad&years=4&junk=1',
    primaryHeading: 'Estimated monthly payment',
    Component: LoanPaymentCalculatorPage,
    assertLoadedValues: () => {
      expect(screen.getByLabelText('Loan amount')).toHaveValue(15000.5);
      expect(screen.getByLabelText('Annual interest rate')).toHaveValue(7.25);
      expect(screen.getByLabelText('Loan term in years')).toHaveValue(4);
    },
    assertMalformedValues: () => {
      expect(screen.getByLabelText('Loan amount')).toHaveValue(15000.5);
      expect(screen.getByLabelText('Annual interest rate')).toHaveValue(6.5);
      expect(screen.getByLabelText('Loan term in years')).toHaveValue(4);
    },
  },
  {
    name: 'savings growth',
    route: '/calculators/savings-growth?start=15000.25&contrib=625.5&return=6.75&years=18&timing=beginning',
    malformedRoute: '/calculators/savings-growth?start=15000.25&contrib=bad&return=6.75&years=18&timing=beginning&junk=1',
    primaryHeading: 'Projected future balance',
    Component: SavingsGrowthCalculatorPage,
    assertLoadedValues: () => {
      expect(screen.getByLabelText('Starting balance')).toHaveValue(15000.25);
      expect(screen.getByLabelText('Monthly contribution')).toHaveValue(625.5);
      expect(screen.getByLabelText('Estimated annual return')).toHaveValue(6.75);
      expect(screen.getByLabelText('Years to grow')).toHaveValue(18);
      expect(screen.getByLabelText('Contribution timing')).toHaveValue('beginning');
    },
    assertMalformedValues: () => {
      expect(screen.getByLabelText('Starting balance')).toHaveValue(15000.25);
      expect(screen.getByLabelText('Monthly contribution')).toHaveValue(500);
      expect(screen.getByLabelText('Contribution timing')).toHaveValue('beginning');
    },
  },
  {
    name: 'credit card payoff',
    route: '/calculators/credit-card-payoff?balance=9100.4&apr=21.25&mode=months&months=30',
    malformedRoute: '/calculators/credit-card-payoff?balance=9100.4&apr=bad&mode=months&months=30&junk=1',
    primaryHeading: 'Estimated payoff time',
    Component: CreditCardPayoffCalculatorPage,
    assertLoadedValues: () => {
      expect(screen.getByLabelText('Current balance')).toHaveValue(9100.4);
      expect(screen.getByLabelText('APR')).toHaveValue(21.25);
      expect(screen.getByLabelText('Payoff mode')).toHaveValue('months');
      expect(screen.getByLabelText('Desired payoff period in months')).toHaveValue(30);
    },
    assertMalformedValues: () => {
      expect(screen.getByLabelText('Current balance')).toHaveValue(9100.4);
      expect(screen.getByLabelText('APR')).toHaveValue(19.99);
      expect(screen.getByLabelText('Payoff mode')).toHaveValue('months');
    },
  },
  {
    name: 'mortgage',
    route: '/calculators/mortgage?price=455000.5&down=90500.25&rate=6.25&years=30&tax=5200&insurance=1900&hoa=175&mi=85',
    malformedRoute: '/calculators/mortgage?price=455000.5&down=90500.25&rate=bad&years=30&tax=5200&insurance=1900&hoa=175&mi=85&junk=1',
    primaryHeading: 'Estimated total monthly housing payment',
    Component: MortgageCalculatorPage,
    assertLoadedValues: () => {
      expect(screen.getByLabelText('Home price')).toHaveValue(455000.5);
      expect(screen.getByLabelText('Down payment')).toHaveValue(90500.25);
      expect(screen.getByLabelText('Interest rate')).toHaveValue(6.25);
      expect(screen.getByLabelText('Loan term in years')).toHaveValue(30);
      expect(screen.getByLabelText('Annual property tax')).toHaveValue(5200);
      expect(screen.getByLabelText('Annual homeowners insurance')).toHaveValue(1900);
      expect(screen.getByLabelText('Monthly HOA fee')).toHaveValue(175);
      expect(screen.getByLabelText('Monthly mortgage insurance')).toHaveValue(85);
    },
    assertMalformedValues: () => {
      expect(screen.getByLabelText('Home price')).toHaveValue(455000.5);
      expect(screen.getByLabelText('Interest rate')).toHaveValue(6.75);
      expect(screen.getByLabelText('Monthly HOA fee')).toHaveValue(175);
    },
  },
];

describe('shareable calculator flows', () => {
  beforeEach(() => {
    vi.mocked(copyTextToClipboard).mockResolvedValue(true);
  });

  it.each(shareableCalculators)(
    '$name loads approved query values, waits for Calculate, and recreates the same shared inputs',
    async ({ Component, route, primaryHeading, assertLoadedValues }) => {
      const user = userEvent.setup();
      const firstRender = renderWithApp(<Component />, { route });

      assertLoadedValues();
      expect(
        screen.getByText('Values were loaded from a shared link. Review them and select Calculate to generate the result.'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: primaryHeading })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Share calculation' })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Calculate' }));
      expect(screen.getByRole('heading', { name: primaryHeading })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Share calculation' })).toBeEnabled();

      await user.click(screen.getByRole('button', { name: 'Share calculation' }));
      expect(screen.getByText('Share link copied.')).toBeInTheDocument();
      const sharedUrl = vi.mocked(copyTextToClipboard).mock.lastCall?.[0];
      expect(sharedUrl).toBeTruthy();

      firstRender.unmount();
      const parsed = new URL(sharedUrl as string);
      renderWithApp(<Component />, { route: `${parsed.pathname}${parsed.search}` });

      assertLoadedValues();
      expect(screen.queryByRole('heading', { name: primaryHeading })).not.toBeInTheDocument();
    },
  );

  it.each(shareableCalculators)(
    '$name ignores unknown parameters and leaves malformed fields at safe defaults',
    ({ Component, malformedRoute, assertMalformedValues }) => {
      renderWithApp(<Component />, { route: malformedRoute });

      assertMalformedValues();
      expect(screen.getByText('Shared link loaded')).toBeInTheDocument();
      expect(screen.getByText(/some invalid values were ignored/i)).toBeInTheDocument();
    },
  );

  it('uses the last submitted values instead of unsaved edits when generating a loan share link', async () => {
    const user = userEvent.setup();
    renderWithApp(<LoanPaymentCalculatorPage />);

    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    const amountInput = screen.getByLabelText('Loan amount');
    await user.clear(amountInput);
    await user.type(amountInput, '99999');

    await user.click(screen.getByRole('button', { name: 'Share calculation' }));
    const sharedUrl = vi.mocked(copyTextToClipboard).mock.lastCall?.[0] as string;

    expect(sharedUrl).toContain('principal=25000');
    expect(sharedUrl).not.toContain('principal=99999');
  });

  it('announces clipboard failure for share links and does not throw when the clipboard API rejects', async () => {
    vi.mocked(copyTextToClipboard).mockResolvedValueOnce(false);
    const user = userEvent.setup();
    renderWithApp(<LoanPaymentCalculatorPage />);

    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    await user.click(screen.getByRole('button', { name: 'Share calculation' }));

    expect(screen.getByText('Could not copy the share link.')).toBeInTheDocument();
  });

  it('does not write shared calculator values or results to localStorage', async () => {
    const user = userEvent.setup();
    const storage = createStorageMock();
    renderWithApp(<LoanPaymentCalculatorPage />, {
      route: '/calculators/loan-payment?principal=12345.67&rate=7.89&years=11',
      storage,
    });

    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    await user.click(screen.getByRole('button', { name: 'Share calculation' }));

    const dump = storage.dump();
    expect(Object.keys(dump)).toEqual(['financial-calculator-preferences']);
    expect(dump['financial-calculator-preferences']).not.toContain('12345.67');
    expect(dump['financial-calculator-preferences']).not.toContain('7.89');
    expect(dump['financial-calculator-preferences']).not.toContain('11');
    expect(dump['financial-calculator-preferences']).not.toContain('139.');
  });
});
