import { describe, expect, it } from 'vitest';

import {
  buildAmortizationSchedule,
  calculateBudgetSummary,
  calculateCreditCardPaymentForTargetMonths,
  calculateCreditCardPayoffWithPayment,
  calculateHourlyIncome,
  calculateMortgage,
  calculateRetirementProjection,
  calculateSalaryBreakdown,
  calculateSavingsGrowth,
  monthlyPayment,
} from '../utils/financial';

describe('financial formulas', () => {
  it('calculates zero-interest loan payments', () => {
    expect(monthlyPayment(12000, 0, 24)).toBe(500);
  });

  it('calculates amortized payments with interest', () => {
    expect(monthlyPayment(25000, 6.5, 60)).toBeCloseTo(489.153705, 6);
  });

  it('builds an amortization schedule that ends near zero', () => {
    const payment = monthlyPayment(10000, 7, 36);
    const schedule = buildAmortizationSchedule(10000, 7, 36, payment);
    expect(schedule).toHaveLength(36);
    expect(schedule.at(-1)?.balance ?? 1).toBeLessThan(0.02);
  });

  it('reconciles amortization totals to principal and interest', () => {
    const payment = monthlyPayment(25000, 6.5, 60);
    const schedule = buildAmortizationSchedule(25000, 6.5, 60, payment);
    const principal = schedule.reduce((sum, row) => sum + row.principal, 0);
    const interest = schedule.reduce((sum, row) => sum + row.interest, 0);
    const total = schedule.reduce((sum, row) => sum + row.payment, 0);

    expect(principal).toBeCloseTo(25000, 6);
    expect(total).toBeCloseTo(principal + interest, 6);
  });

  it('calculates hourly income including take-home estimate', () => {
    const result = calculateHourlyIncome({
      hourlyRate: 28,
      hoursPerWeek: 40,
      weeksPerYear: 50,
      annualHours: 2000,
      withholdingRate: 22,
    });

    expect(result.annualGross).toBe(56000);
    expect(result.monthlyGross).toBeCloseTo(4666.666667, 6);
    expect(result.weeklyGross).toBe(1120);
    expect(result.annualTakeHome).toBe(43680);
  });

  it('calculates salary breakdown including pay periods', () => {
    const result = calculateSalaryBreakdown({
      annualSalary: 90000,
      hoursPerWeek: 40,
      weeksPerYear: 52,
      payPeriods: 24,
      withholdingRate: 24,
    });

    expect(result.selectedPayPeriodGross).toBe(3750);
    expect(result.selectedPayPeriodTakeHome).toBe(2850);
    expect(result.hourlyEquivalent).toBeCloseTo(43.2692307, 6);
  });

  it('projects savings growth with end-of-month contributions', () => {
    const result = calculateSavingsGrowth(10000, 500, 5, 10, 12, 'end');
    expect(result.totalContributions).toBe(70000);
    expect(result.futureBalance).toBeGreaterThan(result.totalContributions);
    expect(result.breakdown).toHaveLength(10);
  });

  it('projects higher savings when contributions happen at the beginning of the month', () => {
    const endResult = calculateSavingsGrowth(10000, 500, 5, 10, 12, 'end');
    const beginningResult = calculateSavingsGrowth(10000, 500, 5, 10, 12, 'beginning');
    expect(beginningResult.futureBalance).toBeGreaterThan(endResult.futureBalance);
  });

  it('detects a credit card payment that is too low', () => {
    const result = calculateCreditCardPayoffWithPayment(10000, 24, 100);
    expect(result.paymentTooLow).toBe(true);
    expect(result.schedule).toHaveLength(0);
  });

  it('calculates the required payment for a target credit-card payoff period', () => {
    const payment = calculateCreditCardPaymentForTargetMonths(8000, 19.99, 36);
    const payoff = calculateCreditCardPayoffWithPayment(8000, 19.99, payment);
    expect(payment).toBeGreaterThan(0);
    expect(payoff.months).toBeLessThanOrEqual(36);
  });

  it('calculates credit card payoff for a valid payment', () => {
    const result = calculateCreditCardPayoffWithPayment(8000, 19.99, 250);
    expect(result.paymentTooLow).toBe(false);
    expect(result.months).toBeGreaterThan(0);
    expect(result.totalPaid).toBeGreaterThan(8000);
    expect(result.schedule.at(-1)?.balance ?? 1).toBeLessThan(0.02);
  });

  it('calculates a full mortgage payment breakdown', () => {
    const result = calculateMortgage({
      homePrice: 425000,
      downPayment: 85000,
      annualRatePercent: 6.75,
      loanTermYears: 30,
      annualPropertyTax: 4800,
      annualInsurance: 1800,
      hoaMonthly: 150,
      mortgageInsuranceMonthly: 0,
    });

    expect(result.loanAmount).toBe(340000);
    expect(result.propertyTax).toBe(400);
    expect(result.insurance).toBe(150);
    expect(result.totalMonthlyPayment).toBeGreaterThan(result.principalAndInterest);
    expect(result.schedule[0]?.paymentNumber).toBe(1);
  });

  it('reconciles mortgage principal and interest to the amortization schedule', () => {
    const result = calculateMortgage({
      homePrice: 425000,
      downPayment: 85000,
      annualRatePercent: 6.75,
      loanTermYears: 30,
      annualPropertyTax: 4800,
      annualInsurance: 1800,
      hoaMonthly: 150,
      mortgageInsuranceMonthly: 0,
    });

    expect(result.totalPrincipalPaid).toBeCloseTo(result.loanAmount, 5);
    expect(result.totalPrincipalAndInterestPaid).toBeCloseTo(result.totalLoanCost, 5);
    expect(result.schedule.at(-1)?.balance ?? 1).toBeLessThan(0.02);
  });

  it('flags over-budget plans correctly', () => {
    const summary = calculateBudgetSummary(3000, [
      { id: 'rent', name: 'Rent', amount: 1800 },
      { id: 'food', name: 'Food', amount: 700 },
      { id: 'travel', name: 'Travel', amount: 900 },
    ]);

    expect(summary.totalExpenses).toBe(3400);
    expect(summary.overBudget).toBe(true);
    expect(summary.remainingCash).toBe(-400);
  });

  it('handles zero-income budget percentages safely', () => {
    const summary = calculateBudgetSummary(0, [
      { id: 'rent', name: 'Rent', amount: 500 },
      { id: 'food', name: 'Food', amount: 250 },
    ]);

    expect(summary.savingsRate).toBe(0);
    expect(summary.percentages.every((item) => item.percentage === 0)).toBe(true);
  });

  it('calculates nominal and inflation-adjusted retirement values', () => {
    const result = calculateRetirementProjection({
      currentAge: 35,
      retirementAge: 65,
      currentSavings: 60000,
      monthlyContribution: 900,
      annualReturnPercent: 6.5,
      inflationPercent: 2.5,
      contributionTiming: 'end',
    });

    expect(result.yearsToRetirement).toBe(30);
    expect(result.projectedNominalBalance).toBeGreaterThan(result.totalContributions);
    expect(result.inflationAdjustedBalance).toBeLessThan(result.projectedNominalBalance);
  });

  it('shows higher retirement balances with beginning-of-month contributions', () => {
    const endResult = calculateRetirementProjection({
      currentAge: 35,
      retirementAge: 65,
      currentSavings: 60000,
      monthlyContribution: 900,
      annualReturnPercent: 6.5,
      inflationPercent: 2.5,
      contributionTiming: 'end',
    });
    const beginningResult = calculateRetirementProjection({
      currentAge: 35,
      retirementAge: 65,
      currentSavings: 60000,
      monthlyContribution: 900,
      annualReturnPercent: 6.5,
      inflationPercent: 2.5,
      contributionTiming: 'beginning',
    });

    expect(beginningResult.projectedNominalBalance).toBeGreaterThan(endResult.projectedNominalBalance);
  });
});
