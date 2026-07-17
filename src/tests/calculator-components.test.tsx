import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { HourlyIncomeCalculatorPage } from '../calculators/HourlyIncomeCalculatorPage';
import { MortgageCalculatorPage } from '../calculators/MortgageCalculatorPage';
import { renderWithApp } from './renderWithApp';

describe('calculator components', () => {
  it('shows a validation message for invalid hourly wage and recalculates after correction', async () => {
    const user = userEvent.setup();
    renderWithApp(<HourlyIncomeCalculatorPage />);

    const hourlyInput = screen.getByLabelText('Hourly wage');
    await user.clear(hourlyInput);
    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(screen.getByText('Enter hourly wage.')).toBeInTheDocument();

    await user.type(hourlyInput, '30');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(screen.getByText('$60,000.00')).toBeInTheDocument();
  });

  it('blocks an invalid mortgage down payment larger than home price', async () => {
    const user = userEvent.setup();
    renderWithApp(<MortgageCalculatorPage />);

    const downPaymentInput = screen.getByLabelText('Down payment');
    fireEvent.change(downPaymentInput, { target: { value: '500000' } });
    await user.click(screen.getByRole('button', { name: 'Calculate' }));

    expect(screen.getByText('Down payment cannot be greater than the home price.')).toBeInTheDocument();
  });
});
