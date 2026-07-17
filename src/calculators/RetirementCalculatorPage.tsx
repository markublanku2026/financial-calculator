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
import { formatRetirementCopySummary } from '../utils/copySummaries';
import { calculateRetirementProjection } from '../utils/financial';
import { formatCurrency } from '../utils/format';
import { buildCalculatorStructuredData } from '../utils/structuredData';
import { hasErrors, type FieldErrors, validateNumberField } from '../utils/validation';
import type { SavingsContributionTiming } from '../types/financial';

type RetirementFields =
  | 'currentAge'
  | 'retirementAge'
  | 'currentSavings'
  | 'monthlyContribution'
  | 'annualReturn'
  | 'inflation'
  | 'contributionTiming';

type RetirementFormState = Record<RetirementFields, string>;

const defaults: RetirementFormState = {
  currentAge: '35',
  retirementAge: '65',
  currentSavings: '60000',
  monthlyContribution: '900',
  annualReturn: '6.5',
  inflation: '2.5',
  contributionTiming: 'end',
};

const retirementFaqs = [
  {
    question: 'What is the difference between nominal and inflation-adjusted balance?',
    answer:
      'Nominal balance is the projected future dollar amount. Inflation-adjusted balance estimates what that amount may feel like in today’s purchasing power.',
  },
  {
    question: 'Are these returns guaranteed?',
    answer: 'No. Returns are hypothetical and market outcomes can differ substantially from a constant annual assumption.',
  },
  {
    question: 'Does this include taxes or employer match rules?',
    answer: 'No. It is a simplified projection and does not model taxes, fees, changing contributions, or plan-specific rules.',
  },
  {
    question: 'Does contribution timing matter?',
    answer:
      'Yes. Beginning-of-month contributions get one extra period of compounding compared with end-of-month contributions.',
  },
];

function validate(values: RetirementFormState): { parsed?: ReturnType<typeof parse>; errors: FieldErrors<RetirementFields> } {
  const errors: FieldErrors<RetirementFields> = {};
  const parsed = parse(values, errors);
  if (!errors.currentAge && !errors.retirementAge && (parsed.retirementAge ?? 0) <= (parsed.currentAge ?? 0)) {
    errors.retirementAge = 'Retirement age must be greater than current age.';
  }
  return hasErrors(errors) ? { errors } : { parsed, errors };
}

function parse(values: RetirementFormState, errors: FieldErrors<RetirementFields>) {
  const currentAge = validateNumberField(values.currentAge, 'Current age', {
    min: 0,
    max: 100,
    allowZero: false,
    integer: true,
  });
  const retirementAge = validateNumberField(values.retirementAge, 'Retirement age', {
    min: 1,
    max: 100,
    allowZero: false,
    integer: true,
  });
  const currentSavings = validateNumberField(values.currentSavings, 'Current savings', { min: 0 });
  const monthlyContribution = validateNumberField(values.monthlyContribution, 'Monthly contribution', { min: 0 });
  const annualReturn = validateNumberField(values.annualReturn, 'Estimated annual return', { min: 0, max: 100 });
  const inflation = validateNumberField(values.inflation, 'Inflation assumption', { min: 0, max: 100 });

  if (currentAge.error) errors.currentAge = currentAge.error;
  if (retirementAge.error) errors.retirementAge = retirementAge.error;
  if (currentSavings.error) errors.currentSavings = currentSavings.error;
  if (monthlyContribution.error) errors.monthlyContribution = monthlyContribution.error;
  if (annualReturn.error) errors.annualReturn = annualReturn.error;
  if (inflation.error) errors.inflation = inflation.error;

  return {
    currentAge: currentAge.value ?? 0,
    retirementAge: retirementAge.value ?? 0,
    currentSavings: currentSavings.value ?? 0,
    monthlyContribution: monthlyContribution.value ?? 0,
    annualReturn: annualReturn.value ?? 0,
    inflation: inflation.value ?? 0,
    contributionTiming: values.contributionTiming as SavingsContributionTiming,
  };
}

function calculateResult(input: ReturnType<typeof parse>) {
  return {
    input,
    projection: calculateRetirementProjection({
      currentAge: input.currentAge,
      retirementAge: input.retirementAge,
      currentSavings: input.currentSavings,
      monthlyContribution: input.monthlyContribution,
      annualReturnPercent: input.annualReturn,
      inflationPercent: input.inflation,
      contributionTiming: input.contributionTiming,
    }),
  };
}

