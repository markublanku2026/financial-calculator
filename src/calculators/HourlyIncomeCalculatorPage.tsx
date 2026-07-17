import { useCallback, useState, type FormEvent } from 'react';

import { hourlyShareSchema } from '../data/shareSchemas';
import { CalculationAssumptions } from '../components/CalculationAssumptions';
import { CalculatorActions } from '../components/CalculatorActions';
import { CopyResultButton } from '../components/CopyResultButton';
import { EmptyResultState } from '../components/EmptyResultState';
import { FormField } from '../components/FormField';
import { InfoBlock } from '../components/InfoBlock';
import { InfoNotice } from '../components/InfoNotice';
import { PrimaryResult } from '../components/PrimaryResult';
import { ResultsPanel } from '../components/ResultsPanel';
import { SecondaryResultGrid } from '../components/SecondaryResultGrid';
import { SectionHeading } from '../components/SectionHeading';
import { ShareCalculationButton } from '../components/ShareCalculationButton';
import { useShareableCalculator } from '../hooks/useShareableCalculator';
import { CalculatorShell } from './CalculatorShell';
import { formatHourlyCopySummary } from '../utils/copySummaries';
import { calculateHourlyIncome } from '../utils/financial';
import { formatCurrency, formatPercent } from '../utils/format';
import { buildCalculatorStructuredData } from '../utils/structuredData';
import { hasErrors, type FieldErrors, validateNumberField } from '../utils/validation';

export type HourlyFields = 'hourlyRate' | 'hoursPerWeek' | 'weeksPerYear' | 'annualHours' | 'withholdingRate';
export type HourlyFormState = Record<HourlyFields, string>;

const defaults: HourlyFormState = {
  hourlyRate: '28',
  hoursPerWeek: '40',
  weeksPerYear: '50',
  annualHours: '2000',
  withholdingRate: '22',
};

const hourlyFaqs = [
  {
    question: 'Does this calculator show gross pay or take-home pay?',
    answer:
      'It shows both. Gross pay is based only on hours and wage. The take-home estimate uses a flat deduction assumption that is not a tax calculation.',
  },
  {
    question: 'Why is weekly income based on entered hours instead of annual income divided by 52?',
    answer:
      'Weekly gross income is shown from the actual weekly schedule you entered. This avoids understating weekly income when you work fewer than 52 weeks per year.',
  },
  {
    question: 'Can I model unpaid time off or seasonal work?',
    answer:
      'Yes. Reduce weeks worked per year to reflect unpaid leave, school breaks, or seasonal schedules.',
  },
  {
    question: 'Is the take-home estimate reliable for taxes?',
    answer:
      'No. Actual withholding depends on filing status, state rules, benefits, overtime, and other payroll details.',
  },
];

function validate(values: HourlyFormState): { parsed?: ReturnType<typeof parse>; errors: FieldErrors<HourlyFields> } {
  const errors: FieldErrors<HourlyFields> = {};
  const parsed = parse(values, errors);
  return hasErrors(errors) ? { errors } : { parsed, errors };
}

function parse(values: HourlyFormState, errors: FieldErrors<HourlyFields>) {
  const hourlyRate = validateNumberField(values.hourlyRate, 'Hourly wage', { min: 0, allowZero: false });
  const hoursPerWeek = validateNumberField(values.hoursPerWeek, 'Hours per week', { min: 0, allowZero: false });
  const weeksPerYear = validateNumberField(values.weeksPerYear, 'Weeks worked per year', {
    min: 0,
    max: 52,
    allowZero: false,
  });
  const annualHours = validateNumberField(values.annualHours, 'Planned annual work hours', {
    min: 0,
    allowZero: false,
  });
  const withholdingRate = validateNumberField(values.withholdingRate, 'Flat deduction estimate', {
    min: 0,
    max: 100,
  });

  if (hourlyRate.error) errors.hourlyRate = hourlyRate.error;
  if (hoursPerWeek.error) errors.hoursPerWeek = hoursPerWeek.error;
  if (weeksPerYear.error) errors.weeksPerYear = weeksPerYear.error;
  if (annualHours.error) errors.annualHours = annualHours.error;
  if (withholdingRate.error) errors.withholdingRate = withholdingRate.error;

  return {
    hourlyRate: hourlyRate.value?.toString() ?? '0',
    hoursPerWeek: hoursPerWeek.value?.toString() ?? '0',
    weeksPerYear: weeksPerYear.value?.toString() ?? '0',
    annualHours: annualHours.value?.toString() ?? '0',
    withholdingRate: withholdingRate.value?.toString() ?? '0',
  };
}

