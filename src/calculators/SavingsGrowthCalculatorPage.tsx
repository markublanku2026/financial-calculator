import { useCallback, useState, type FormEvent } from 'react';

import { savingsShareSchema } from '../data/shareSchemas';
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
import { ShareCalculationButton } from '../components/ShareCalculationButton';
import { SimpleBarChart } from '../components/SimpleBarChart';
import { useShareableCalculator } from '../hooks/useShareableCalculator';
import { CalculatorShell } from './CalculatorShell';
import { formatSavingsCopySummary } from '../utils/copySummaries';
import { calculateSavingsGrowth } from '../utils/financial';
import { formatCurrency } from '../utils/format';
import { buildCalculatorStructuredData } from '../utils/structuredData';
import { hasErrors, type FieldErrors, validateNumberField } from '../utils/validation';
import type { SavingsContributionTiming } from '../types/financial';

export type SavingsFields = 'initialBalance' | 'monthlyContribution' | 'annualReturn' | 'years' | 'contributionTiming';
export type SavingsFormState = Record<SavingsFields, string>;

const defaults: SavingsFormState = {
  initialBalance: '10000',
  monthlyContribution: '500',
  annualReturn: '5',
  years: '15',
  contributionTiming: 'end',
};

const savingsFaqs = [
  { question: 'Are contributions treated as beginning or end of month deposits?', answer: 'You choose the timing. End-of-period contributions are more conservative. Beginning-of-period contributions give each deposit one extra compounding period.' },
  { question: 'Is the growth rate guaranteed?', answer: 'No. The annual return is hypothetical and constant only for estimate purposes.' },
  { question: 'Why can the final balance differ so much from contributions alone?', answer: 'Compounding means earned growth can itself earn more growth over time.' },
  { question: 'Does this include taxes or fees?', answer: 'No. It is a simplified estimate and does not account for account fees, taxes, or changing rates.' },
];

function validate(values: SavingsFormState): { parsed?: SavingsFormState; errors: FieldErrors<SavingsFields> } {
  const errors: FieldErrors<SavingsFields> = {};
  const initialBalance = validateNumberField(values.initialBalance, 'Starting balance', { min: 0 });
  const monthlyContribution = validateNumberField(values.monthlyContribution, 'Monthly contribution', { min: 0 });
  const annualReturn = validateNumberField(values.annualReturn, 'Estimated annual return', { min: 0, max: 100 });
  const years = validateNumberField(values.years, 'Years to grow', { min: 1, max: 100, allowZero: false, integer: true });
  if (initialBalance.error) errors.initialBalance = initialBalance.error;
  if (monthlyContribution.error) errors.monthlyContribution = monthlyContribution.error;
  if (annualReturn.error) errors.annualReturn = annualReturn.error;
  if (years.error) errors.years = years.error;
  return hasErrors(errors)
    ? { errors }
    : {
        parsed: {
          initialBalance: initialBalance.value?.toString() ?? '0',
          monthlyContribution: monthlyContribution.value?.toString() ?? '0',
          annualReturn: annualReturn.value?.toString() ?? '0',
          years: years.value?.toString() ?? '0',
          contributionTiming: values.contributionTiming,
        },
        errors,
      };
}

function calculateResult(input: SavingsFormState) {
  return {
    input,
    projection: calculateSavingsGrowth(Number(input.initialBalance), Number(input.monthlyContribution), Number(input.annualReturn), Number(input.years), 12, input.contributionTiming as SavingsContributionTiming),
  };
}

