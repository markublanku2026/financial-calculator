import type { CalculatorDefinition } from '../types/financial';
import { BudgetPlannerPage } from '../calculators/BudgetPlannerPage';
import { CreditCardPayoffCalculatorPage } from '../calculators/CreditCardPayoffCalculatorPage';
import { HourlyIncomeCalculatorPage } from '../calculators/HourlyIncomeCalculatorPage';
import { LoanPaymentCalculatorPage } from '../calculators/LoanPaymentCalculatorPage';
import { MortgageCalculatorPage } from '../calculators/MortgageCalculatorPage';
import { RetirementCalculatorPage } from '../calculators/RetirementCalculatorPage';
import { SalaryCalculatorPage } from '../calculators/SalaryCalculatorPage';
import { SavingsGrowthCalculatorPage } from '../calculators/SavingsGrowthCalculatorPage';

export const calculatorDefinitions: CalculatorDefinition[] = [
  {
    slug: 'hourly-to-annual-income',
    title: 'Hourly-to-Annual Income Calculator',
    category: 'Income',
    description: 'Convert hourly wages into gross and estimated take-home annual, monthly, and weekly income.',
    route: '/calculators/hourly-to-annual-income',
    keywords: ['hourly', 'annual', 'income', 'pay'],
    aliases: ['hourly pay', 'hourly-to-annual'],
    component: HourlyIncomeCalculatorPage,
  },
  {
    slug: 'salary',
    title: 'Salary Calculator',
    category: 'Income',
    description: 'Estimate paycheck, monthly, weekly, and hourly salary equivalents.',
    route: '/calculators/salary',
    keywords: ['salary', 'paycheck', 'hourly'],
    component: SalaryCalculatorPage,
  },
  {
    slug: 'loan-payment',
    title: 'Loan Payment Calculator',
    category: 'Borrowing',
    description: 'Calculate monthly payments, total interest, and amortization details for installment loans.',
    route: '/calculators/loan-payment',
    keywords: ['loan', 'payment', 'amortization', 'personal loan'],
    component: LoanPaymentCalculatorPage,
  },
  {
    slug: 'savings-growth',
    title: 'Savings Growth Calculator',
    category: 'Saving',
    description: 'Project future balances with recurring contributions and compound growth assumptions.',
    route: '/calculators/savings-growth',
    keywords: ['savings', 'future value', 'compound'],
    aliases: ['compound interest'],
    component: SavingsGrowthCalculatorPage,
  },
  {
    slug: 'credit-card-payoff',
    title: 'Credit Card Payoff Calculator',
    category: 'Debt',
    description: 'Estimate payoff timelines with a fixed payment or a target payoff period.',
    route: '/calculators/credit-card-payoff',
    keywords: ['credit card', 'payoff', 'debt'],
    aliases: ['debt payoff'],
    component: CreditCardPayoffCalculatorPage,
  },
  {
    slug: 'mortgage',
    title: 'Mortgage Calculator',
    category: 'Home',
    description: 'Model mortgage payment components, total cost, and amortization for home financing.',
    route: '/calculators/mortgage',
    keywords: ['mortgage', 'housing', 'home'],
    aliases: ['home loan'],
    component: MortgageCalculatorPage,
  },
  {
    slug: 'budget-planner',
    title: 'Budget Planner',
    category: 'Planning',
    description: 'Plan monthly income, expenses, savings rate, and category percentages.',
    route: '/calculators/budget-planner',
    keywords: ['budget', 'expenses', 'savings'],
    aliases: ['spending plan'],
    component: BudgetPlannerPage,
  },
  {
    slug: 'retirement',
    title: 'Retirement Calculator',
    category: 'Saving',
    description: 'Estimate nominal and inflation-adjusted retirement savings projections.',
    route: '/calculators/retirement',
    keywords: ['retirement', 'inflation', 'projection'],
    component: RetirementCalculatorPage,
  },
];