function toInput(values: Partial<HourlyFormState>): HourlyFormState {
  return {
    ...defaults,
    ...values,
  };
}

function toCalculationInput(values: HourlyFormState) {
  return {
    hourlyRate: Number(values.hourlyRate),
    hoursPerWeek: Number(values.hoursPerWeek),
    weeksPerYear: Number(values.weeksPerYear),
    annualHours: Number(values.annualHours),
    withholdingRate: Number(values.withholdingRate),
  };
}

export function HourlyIncomeCalculatorPage() {
  const [values, setValues] = useState<HourlyFormState>(defaults);
  const [touched, setTouched] = useState<Partial<Record<HourlyFields, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<HourlyFields>>({});
  const [lastSubmittedValues, setLastSubmittedValues] = useState<HourlyFormState | null>(null);
  const [result, setResult] = useState<ReturnType<typeof calculateHourlyIncome> | null>(null);

  const applySharedValues = useCallback((sharedValues: Partial<HourlyFormState>) => {
    setValues((current) => ({ ...current, ...sharedValues }));
  }, []);

  const { share, shareEnabled, shareMessage, shareNotice } = useShareableCalculator({
    pathname: '/calculators/hourly-to-annual-income',
    schema: hourlyShareSchema,
    submittedValues: lastSubmittedValues,
    applySharedValues,
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const next = validate(values);
    setErrors(next.errors);
    if (!hasErrors(next.errors) && next.parsed) {
      const normalized = toInput(next.parsed);
      setLastSubmittedValues(normalized);
      setResult(calculateHourlyIncome(toCalculationInput(normalized)));
    }
  };

  const description =
    'Estimate gross annual, monthly, and weekly pay from hourly wages, then compare it with a flat take-home estimate kept entirely in the browser.';

  return (
    <CalculatorShell
      slug="hourly-to-annual-income"
      title="Hourly-to-Annual Income Calculator"
      description={description}
      metaDescription="Convert hourly pay to gross annual income and compare it with a clearly labeled flat take-home estimate."
      path="/calculators/hourly-to-annual-income"
      structuredData={buildCalculatorStructuredData(
        'Hourly-to-Annual Income Calculator',
        description,
        '/calculators/hourly-to-annual-income',
        hourlyFaqs,
      )}
      form={
        <section className="card">
          <SectionHeading title="Inputs" eyebrow="Calculator form" />
          {shareNotice ? (
            <InfoNotice tone={shareNotice.tone} title={shareNotice.title}>
              {shareNotice.message}
            </InfoNotice>
          ) : null}
          <form className="calculator-form" noValidate onSubmit={handleSubmit}>
            <FormField
              id="hourly-rate"
              label="Hourly wage"
              error={(touched.hourlyRate || submitted) ? errors.hourlyRate : undefined}
              min={0}
              prefix="$"
              step="0.01"
              type="number"
              value={values.hourlyRate}
              onBlur={() => setTouched((current) => ({ ...current, hourlyRate: true }))}
              onChange={(event) => setValues((current) => ({ ...current, hourlyRate: event.target.value }))}
            />
            <FormField
              id="hours-per-week"
              label="Hours per week"
              error={(touched.hoursPerWeek || submitted) ? errors.hoursPerWeek : undefined}
              min={0}
              step="0.25"
              type="number"
              value={values.hoursPerWeek}
              onBlur={() => setTouched((current) => ({ ...current, hoursPerWeek: true }))}
              onChange={(event) => setValues((current) => ({ ...current, hoursPerWeek: event.target.value }))}
            />
            <FormField
              id="weeks-per-year"
              label="Weeks worked per year"
              error={(touched.weeksPerYear || submitted) ? errors.weeksPerYear : undefined}
              hint="Use fewer than 52 weeks for unpaid time off, seasonal work, or school breaks."
              max={52}
              min={0}
              step="0.01"
              type="number"
              value={values.weeksPerYear}
              onBlur={() => setTouched((current) => ({ ...current, weeksPerYear: true }))}
              onChange={(event) => setValues((current) => ({ ...current, weeksPerYear: event.target.value }))}
            />
            <FormField
              id="annual-hours"
              label="Planned annual work hours"
              error={(touched.annualHours || submitted) ? errors.annualHours : undefined}
              hint="Used only to show the effective hourly average across your planned annual hours."
              min={0}
              step="0.01"
              type="number"
              value={values.annualHours}
              onBlur={() => setTouched((current) => ({ ...current, annualHours: true }))}
              onChange={(event) => setValues((current) => ({ ...current, annualHours: event.target.value }))}
            />
            <FormField
              id="withholding-rate"
              label="Optional flat deduction estimate"
              error={(touched.withholdingRate || submitted) ? errors.withholdingRate : undefined}
              hint="This is not a tax calculator. It applies one flat deduction percentage to gross income."
              max={100}
              min={0}
              step="0.01"
              suffix="%"
              type="number"
              value={values.withholdingRate}
              onBlur={() => setTouched((current) => ({ ...current, withholdingRate: true }))}
              onChange={(event) => setValues((current) => ({ ...current, withholdingRate: event.target.value }))}
            />
            <CalculatorActions>
              <button type="submit">Calculate</button>
              <button
                type="button"
                onClick={() => {
                  setValues(defaults);
                  setTouched({});
                  setSubmitted(false);
                  setErrors({});
                  setLastSubmittedValues(null);
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
          {result && lastSubmittedValues ? (
            <div className="content-stack">
              <PrimaryResult
                label="Estimated annual gross income"
                value={formatCurrency(result.annualGross)}
                detail={`Flat deduction estimate used for take-home display: ${formatPercent(Number(lastSubmittedValues.withholdingRate || 0))}.`}
              />
              <SecondaryResultGrid
                items={[
                  { label: 'Estimated monthly gross income', value: formatCurrency(result.monthlyGross) },
                  { label: 'Estimated weekly gross income', value: formatCurrency(result.weeklyGross) },
                  { label: 'Estimated annual take-home income', value: formatCurrency(result.annualTakeHome) },
                  { label: 'Estimated monthly take-home income', value: formatCurrency(result.monthlyTakeHome) },
                  { label: 'Effective hourly average across annual hours', value: formatCurrency(result.effectiveHourly) },
                ]}
              />
              <div className="button-row result-actions">
                <CopyResultButton
                  getText={() => formatHourlyCopySummary(result, Number(lastSubmittedValues.withholdingRate || 0))}
                />
                <ShareCalculationButton disabled={!shareEnabled} message={shareMessage} onShare={share} />
              </div>
              <InfoNotice tone="info" title="Estimate note">
                Gross income and flat-estimated take-home income are shown separately. The take-home figure is a planning estimate, not a tax calculation.
              </InfoNotice>
            </div>
          ) : (
            <EmptyResultState
              title="No result yet"
              description="Enter your hourly pay details and select Calculate to see estimated gross and take-home income."
            />
          )}
        </ResultsPanel>
      }
      info={
        <div className="content-stack">
          <CalculationAssumptions
            items={[
              { label: 'Gross versus take-home', value: 'Gross pay is calculated directly from wage and schedule. Take-home uses one flat deduction estimate.' },
              { label: 'Work schedule', value: 'Hours per week and weeks worked per year are used exactly as entered.' },
              { label: 'Overtime', value: 'Overtime premiums, shift differentials, bonuses, and tips are not modeled unless included in the hourly wage.' },
              { label: 'Rounding', value: 'Internal calculations keep full precision and values are rounded only for display.' },
            ]}
          />
          <InfoBlock
            formula="Gross annual income = hourly wage × hours per week × weeks worked per year. Estimated take-home pay = gross income × (1 - flat deduction rate)."
            explanation="Gross income is the pre-deduction estimate. Any take-home number shown here is only a rough planning figure because real withholding depends on payroll, tax, and benefit details."
            example={{
              title: 'Worked example',
              description:
                '$28 per hour × 40 hours × 50 weeks = $56,000 gross annual income. With a flat 22% deduction estimate, take-home pay is about $43,680 annually or $3,640 per month.',
            }}
            faqs={hourlyFaqs}
            related={[
              { label: 'Salary Calculator', to: '/calculators/salary' },
              { label: 'Budget Planner', to: '/calculators/budget-planner' },
              { label: 'Savings Growth Calculator', to: '/calculators/savings-growth' },
            ]}
            disclaimer="This calculator is for planning estimates only and should not be used as payroll, tax, or legal advice."
          />
        </div>
      }
    />
  );
}