export function SavingsGrowthCalculatorPage() {
  const [values, setValues] = useState<SavingsFormState>(defaults);
  const [touched, setTouched] = useState<Partial<Record<SavingsFields, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<SavingsFields>>({});
  const [lastSubmittedValues, setLastSubmittedValues] = useState<SavingsFormState | null>(null);
  const [result, setResult] = useState<ReturnType<typeof calculateResult> | null>(null);
  const applySharedValues = useCallback((sharedValues: Partial<SavingsFormState>) => setValues((current) => ({ ...current, ...sharedValues })), []);
  const { share, shareEnabled, shareMessage, shareNotice } = useShareableCalculator({ pathname: '/calculators/savings-growth', schema: savingsShareSchema, submittedValues: lastSubmittedValues, applySharedValues });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const next = validate(values);
    setErrors(next.errors);
    if (!hasErrors(next.errors) && next.parsed) {
      setLastSubmittedValues(next.parsed);
      setResult(calculateResult(next.parsed));
    }
  };

  const description = 'Project future savings balances, clarify contribution timing, and review a year-by-year breakdown of contributions and growth.';
  const startingBalance = result && lastSubmittedValues ? Number(lastSubmittedValues.initialBalance) : 0;
  const recurringContributions = result ? Math.max(result.projection.totalContributions - startingBalance, 0) : 0;

  return (
    <CalculatorShell slug="savings-growth" title="Savings Growth Calculator" description={description} metaDescription="Estimate future savings with monthly contributions, selectable contribution timing, and annual balance breakdowns." path="/calculators/savings-growth" structuredData={buildCalculatorStructuredData('Savings Growth Calculator', description, '/calculators/savings-growth', savingsFaqs)}
      form={<section className="card"><SectionHeading title="Inputs" eyebrow="Calculator form" />{shareNotice ? <InfoNotice tone={shareNotice.tone} title={shareNotice.title}>{shareNotice.message}</InfoNotice> : null}<form className="calculator-form" noValidate onSubmit={handleSubmit}><FormField id="savings-initial" label="Starting balance" error={(touched.initialBalance || submitted) ? errors.initialBalance : undefined} prefix="$" step="0.01" type="number" value={values.initialBalance} onBlur={() => setTouched((current) => ({ ...current, initialBalance: true }))} onChange={(event) => setValues((current) => ({ ...current, initialBalance: event.target.value }))} /><FormField id="savings-monthly" label="Monthly contribution" error={(touched.monthlyContribution || submitted) ? errors.monthlyContribution : undefined} prefix="$" step="0.01" type="number" value={values.monthlyContribution} onBlur={() => setTouched((current) => ({ ...current, monthlyContribution: true }))} onChange={(event) => setValues((current) => ({ ...current, monthlyContribution: event.target.value }))} /><FormField id="savings-return" label="Estimated annual return" error={(touched.annualReturn || submitted) ? errors.annualReturn : undefined} suffix="%" step="0.01" type="number" value={values.annualReturn} onBlur={() => setTouched((current) => ({ ...current, annualReturn: true }))} onChange={(event) => setValues((current) => ({ ...current, annualReturn: event.target.value }))} /><FormField id="savings-years" label="Years to grow" error={(touched.years || submitted) ? errors.years : undefined} step="1" type="number" value={values.years} onBlur={() => setTouched((current) => ({ ...current, years: true }))} onChange={(event) => setValues((current) => ({ ...current, years: event.target.value }))} /><FormField id="contribution-timing" label="Contribution timing"><select value={values.contributionTiming} onChange={(event) => setValues((current) => ({ ...current, contributionTiming: event.target.value }))}><option value="end">End of each month</option><option value="beginning">Beginning of each month</option></select></FormField><CalculatorActions><button type="submit">Calculate</button><button type="button" onClick={() => { setValues(defaults); setTouched({}); setSubmitted(false); setErrors({}); setLastSubmittedValues(null); setResult(null); }}>Start over</button></CalculatorActions></form></section>}
      results={<ResultsPanel title="Results">{result && lastSubmittedValues ? <div className="content-stack"><PrimaryResult label="Projected future balance" value={formatCurrency(result.projection.futureBalance)} detail={`Contribution timing used: ${lastSubmittedValues.contributionTiming === 'beginning' ? 'Beginning of each month' : 'End of each month'}.`} /><SecondaryResultGrid items={[{ label: 'Total contributions', value: formatCurrency(result.projection.totalContributions) }, { label: 'Estimated interest earned', value: formatCurrency(result.projection.interestEarned) }, { label: 'Projection length', value: `${lastSubmittedValues.years} years` }]} /><div className="button-row result-actions"><CopyResultButton getText={() => formatSavingsCopySummary(result.projection, lastSubmittedValues.contributionTiming as SavingsContributionTiming)} /><ShareCalculationButton disabled={!shareEnabled} message={shareMessage} onShare={share} /></div><ChartCard title="Savings breakdown" summary={<p>Starting balance: {formatCurrency(startingBalance)}. Added contributions: {formatCurrency(recurringContributions)}. Estimated interest earned: {formatCurrency(result.projection.interestEarned)}. Projected final balance: {formatCurrency(result.projection.futureBalance)}.</p>}><SimpleBarChart ariaLabel="Savings summary showing starting balance, added contributions, and estimated interest earned" data={[{ label: 'Starting balance', value: startingBalance, displayValue: formatCurrency(startingBalance), pattern: 'solid' }, { label: 'Added contributions', value: recurringContributions, displayValue: formatCurrency(recurringContributions), pattern: 'stripe' }, { label: 'Estimated interest', value: result.projection.interestEarned, displayValue: formatCurrency(result.projection.interestEarned), pattern: 'dot' }]} /></ChartCard><InfoNotice tone="info" title="Estimate note">This projection assumes a fixed annual return and monthly compounding. It does not include taxes, fees, or changing rates.</InfoNotice><ResponsiveTable title="Year-by-year breakdown" headers={['Year', 'Total contributions', 'Growth earned that year', 'Ending balance']} rows={result.projection.breakdown.map((row) => [row.year, formatCurrency(row.contributions), formatCurrency(row.interestEarned), formatCurrency(row.endBalance)])} /></div> : <EmptyResultState title="No result yet" description="Enter your savings assumptions and select Calculate to see the projected future balance and annual breakdown." />}</ResultsPanel>}
      info={<div className="content-stack"><CalculationAssumptions items={[{ label: 'Contribution timing', value: 'You choose whether monthly contributions happen at the beginning or end of each month.' }, { label: 'Compounding frequency', value: 'The projection uses monthly compounding.' }, { label: 'Return assumption', value: 'The annual return is assumed to stay constant across the full projection.' }, { label: 'Excluded factors', value: 'Taxes, fees, withdrawals, and changing contribution amounts are excluded.' }]} /><InfoBlock formula="Future value reflects the starting balance, recurring monthly contributions, and compounded growth. Contribution timing changes whether each deposit grows immediately or after one period." explanation="This calculator makes the contribution timing explicit because end-of-month and beginning-of-month deposits can produce meaningfully different results over long periods. The growth rate is hypothetical and not guaranteed." example={{ title: 'Worked example', description: 'Starting with $10,000, adding $500 at the end of each month for 15 years at 5% annual growth produces a higher ending balance than contributions alone because of compounding.' }} faqs={savingsFaqs} related={[{ label: 'Retirement Calculator', to: '/calculators/retirement' }, { label: 'Budget Planner', to: '/calculators/budget-planner' }, { label: 'Hourly-to-Annual Income Calculator', to: '/calculators/hourly-to-annual-income' }]} disclaimer="Savings projections are hypothetical estimates only and do not guarantee investment or account performance." /></div>}
    />
  );
}