export function RetirementCalculatorPage() {
  const [values, setValues] = useState<RetirementFormState>(defaults);
  const [touched, setTouched] = useState<Partial<Record<RetirementFields, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<RetirementFields>>({});
  const [result, setResult] = useState<ReturnType<typeof calculateResult> | null>(null);

  const chartData = useMemo(() => {
    if (!result) {
      return [];
    }

    return [
      {
        label: 'Total contributions',
        value: result.projection.totalContributions,
        displayValue: formatCurrency(result.projection.totalContributions),
        pattern: 'solid' as const,
      },
      {
        label: 'Estimated growth',
        value: result.projection.estimatedGrowth,
        displayValue: formatCurrency(result.projection.estimatedGrowth),
        pattern: 'stripe' as const,
      },
      {
        label: 'Projected nominal balance',
        value: result.projection.projectedNominalBalance,
        displayValue: formatCurrency(result.projection.projectedNominalBalance),
        pattern: 'dot' as const,
      },
      {
        label: 'Inflation-adjusted balance',
        value: result.projection.inflationAdjustedBalance,
        displayValue: formatCurrency(result.projection.inflationAdjustedBalance),
        pattern: 'solid' as const,
      },
    ];
  }, [result]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const next = validate(values);
    setErrors(next.errors);
    if (!hasErrors(next.errors) && next.parsed) {
      setResult(calculateResult(next.parsed));
    }
  };

  const description =
    'Project nominal and inflation-adjusted retirement balances with clearly labeled assumptions about returns, inflation, and contribution timing.';

  return (
    <CalculatorShell
      slug="retirement"
      title="Retirement Calculator"
      description={description}
      metaDescription="Estimate retirement savings with nominal and inflation-adjusted balances, contribution tracking, and explicit assumption labels."
      path="/calculators/retirement"
      structuredData={buildCalculatorStructuredData('Retirement Calculator', description, '/calculators/retirement', retirementFaqs)}
      form={
        <section className="card">
          <SectionHeading title="Inputs" eyebrow="Calculator form" />
          <form className="calculator-form" noValidate onSubmit={handleSubmit}>
            <FormField
              id="current-age"
              label="Current age"
              error={(touched.currentAge || submitted) ? errors.currentAge : undefined}
              step="1"
              type="number"
              value={values.currentAge}
              onBlur={() => setTouched((current) => ({ ...current, currentAge: true }))}
              onChange={(event) => setValues((current) => ({ ...current, currentAge: event.target.value }))}
            />
            <FormField
              id="retirement-age"
              label="Retirement age"
              error={(touched.retirementAge || submitted) ? errors.retirementAge : undefined}
              step="1"
              type="number"
              value={values.retirementAge}
              onBlur={() => setTouched((current) => ({ ...current, retirementAge: true }))}
              onChange={(event) => setValues((current) => ({ ...current, retirementAge: event.target.value }))}
            />
            <FormField
              id="current-savings"
              label="Current savings"
              error={(touched.currentSavings || submitted) ? errors.currentSavings : undefined}
              prefix="$"
              step="0.01"
              type="number"
              value={values.currentSavings}
              onBlur={() => setTouched((current) => ({ ...current, currentSavings: true }))}
              onChange={(event) => setValues((current) => ({ ...current, currentSavings: event.target.value }))}
            />
            <FormField
              id="retirement-monthly"
              label="Monthly contribution"
              error={(touched.monthlyContribution || submitted) ? errors.monthlyContribution : undefined}
              prefix="$"
              step="0.01"
              type="number"
              value={values.monthlyContribution}
              onBlur={() => setTouched((current) => ({ ...current, monthlyContribution: true }))}
              onChange={(event) => setValues((current) => ({ ...current, monthlyContribution: event.target.value }))}
            />
            <FormField
              id="retirement-return"
              label="Estimated annual return"
              error={(touched.annualReturn || submitted) ? errors.annualReturn : undefined}
              suffix="%"
              step="0.01"
              type="number"
              value={values.annualReturn}
              onBlur={() => setTouched((current) => ({ ...current, annualReturn: true }))}
              onChange={(event) => setValues((current) => ({ ...current, annualReturn: event.target.value }))}
            />
            <FormField
              id="retirement-inflation"
              label="Inflation assumption"
              error={(touched.inflation || submitted) ? errors.inflation : undefined}
              suffix="%"
              step="0.01"
              type="number"
              value={values.inflation}
              onBlur={() => setTouched((current) => ({ ...current, inflation: true }))}
              onChange={(event) => setValues((current) => ({ ...current, inflation: event.target.value }))}
            />
            <FormField id="retirement-timing" label="Contribution timing">
              <select
                value={values.contributionTiming}
                onChange={(event) => setValues((current) => ({ ...current, contributionTiming: event.target.value }))}
              >
                <option value="end">End of each month</option>
                <option value="beginning">Beginning of each month</option>
              </select>
            </FormField>
            <CalculatorActions>
              <button type="submit">Calculate</button>
              <button
                type="button"
                onClick={() => {
                  setValues(defaults);
                  setTouched({});
                  setSubmitted(false);
                  setErrors({});
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
                label="Projected inflation-adjusted retirement balance"
                value={formatCurrency(result.projection.inflationAdjustedBalance)}
                detail={`Inflation-adjusted values use ${result.input.inflation}% annual inflation and ${result.input.contributionTiming === 'beginning' ? 'beginning' : 'end'}-of-month contributions.`}
              />
              <CopyResultButton getText={() => formatRetirementCopySummary(result.projection)} />
              <SecondaryResultGrid
                items={[
                  { label: 'Projected nominal balance', value: formatCurrency(result.projection.projectedNominalBalance) },
                  { label: 'Total contributions', value: formatCurrency(result.projection.totalContributions) },
                  { label: 'Estimated growth', value: formatCurrency(result.projection.estimatedGrowth) },
                  { label: 'Years to retirement', value: `${result.projection.yearsToRetirement} years` },
                ]}
              />
              <InfoNotice tone="info" title="Projection note">
                Nominal and inflation-adjusted values are shown separately so future dollars are not confused with today’s purchasing power.
              </InfoNotice>
              <ChartCard
                title="Projection summary"
                summary={
                  <p>
                    Total contributions: {formatCurrency(result.projection.totalContributions)}. Estimated growth: {formatCurrency(result.projection.estimatedGrowth)}. Projected nominal balance: {formatCurrency(result.projection.projectedNominalBalance)}. Inflation-adjusted balance: {formatCurrency(result.projection.inflationAdjustedBalance)}. These projections are hypothetical and do not imply guaranteed returns.
                  </p>
                }
              >
                <SimpleBarChart
                  ariaLabel="Retirement projection summary comparing total contributions, estimated growth, projected nominal balance, and inflation-adjusted balance"
                  data={chartData}
                />
              </ChartCard>
              <ResponsiveTable
                title="Year-by-year projection"
                headers={['Year', 'Total contributions', 'Growth earned that year', 'Ending nominal balance']}
                rows={result.projection.breakdown.map((row) => [
                  row.year,
                  formatCurrency(row.contributions),
                  formatCurrency(row.interestEarned),
                  formatCurrency(row.endBalance),
                ])}
              />
            </div>
          ) : (
            <EmptyResultState
              title="No result yet"
              description="Enter your retirement assumptions and select Calculate to see projected nominal and inflation-adjusted balances."
            />
          )}
        </ResultsPanel>
      }
      info={
        <div className="content-stack">
          <CalculationAssumptions
            items={[
              { label: 'Return assumption', value: 'The annual return is assumed to stay constant across the projection.' },
              { label: 'Inflation assumption', value: 'Inflation is applied uniformly to estimate today’s purchasing-power equivalent.' },
              { label: 'Contribution timing', value: 'Monthly contributions occur at the beginning or end of each month based on your selection.' },
              { label: 'Excluded factors', value: 'Taxes, fees, pensions, Social Security, and employer-match rules are not modeled.' },
            ]}
          />
          <InfoBlock
            formula="Nominal retirement balance is the projected future account value. Inflation-adjusted balance = nominal balance ÷ (1 + inflation rate)^years to retirement."
            explanation="This calculator distinguishes nominal future dollars from inflation-adjusted dollars so the result is less likely to be misread. Returns are hypothetical and not guaranteed."
            example={{
              title: 'Worked example',
              description:
                'A 35-year-old with $60,000 saved who contributes $900 each month until age 65 can compare the projected nominal account value with a lower inflation-adjusted estimate that reflects today’s dollars.',
            }}
            faqs={retirementFaqs}
            related={[
              { label: 'Savings Growth Calculator', to: '/calculators/savings-growth' },
              { label: 'Budget Planner', to: '/calculators/budget-planner' },
              { label: 'Salary Calculator', to: '/calculators/salary' },
            ]}
            disclaimer="Retirement projections are hypothetical estimates only and should not be treated as investment, tax, or legal advice."
          />
        </div>
      }
    />
  );
}
