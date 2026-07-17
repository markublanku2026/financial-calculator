import type {
  AmortizationRow,
  BudgetCategory,
  SavingsContributionTiming,
  YearlyBreakdownRow,
} from '../types/financial';

const EPSILON = 0.0000001;
const MAX_AMORTIZATION_ROWS = 1200;

export function normalizeNumber(value: string | number): number {
  const nextValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(nextValue) ? nextValue : 0;
}

export function clampMin(value: number, minimum = 0): number {
  return value < minimum ? minimum : value;
}

export function monthlyRate(aprPercent: number): number {
  return aprPercent / 100 / 12;
}

export function monthlyPayment(principal: number, annualRatePercent: number, totalMonths: number): number {
  if (!Number.isFinite(principal) || !Number.isFinite(annualRatePercent) || !Number.isFinite(totalMonths)) {
    return 0;
  }

  if (principal <= 0 || totalMonths <= 0) {
    return 0;
  }

  const rate = monthlyRate(annualRatePercent);
  if (Math.abs(rate) < EPSILON) {
    return principal / totalMonths;
  }

  return (principal * rate) / (1 - (1 + rate) ** -totalMonths);
}

export function buildAmortizationSchedule(
  principal: number,
  annualRatePercent: number,
  totalMonths: number,
  paymentAmount = monthlyPayment(principal, annualRatePercent, totalMonths),
): AmortizationRow[] {
  if (principal <= 0 || totalMonths <= 0 || paymentAmount <= 0) {
    return [];
  }

  const rate = monthlyRate(annualRatePercent);
  const rows: AmortizationRow[] = [];
  let balance = principal;

  for (
    let paymentNumber = 1;
    paymentNumber <= totalMonths && paymentNumber <= MAX_AMORTIZATION_ROWS && balance > 0.01;
    paymentNumber += 1
  ) {
    const interest = Math.max(0, rate === 0 ? 0 : balance * rate);
    if (paymentAmount <= interest && balance > 0.01) {
      return [];
    }

    const principalPaid = Math.min(balance, paymentAmount - interest);
    const payment = principalPaid + interest;
    balance = Math.max(0, balance - principalPaid);

    rows.push({
      paymentNumber,
      payment,
      principal: principalPaid,
      interest,
      balance,
    });
  }

  return rows;
}

export function calculateHourlyIncome({
  hourlyRate,
  hoursPerWeek,
  weeksPerYear,
  annualHours,
  withholdingRate,
}: {
  hourlyRate: number;
  hoursPerWeek: number;
  weeksPerYear: number;
  annualHours: number;
  withholdingRate: number;
}) {
  const weeklyGross = hourlyRate * hoursPerWeek;
  const annualGross = weeklyGross * weeksPerYear;
  const monthlyGross = annualGross / 12;
  const withholdingMultiplier = 1 - withholdingRate / 100;
  const annualTakeHome = annualGross * withholdingMultiplier;
  const monthlyTakeHome = annualTakeHome / 12;
  const weeklyTakeHome = weeklyGross * withholdingMultiplier;

  return {
    annualGross,
    monthlyGross,
    weeklyGross,
    annualTakeHome,
    monthlyTakeHome,
    weeklyTakeHome,
    effectiveHourly: annualHours > 0 ? annualGross / annualHours : 0,
  };
}

export function calculateSalaryBreakdown({
  annualSalary,
  hoursPerWeek,
  weeksPerYear,
  payPeriods,
  withholdingRate,
}: {
  annualSalary: number;
  hoursPerWeek: number;
  weeksPerYear: number;
  payPeriods: number;
  withholdingRate: number;
}) {
  const monthlyGross = annualSalary / 12;
  const weeklyGross = annualSalary / weeksPerYear;
  const selectedPayPeriodGross = annualSalary / payPeriods;
  const hourlyEquivalent = annualSalary / (hoursPerWeek * weeksPerYear);
  const withholdingMultiplier = 1 - withholdingRate / 100;

  return {
    monthlyGross,
    weeklyGross,
    selectedPayPeriodGross,
    biweeklyGross: annualSalary / 26,
    hourlyEquivalent,
    annualTakeHome: annualSalary * withholdingMultiplier,
    monthlyTakeHome: monthlyGross * withholdingMultiplier,
    selectedPayPeriodTakeHome: selectedPayPeriodGross * withholdingMultiplier,
  };
}

