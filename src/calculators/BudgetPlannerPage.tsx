import { useMemo, useState, type FormEvent } from 'react';

import { CalculationAssumptions } from '../components/CalculationAssumptions';
import { CalculatorActions } from '../components/CalculatorActions';
import { ChartCard } from '../components/ChartCard';
import { CopyResultButton } from '../components/CopyResultButton';
import { EmptyResultState } from '../components/EmptyResultState';
import { FormField } from '../components/FormField';
import { InfoBlock } from '../components/InfoBlock';
import { InfoNotice } from '../components/InfoNotice';
import { PrimaryResult } from '../components/PrimaryResult';
import { ResponsiveTable } from '../components/ResponsiveTable';
import { ResultsPanel } from '../components/ResultsPanel';
import { SecondaryResultGrid } from '../components/SecondaryResultGrid';
import { SectionHeading } from '../components/SectionHeading';
import { SimpleBarChart } from '../components/SimpleBarChart';
import { CalculatorShell } from './CalculatorShell';
import { formatBudgetCopySummary } from '../utils/copySummaries';
import { calculateBudgetSummary } from '../utils/financial';
import { formatCurrency, formatPercent } from '../utils/format';
import { buildCalculatorStructuredData } from '../utils/structuredData';
import { validateNumberField, validateTextField } from '../utils/validation';

type CategoryState = {
  id: string;
  name: string;
  amount: string;
};

const defaultCategories: CategoryState[] = [
  { id: 'housing', name: 'Housing', amount: '1800' },
  { id: 'transportation', name: 'Transportation', amount: '450' },
  { id: 'food', name: 'Food', amount: '650' },
  { id: 'utilities', name: 'Utilities', amount: '300' },
  { id: 'insurance', name: 'Insurance', amount: '250' },
  { id: 'entertainment', name: 'Entertainment', amount: '200' },
];

const budgetFaqs = [
  {
    question: 'What happens when income is zero?',
    answer:
      'Percentages are shown as 0% instead of dividing by zero. The planner still reports total expenses and remaining cash safely.',
  },
  {
    question: 'Can I add my own expense categories?',
    answer: 'Yes. Use Add category to create more rows and edit both the category name and amount.',
  },
  {
    question: 'Does this connect to bank accounts?',
    answer: 'No. This local-only version does not connect to any external financial service or account.',
  },
  {
    question: 'What does savings rate mean here?',
    answer:
      'Savings rate is remaining cash divided by monthly income. A negative number means planned expenses exceed planned income.',
  },
];

function randomId() {
  return `category-${Math.random().toString(36).slice(2, 10)}`;
}

