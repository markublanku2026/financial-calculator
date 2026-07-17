import type { ComponentType } from 'react';

export type NavLinkItem = {
  label: string;
  to: string;
};

export type MetaDefinition = {
  title: string;
  description: string;
  path: string;
};

export type RelatedLink = {
  label: string;
  to: string;
};

export type FAQItem = {
  question: string;
  answer: string;
};

export type ExampleItem = {
  title: string;
  description: string;
};

export type CalculatorCategory = 'Income' | 'Borrowing' | 'Home' | 'Saving' | 'Debt' | 'Planning';

export type CalculatorDefinition = {
  slug: string;
  title: string;
  category: CalculatorCategory;
  description: string;
  route: string;
  keywords: string[];
  aliases?: string[];
  component: ComponentType;
};

export type AmortizationRow = {
  paymentNumber: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
};

export type YearlyBreakdownRow = {
  year: number;
  contributions: number;
  interestEarned: number;
  endBalance: number;
};

export type BudgetCategory = {
  id: string;
  name: string;
  amount: number;
};

export type SavingsContributionTiming = 'beginning' | 'end';
export type CurrencyCode = 'USD';

export type UserPreferences = {
  currency: CurrencyCode;
  reducedMotion: boolean;
  schedulesExpanded: boolean;
  favorites: string[];
  recentCalculators: string[];
};