export function buildSavingsBreakdown(
  initialBalance: number,
  monthlyContribution: number,
  annualRatePercent: number,
  years: number,
  compoundsPerYear: number,
  contributionTiming: SavingsContributionTiming,
): YearlyBreakdownRow[] {
  const periods = Math.max(0, Math.round(years * compoundsPerYear));
  const ratePerPeriod = annualRatePercent / 100 / compoundsPerYear;
  const contributionPerPeriod = (monthlyContribution * 12) / compoundsPerYear;
  const rows: YearlyBreakdownRow[] = [];

  let balance = initialBalance;
  let runningContributions = initialBalance;
  let currentYearInterest = 0;

  for (let period = 1; period <= periods; period += 1) {
    if (contributionTiming === 'beginning') {
      balance += contributionPerPeriod;
      runningContributions += contributionPerPeriod;
    }

    const interest = balance * ratePerPeriod;
    balance += interest;
    currentYearInterest += interest;

    if (contributionTiming === 'end') {
      balance += contributionPerPeriod;
      runningContributions += contributionPerPeriod;
    }

    if (period % compoundsPerYear === 0) {
      rows.push({
        year: period / compoundsPerYear,
        contributions: runningContributions,
        interestEarned: currentYearInterest,
        endBalance: balance,
      });
      currentYearInterest = 0;
    }
  }

  return rows;
}

export function calculateSavingsGrowth(
  initialBalance: number,
  monthlyContribution: number,
  annualRatePercent: number,
  years: number,
  compoundsPerYear = 12,
  contributionTiming: SavingsContributionTiming = 'end',
): { futureBalance: number; totalContributions: number; interestEarned: number; breakdown: YearlyBreakdownRow[] } {
  const breakdown = buildSavingsBreakdown(
    initialBalance,
    monthlyContribution,
    annualRatePercent,
    years,
    compoundsPerYear,
    contributionTiming,
  );
  const futureBalance = breakdown.at(-1)?.endBalance ?? initialBalance;
  const totalContributions = initialBalance + monthlyContribution * 12 * years;
  return {
    futureBalance,
    totalContributions,
    interestEarned: futureBalance - totalContributions,
    breakdown,
  };
}

export function calculateMortgage({
  homePrice,
  downPayment,
  annualRatePercent,
  loanTermYears,
  annualPropertyTax,
  annualInsurance,
  hoaMonthly,
  mortgageInsuranceMonthly,
}: {
  homePrice: number;
  downPayment: number;
  annualRatePercent: number;
  loanTermYears: number;
  annualPropertyTax: number;
  annualInsurance: number;
  hoaMonthly: number;
  mortgageInsuranceMonthly: number;
}) {
  const loanAmount = Math.max(0, homePrice - downPayment);
  const loanMonths = loanTermYears * 12;
  const principalAndInterest = monthlyPayment(loanAmount, annualRatePercent, loanMonths);
  const propertyTax = annualPropertyTax / 12;
  const insurance = annualInsurance / 12;
  const schedule = buildAmortizationSchedule(loanAmount, annualRatePercent, loanMonths, principalAndInterest);
  const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0);
  const totalPrincipalPaid = schedule.reduce((sum, row) => sum + row.principal, 0);
  const totalPrincipalAndInterestPaid = schedule.reduce((sum, row) => sum + row.payment, 0);
  const totalMonthlyPayment =
    principalAndInterest + propertyTax + insurance + hoaMonthly + mortgageInsuranceMonthly;
  const totalLoanCost = totalPrincipalPaid + totalInterest;

  return {
    loanAmount,
    principalAndInterest,
    propertyTax,
    insurance,
    hoa: hoaMonthly,
    mortgageInsurance: mortgageInsuranceMonthly,
    totalMonthlyPayment,
    totalInterest,
    totalLoanCost,
    totalPrincipalPaid,
    totalPrincipalAndInterestPaid,
    schedule,
  };
}