export function BudgetPlannerPage() {
  const [monthlyIncome, setMonthlyIncome] = useState('5200');
  const [categories, setCategories] = useState<CategoryState[]>(defaultCategories);
  const [submitted, setSubmitted] = useState(false);
  const [incomeError, setIncomeError] = useState<string | undefined>();
  const [categoryErrors, setCategoryErrors] = useState<Record<string, { name?: string; amount?: string }>>({});
  const [result, setResult] = useState<{
    monthlyIncome: number;
    summary: ReturnType<typeof calculateBudgetSummary>;
  } | null>(null);

  const expenseChartData = useMemo(() => {
    if (!result) {
      return [];
    }

    const positiveCategories = result.summary.percentages
      .filter((item) => item.amount > 0)
      .sort((left, right) => right.amount - left.amount);

    return positiveCategories.map((item) => {
      const expenseShare = result.summary.totalExpenses > 0 ? (item.amount / result.summary.totalExpenses) * 100 : 0;
      return {
        label: item.name,
        value: item.amount,
        displayValue: `${formatCurrency(item.amount)}${result.summary.totalExpenses > 0 ? ` (${formatPercent(expenseShare)})` : ''}`,
        pattern: 'solid' as const,
      };
    });
  }, [result]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    const incomeValidation = validateNumberField(monthlyIncome, 'Monthly income', { min: 0 });
    const nextCategoryErrors: Record<string, { name?: string; amount?: string }> = {};
    const normalizedCategories = categories.map((category) => {
      const nameValidation = validateTextField(category.name, 'Expense category name');
      const amountValidation = validateNumberField(category.amount, `${category.name || 'Expense category'} amount`, {
        min: 0,
      });
      const fieldErrors: { name?: string; amount?: string } = {};
      if (nameValidation.error) fieldErrors.name = nameValidation.error;
      if (amountValidation.error) fieldErrors.amount = amountValidation.error;
      if (fieldErrors.name || fieldErrors.amount) {
        nextCategoryErrors[category.id] = fieldErrors;
      }
      return {
        id: category.id,
        name: nameValidation.value ?? category.name,
        amount: amountValidation.value ?? 0,
      };
    });

    setIncomeError(incomeValidation.error);
    setCategoryErrors(nextCategoryErrors);

    if (!incomeValidation.error && !Object.keys(nextCategoryErrors).length) {
      setResult({
        monthlyIncome: incomeValidation.value ?? 0,
        summary: calculateBudgetSummary(incomeValidation.value ?? 0, normalizedCategories),
      });
    }
  };

  const description =
    'Plan monthly income and expenses with editable categories, safe zero-income handling, and a spending mix that updates from your last valid calculation.';

  return (
    <CalculatorShell
      slug="budget-planner"
      title="Budget Planner"
      description={description}
      metaDescription="Plan monthly income and expenses with editable categories, savings rate, and overspending warnings that handle zero income safely."
      path="/calculators/budget-planner"
      structuredData={buildCalculatorStructuredData('Budget Planner', description, '/calculators/budget-planner', budgetFaqs)}
      form={
        <section className="card">
          <SectionHeading title="Inputs" eyebrow="Calculator form" />
          <form className="calculator-form" noValidate onSubmit={handleSubmit}>
            <FormField
              id="budget-income"
              label="Monthly income"
              error={submitted ? incomeError : undefined}
              prefix="$"
              step="0.01"
              type="number"
              value={monthlyIncome}
              onChange={(event) => setMonthlyIncome(event.target.value)}
            />
            {categories.map((category, index) => (
              <div className="content-grid" key={category.id}>
                <FormField
                  id={`category-name-${category.id}`}
                  label={`Expense category ${index + 1}`}
                  error={submitted ? categoryErrors[category.id]?.name : undefined}
                  type="text"
                  value={category.name}
                  onChange={(event) =>
                    setCategories((current) =>
                      current.map((item) => (item.id === category.id ? { ...item, name: event.target.value } : item)),
                    )
                  }
                />
                <FormField
                  id={`category-amount-${category.id}`}
                  label={`${category.name || `Category ${index + 1}`} amount`}
                  error={submitted ? categoryErrors[category.id]?.amount : undefined}
                  prefix="$"
                  step="0.01"
                  type="number"
                  value={category.amount}
                  onChange={(event) =>
                    setCategories((current) =>
                      current.map((item) => (item.id === category.id ? { ...item, amount: event.target.value } : item)),
                    )
                  }
                />
              </div>
            ))}
            <CalculatorActions>
              <button
                type="button"
                onClick={() =>
                  setCategories((current) => [
                    ...current,
                    { id: randomId(), name: `Category ${current.length + 1}`, amount: '0' },
                  ])
                }
              >
                Add category
              </button>
              <button type="submit">Calculate</button>
              <button
                type="button"
                onClick={() => {
                  setMonthlyIncome('5200');
                  setCategories(defaultCategories);
                  setSubmitted(false);
                  setIncomeError(undefined);
                  setCategoryErrors({});
                  setResult(null);
                }}
              >
                Start over
              </button>
            </CalculatorActions>
          </form>
        </section>
      }
      results={
        <ResultsPanel title="Results">
          {result ? (
            <div className="content-stack">
              <PrimaryResult
                label="Estimated monthly remaining cash"
                value={formatCurrency(result.summary.remainingCash)}
                detail={`Savings rate based on the last valid calculation: ${formatPercent(result.summary.savingsRate)}.`}
              />
              <CopyResultButton
                getText={() =>
                  formatBudgetCopySummary({
                    monthlyIncome: result.monthlyIncome,
                    totalExpenses: result.summary.totalExpenses,
                    remainingCash: result.summary.remainingCash,
                    savingsRate: result.summary.savingsRate,
                  })
                }
              />
              <SecondaryResultGrid
                items={[
                  { label: 'Monthly income', value: formatCurrency(result.monthlyIncome) },
                  { label: 'Total expenses', value: formatCurrency(result.summary.totalExpenses) },
                  { label: 'Savings rate', value: formatPercent(result.summary.savingsRate) },
                  {
                    label: 'Budget status',
                    value: result.summary.overBudget ? 'Expenses exceed income' : 'Within income',
                    tone: result.summary.overBudget ? 'danger' : 'success',
                  },
                ]}
              />
              <InfoNotice
                tone={result.summary.overBudget ? 'warning' : 'info'}
                title={result.summary.overBudget ? 'Budget warning' : 'Budget note'}
              >
                {result.summary.overBudget
                  ? 'Planned expenses exceed planned income. Review the category table below to see which amounts are consuming the monthly budget.'
                  : 'Category percentages below are based on the last valid monthly income. If income is zero, category percentages stay at 0%.'}
              </InfoNotice>
              <ChartCard
                title="Expense distribution"
                summary={
                  <p>
                    Remaining cash is shown separately from expense categories. Expense-category percentages in this chart are based on total expenses, and they stay at 0% when there are no positive expenses.
                  </p>
                }
              >
                {expenseChartData.length ? (
                  <SimpleBarChart
                    ariaLabel="Budget expense distribution by category"
                    data={expenseChartData}
                  />
                ) : (
                  <p className="muted">No positive expense categories are available to chart yet.</p>
                )}
              </ChartCard>
              <ResponsiveTable
                title="Category percentages"
                headers={['Category', 'Amount', 'Percent of income']}
                rows={result.summary.percentages.map((row) => [
                  row.name,
                  formatCurrency(row.amount),
                  formatPercent(row.percentage),
                ])}
              />
            </div>
          ) : (
            <EmptyResultState
              title="No result yet"
              description="Enter monthly income and expense categories, then select Calculate to see remaining cash and category percentages."
            />
          )}
        </ResultsPanel>
      }
      info={
        <div className="content-stack">
          <CalculationAssumptions
            items={[
              { label: 'Monthly period', value: 'All values are treated as monthly amounts.' },
              { label: 'User-entered values', value: 'The planner uses only the income and expense amounts you enter.' },
              { label: 'Tax handling', value: 'No automatic tax, withholding, or payroll estimate is applied.' },
              {
                label: 'Divide-by-zero protection',
                value: 'If monthly income is zero, category percentages remain at 0% instead of dividing by zero.',
              },
            ]}
          />
          <InfoBlock
            formula="Remaining cash = monthly income - total monthly expenses. Savings rate = remaining cash ÷ monthly income."
            explanation="This planner is intentionally simple and local-only. It focuses on cash-flow planning, not transaction tracking. When income is zero, percentages are held at 0% to avoid division errors and misleading output."
            example={{
              title: 'Worked example',
              description:
                'If monthly income is $5,200 and planned expenses total $3,650, remaining cash is $1,550 and the savings rate is about 29.81%.',
            }}
            faqs={budgetFaqs}
            related={[
              { label: 'Salary Calculator', to: '/calculators/salary' },
              { label: 'Savings Growth Calculator', to: '/calculators/savings-growth' },
              { label: 'Retirement Calculator', to: '/calculators/retirement' },
            ]}
            disclaimer="Budget outputs are planning estimates only and do not replace a detailed personal financial review."
          />
        </div>
      }
    />
  );
}
