import { formatCurrency, formatPercent, formatYearsMonths } from './format';

export function formatHourlyCopySummary(result: {
  annualGross: number;
  monthlyGross: number;
  weeklyGross: number;
  annualTakeHome: number;
  monthlyTakeHome: number;
}, withholdingRate: number) {
  return [
    `Estimated annual gross income: ${formatCurrency(result.annualGross)}.`,
    `Estimated monthly gross income: ${formatCurrency(result.monthlyGross)}.`,
    `Estimated weekly gross income: ${formatCurrency(result.weeklyGross)}.`,
    `Estimated annual take-home income: ${formatCurrency(result.annualTakeHome)}.`,
    `Estimated monthly take-home income: ${formatCurrency(result.monthlyTakeHome)}.`,
    `Flat deduction estimate used: ${formatPercent(withholdingRate)}.`,
  ].join('\n');
}

export function formatSalaryCopySummary(result: {
  monthlyGross: number;
  selectedPayPeriodGross: number;
  selectedPayPeriodTakeHome: number;
  monthlyTakeHome: number;
  hourlyEquivalent: number;
}, withholdingRate: number) {
  return [
    `Estimated monthly take-home income: ${formatCurrency(result.monthlyTakeHome)}.`,
    `Estimated gross monthly salary: ${formatCurrency(result.monthlyGross)}.`,
    `Estimated gross selected pay period: ${formatCurrency(result.selectedPayPeriodGross)}.`,
    `Estimated take-home selected pay period: ${formatCurrency(result.selectedPayPeriodTakeHome)}.`,
    `Effective hourly equivalent: ${formatCurrency(result.hourlyEquivalent)}.`,
    `Flat deduction estimate used: ${formatPercent(withholdingRate)}.`,
  ].join('\n');
}

export function formatLoanCopySummary(result: {
  payment: number;
  totalInterest: number;
  totalPayments: number;
  totalMonths: number;
}) {
  return [
    `Estimated monthly payment: ${formatCurrency(result.payment)}.`,
    `Total interest: ${formatCurrency(result.totalInterest)}.`,
    `Total paid: ${formatCurrency(result.totalPayments)}.`,
    `Term: ${result.totalMonths} months.`,
  ].join('\n');
}

export function formatSavingsCopySummary(result: {
  futureBalance: number;
  totalContributions: number;
  interestEarned: number;
}, contributionTiming: 'beginning' | 'end') {
  return [
    `Projected future balance: ${formatCurrency(result.futureBalance)}.`,
    `Total contributions: ${formatCurrency(result.totalContributions)}.`,
    `Estimated interest earned: ${formatCurrency(result.interestEarned)}.`,
    `Contribution timing: ${contributionTiming === 'beginning' ? 'Beginning of each month' : 'End of each month'}.`,
  ].join('\n');
}

export function formatCreditCardCopySummary(result: {
  paymentToUse: number;
  payoff: { months: number; totalInterest: number; totalPaid: number };
}) {
  return [
    `Estimated payoff time: ${formatYearsMonths(result.payoff.months)}.`,
    `Monthly payment used: ${formatCurrency(result.paymentToUse)}.`,
    `Total interest: ${formatCurrency(result.payoff.totalInterest)}.`,
    `Total amount paid: ${formatCurrency(result.payoff.totalPaid)}.`,
  ].join('\n');
}

export function formatMortgageCopySummary(result: {
  totalMonthlyPayment: number;
  principalAndInterest: number;
  propertyTax: number;
  insurance: number;
  hoa: number;
  mortgageInsurance: number;
}) {
  return [
    `Estimated total monthly housing payment: ${formatCurrency(result.totalMonthlyPayment)}.`,
    `Principal and interest: ${formatCurrency(result.principalAndInterest)}.`,
    `Property tax: ${formatCurrency(result.propertyTax)}.`,
    `Insurance: ${formatCurrency(result.insurance)}.`,
    `HOA: ${formatCurrency(result.hoa)}.`,
    `Mortgage insurance: ${formatCurrency(result.mortgageInsurance)}.`,
  ].join('\n');
}

export function formatBudgetCopySummary(values: {
  monthlyIncome: number;
  totalExpenses: number;
  remainingCash: number;
  savingsRate: number;
}) {
  return [
    `Monthly income: ${formatCurrency(values.monthlyIncome)}.`,
    `Monthly expenses: ${formatCurrency(values.totalExpenses)}.`,
    `Remaining cash: ${formatCurrency(values.remainingCash)}.`,
    `Savings rate: ${formatPercent(values.savingsRate)}.`,
  ].join('\n');
}

export function formatRetirementCopySummary(result: {
  inflationAdjustedBalance: number;
  projectedNominalBalance: number;
  totalContributions: number;
  estimatedGrowth: number;
}) {
  return [
    `Projected inflation-adjusted retirement balance: ${formatCurrency(result.inflationAdjustedBalance)}.`,
    `Projected nominal balance: ${formatCurrency(result.projectedNominalBalance)}.`,
    `Total contributions: ${formatCurrency(result.totalContributions)}.`,
    `Estimated growth: ${formatCurrency(result.estimatedGrowth)}.`,
  ].join('\n');
}
