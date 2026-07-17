import { describe, expect, it } from 'vitest';

import {
  formatBudgetCopySummary,
  formatCreditCardCopySummary,
  formatHourlyCopySummary,
  formatLoanCopySummary,
  formatMortgageCopySummary,
  formatRetirementCopySummary,
  formatSalaryCopySummary,
  formatSavingsCopySummary,
} from '../utils/copySummaries';

describe('copy summaries', () => {
  it('formats hourly summary text', () => {
    expect(
      formatHourlyCopySummary(
        {
          annualGross: 56000,
          monthlyGross: 4666.6667,
          weeklyGross: 1120,
          annualTakeHome: 43680,
          monthlyTakeHome: 3640,
        },
        22,
      ),
    ).toContain('Estimated annual gross income: $56,000.00.');
  });

  it('formats salary summary text', () => {
    expect(
      formatSalaryCopySummary(
        {
          monthlyGross: 7500,
          selectedPayPeriodGross: 3750,
          selectedPayPeriodTakeHome: 2850,
          monthlyTakeHome: 5700,
          hourlyEquivalent: 43.269,
        },
        24,
      ),
    ).toContain('Estimated monthly take-home income: $5,700.00.');
  });

  it('formats loan summary text', () => {
    expect(
      formatLoanCopySummary({
        payment: 489.153705,
        totalInterest: 4349.22,
        totalPayments: 29349.22,
        totalMonths: 60,
      }),
    ).toContain('Term: 60 months.');
  });

  it('formats savings summary text', () => {
    expect(
      formatSavingsCopySummary(
        {
          futureBalance: 120000,
          totalContributions: 100000,
          interestEarned: 20000,
        },
        'end',
      ),
    ).toContain('Contribution timing: End of each month.');
  });

  it('formats credit-card summary text', () => {
    expect(
      formatCreditCardCopySummary({
        paymentToUse: 250,
        payoff: {
          months: 46,
          totalInterest: 3400,
          totalPaid: 11400,
        },
      }),
    ).toContain('Estimated payoff time: 3 years 10 months.');
  });

  it('formats mortgage summary text', () => {
    expect(
      formatMortgageCopySummary({
        totalMonthlyPayment: 2850,
        principalAndInterest: 2300,
        propertyTax: 400,
        insurance: 150,
        hoa: 0,
        mortgageInsurance: 0,
      }),
    ).toContain('Principal and interest: $2,300.00.');
  });

  it('formats budget summary text', () => {
    expect(
      formatBudgetCopySummary({
        monthlyIncome: 5200,
        totalExpenses: 3650,
        remainingCash: 1550,
        savingsRate: 29.8076923,
      }),
    ).toContain('Savings rate: 29.81%.');
  });

  it('formats retirement summary text', () => {
    expect(
      formatRetirementCopySummary({
        inflationAdjustedBalance: 850000,
        projectedNominalBalance: 1780000,
        totalContributions: 384000,
        estimatedGrowth: 1396000,
      }),
    ).toContain('Projected inflation-adjusted retirement balance: $850,000.00.');
  });
});
