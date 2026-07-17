import type { ShareSchema } from '../types/share';

import type { CreditCardFormState } from '../calculators/CreditCardPayoffCalculatorPage';
import type { HourlyFormState } from '../calculators/HourlyIncomeCalculatorPage';
import type { LoanFormState } from '../calculators/LoanPaymentCalculatorPage';
import type { MortgageFormState } from '../calculators/MortgageCalculatorPage';
import type { SavingsFormState } from '../calculators/SavingsGrowthCalculatorPage';

export const hourlyShareSchema: ShareSchema<HourlyFormState> = {
  fields: [
    { key: 'hourlyRate', param: 'rate', type: 'number', min: 0, max: 1000000 },
    { key: 'hoursPerWeek', param: 'hours', type: 'number', min: 0, max: 168 },
    { key: 'weeksPerYear', param: 'weeks', type: 'number', min: 0, max: 52 },
    { key: 'withholdingRate', param: 'deduction', type: 'number', min: 0, max: 100 },
  ],
};

export const loanShareSchema: ShareSchema<LoanFormState> = {
  fields: [
    { key: 'loanAmount', param: 'principal', type: 'number', min: 0, max: 1000000000 },
    { key: 'interestRate', param: 'rate', type: 'number', min: 0, max: 100 },
    { key: 'loanYears', param: 'years', type: 'number', min: 1, max: 50, integer: true },
  ],
};

export const savingsShareSchema: ShareSchema<SavingsFormState> = {
  fields: [
    { key: 'initialBalance', param: 'start', type: 'number', min: 0, max: 1000000000 },
    { key: 'monthlyContribution', param: 'contrib', type: 'number', min: 0, max: 1000000000 },
    { key: 'annualReturn', param: 'return', type: 'number', min: 0, max: 100 },
    { key: 'years', param: 'years', type: 'number', min: 1, max: 100, integer: true },
    { key: 'contributionTiming', param: 'timing', type: 'enum', options: ['beginning', 'end'] },
  ],
};

export const creditCardShareSchema: ShareSchema<CreditCardFormState> = {
  fields: [
    { key: 'balance', param: 'balance', type: 'number', min: 0, max: 1000000000 },
    { key: 'annualRate', param: 'apr', type: 'number', min: 0, max: 100 },
    { key: 'mode', param: 'mode', type: 'enum', options: ['payment', 'months'] },
    {
      key: 'monthlyPaymentAmount',
      param: 'payment',
      type: 'number',
      min: 0,
      max: 1000000000,
      include: (values) => values.mode === 'payment',
    },
    {
      key: 'targetMonths',
      param: 'months',
      type: 'number',
      min: 1,
      max: 1200,
      integer: true,
      include: (values) => values.mode === 'months',
    },
  ],
};

export const mortgageShareSchema: ShareSchema<MortgageFormState> = {
  fields: [
    { key: 'homePrice', param: 'price', type: 'number', min: 0, max: 1000000000 },
    { key: 'downPayment', param: 'down', type: 'number', min: 0, max: 1000000000 },
    { key: 'interestRate', param: 'rate', type: 'number', min: 0, max: 100 },
    { key: 'loanTermYears', param: 'years', type: 'number', min: 1, max: 50, integer: true },
    { key: 'annualPropertyTax', param: 'tax', type: 'number', min: 0, max: 1000000000 },
    { key: 'annualInsurance', param: 'insurance', type: 'number', min: 0, max: 1000000000 },
    { key: 'hoaMonthly', param: 'hoa', type: 'number', min: 0, max: 1000000000 },
    { key: 'mortgageInsuranceMonthly', param: 'mi', type: 'number', min: 0, max: 1000000000 },
  ],
};