export function calculateCreditCardPayoffWithPayment(
  balance: number,
  annualRatePercent: number,
  monthlyPaymentAmount: number,
): {
  months: number;
  totalInterest: number;
  totalPaid: number;
  schedule: AmortizationRow[];
  paymentTooLow: boolean;
} {
  if (balance <= 0) {
    return {
      months: 0,
      totalInterest: 0,
      totalPaid: 0,
      schedule: [],
      paymentTooLow: false,
    };
  }

  const rate = monthlyRate(annualRatePercent);
  const firstMonthInterest = balance * rate;
  if (monthlyPaymentAmount <= firstMonthInterest + EPSILON) {
    return {
      months: 0,
      totalInterest: 0,
      totalPaid: 0,
      schedule: [],
      paymentTooLow: true,
    };
  }

  const schedule: AmortizationRow[] = [];
  let remainingBalance = balance;
  let months = 0;
  let totalInterest = 0;
  let totalPaid = 0;

  while (remainingBalance > 0.01 && months < MAX_AMORTIZATION_ROWS) {
    months += 1;
    const interest = Math.max(0, remainingBalance * rate);
    const principal = Math.min(remainingBalance, monthlyPaymentAmount - interest);
    const payment = principal + interest;
    remainingBalance = Math.max(0, remainingBalance - principal);
    totalInterest += interest;
    totalPaid += payment;
    schedule.push({
      paymentNumber: months,
      payment,
      principal,
      interest,
      balance: remainingBalance,
    });
  }

  return {
    months,
    totalInterest,
    totalPaid,
    schedule,
    paymentTooLow: false,
  };
}

export function calculateCreditCardPaymentForTargetMonths(
  balance: number,
  annualRatePercent: number,
  targetMonths: number,
): number {
  return monthlyPayment(balance, annualRatePercent, targetMonths);
}

export function calculateBudgetSummary(monthlyIncome: number, categories: BudgetCategory[]) {
  const totalExpenses = categories.reduce((sum, category) => sum + category.amount, 0);
  const remainingCash = monthlyIncome - totalExpenses;
  const savingsRate = monthlyIncome === 0 ? 0 : (remainingCash / monthlyIncome) * 100;
  const percentages = categories.map((category) => ({
    ...category,
    percentage: monthlyIncome === 0 ? 0 : (category.amount / monthlyIncome) * 100,
  }));

  return {
    totalExpenses,
    remainingCash,
    savingsRate,
    percentages,
    overBudget: totalExpenses > monthlyIncome,
  };
}

export function calculateRetirementProjection({
  currentAge,
  retirementAge,
  currentSavings,
  monthlyContribution,
  annualReturnPercent,
  inflationPercent,
  contributionTiming,
}: {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
  annualReturnPercent: number;
  inflationPercent: number;
  contributionTiming: SavingsContributionTiming;
}) {
  const years = Math.max(0, retirementAge - currentAge);
  const nominal = calculateSavingsGrowth(
    currentSavings,
    monthlyContribution,
    annualReturnPercent,
    years,
    12,
    contributionTiming,
  );
  const inflationFactor = (1 + inflationPercent / 100) ** years;
  const inflationAdjustedBalance = inflationFactor === 0 ? nominal.futureBalance : nominal.futureBalance / inflationFactor;

  return {
    yearsToRetirement: years,
    projectedNominalBalance: nominal.futureBalance,
    inflationAdjustedBalance,
    totalContributions: nominal.totalContributions,
    estimatedGrowth: nominal.interestEarned,
    breakdown: nominal.breakdown,
  };
}
