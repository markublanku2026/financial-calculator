import { useState, type FormEvent } from 'react';

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
import { CalculatorShell } from './CalculatorShell';
import { formatSalaryCopySummary } from '../utils/copySummaries';
import { calculateSalaryBreakdown } from '../utils/financial';
import { formatCurrency, formatPercent } from '../utils/format';
import { buildCalculatorStructuredData } from '../utils/structuredData';
import { hasErrors, type FieldErrors, validateNumberField } from '../utils/validation';

type SalaryFields = 'annualSalary' | 'hoursPerWeek' | 'weeksPerYear' | 'payPeriods' | 'withholdingRate';
type SalaryFormState = Record<SalaryFields, string>;

const defaults: SalaryFormState = {
  annualSalary: '90000',
  hoursPerWeek: '40',
  weeksPerYear: '52',
  payPeriods: '24',
  withholdingRate: '24',
};

const salaryFaqs = [
  {
    question: 'Does this calculator show actual payroll withholding?',
    answer:
      'No. Any take-home figure here uses one flat deduction assumption for planning only and does not replace payroll or tax calculations.',
  },
  {
    question: 'Why is semimonthly different from biweekly?',
    answer:
      'Semimonthly means 24 paychecks per year. Biweekly usually means 26. The per-paycheck amount changes even when annual salary stays the same.',
  },
  {
    question: 'Why does the hourly equivalent depend on weeks worked?',
    answer:
      'The hourly equivalent spreads annual salary across the hours and weeks you entered, so paid leave assumptions affect the result.',
  },
  {
    question: 'Can this be used for bonuses or commissions?',
    answer: 'Only as a rough planning tool. Variable compensation is not modeled separately here.',
  },
];

function validate(values: SalaryFormState): { parsed?: ReturnType<typeof parse>; errors: FieldErrors<SalaryFields> } {
  const errors: FieldErrors<SalaryFields> = {};
  const parsed = parse(values, errors);
  return hasErrors(errors) ? { errors } : { parsed, errors };
}

function parse(values: SalaryFormState, errors: FieldErrors<SalaryFields>) {
  const annualSalary = validateNumberField(values.annualSalary, 'Annual salary', { min: 0, allowZero: false });
  const hoursPerWeek = validateNumberField(values.hoursPerWeek, 'Hours per week', { min: 0, allowZero: false });
  const weeksPerYear = validateNumberField(values.weeksPerYear, 'Weeks worked per year', {
    min: 0,
    max: 52,
    allowZero: false,
  });
  const payPeriods = validateNumberField(values.payPeriods, 'Pay periods per year', {
    min: 1,
    integer: true,
    allowZero: false,
  });
  const withholdingRate = validateNumberField(values.withholdingRate, 'Flat deduction estimate', { min: 0, max: 100 });

  if (annualSalary.error) errors.annualSalary = annualSalary.error;
  if (hoursPerWeek.error) errors.hoursPerWeek = hoursPerWeek.error;
  if (weeksPerYear.error) errors.weeksPerYear = weeksPerYear.error;
  if (payPeriods.error) errors.payPeriods = payPeriods.error;
  if (withholdingRate.error) errors.withholdingRate = withholdingRate.error;

  return {
    annualSalary: annualSalary.value ?? 0,
    hoursPerWeek: hoursPerWeek.value ?? 0,
    weeksPerYear: weeksPerYear.value ?? 0,
    payPeriods: payPeriods.value ?? 0,
    withholdingRate: withholdingRate.value ?? 0,
  };
}

export function SalaryCalculatorPage() {
  const [values, setValues] = useState<SalaryFormState>(defaults);
  const [touched, setTouched] = useState<Partial<Record<SalaryFields, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<SalaryFields>>({});
  const [lastWithholdingRate, setLastWithholdingRate] = useState<number | null>(null);
  const [result, setResult] = useState<ReturnType<typeof calculateSalaryBreakdown> | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const next = validate(values);
    setErrors(next.errors);
    if (!hasErrors(next.errors) && next.parsed) {
      setLastWithholdingRate(next.parsed.withholdingRate);
      setResult(calculateSalaryBreakdown(next.parsed));
    }
  };

  const description = 'Break annual salary into gross and flat-estimated take-home amounts by month, pay period, week, and effective hour.';

  return (
    <CalculatorShell
      slug="salary"
      title="Salary Calculator"
      description={description}
      metaDescription="Estimate salary by pay period, week, month, and effective hour with clearly separated gross and flat-estimated take-home values."
      path="/calculators/salary"
      structuredData={buildCalculatorStructuredData('Salary Calculator', description, '/calculators/salary', salaryFaqs)}
      form={
        <section className="card">
          <SectionHeading title="Inputs" eyebrow="Calculator form" />
          <form className="calculator-form" noValidate onSubmit={handleSubmit}>
            <FormField
              id="annual-salary"
              label="Annual salary"
              error={(touched.annualSalary || submitted) ? errors.annualSalary : undefined}
              prefix="$"
              step="0.01"
              type="number"
              value={values.annualSalary}
              onBlur={() => setTouched((current) => ({ ...current, annualSalary: true }))}
              onChange={(event) => setValues((current) => ({ ...current, annualSalary: event.target.value }))}
            />
            <FormField
              id="salary-hours"
              label="Hours per week"
              error={(touched.hoursPerWeek || submitted) ? errors.hoursPerWeek : undefined}
              step="0.25"
              type="number"
              value={values.hoursPerWeek}
              onBlur={() => setTouched((current) => ({ ...current, hoursPerWeek: true }))}
              onChange={(event) => setValues((current) => ({ ...current, hoursPerWeek: event.target.value }))}
            />
            <FormField
              id="salary-weeks"
              label="Weeks worked per year"
              error={(touched.weeksPerYear || submitted) ? errors.weeksPerYear : undefined}
              hint="Use fewer than 52 only when modeling part-year or unpaid-leave schedules."
              max={52}
              step="0.01"
              type="number"
              value={values.weeksPerYear}
              onBlur={() => setTouched((current) => ({ ...current, weeksPerYear: true }))}
              onChange={(event) => setValues((current) => ({ ...current, weeksPerYear: event.target.value }))}
            />
            <FormField id="pay-periods" label="Pay periods per year" error={(touched.payPeriods || submitted) ? errors.payPeriods : undefined}>
              <select
                value={values.payPeriods}
                onBlur={() => setTouched((current) => ({ ...current, payPeriods: true }))}
                onChange={(event) => setValues((current) => ({ ...current, payPeriods: event.target.value }))}
              >
                <option value="12">12 monthly</option>
                <option value="24">24 semimonthly</option>
                <option value="26">26 biweekly</option>
                <option value="52">52 weekly</option>
              </select>
            </FormField>
            <FormField
              id="salary-withholding"
              label="Optional flat deduction estimate"
              error={(touched.withholdingRate || submitted) ? errors.withholdingRate : undefined}
              hint="This is not a real tax estimate. It applies one percentage to gross pay for rough budgeting only."
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
                  setLastWithholdingRate(null);
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
                label="Estimated monthly take-home income"
                value={formatCurrency(result.monthlyTakeHome)}
                detail={`Flat deduction estimate used for take-home display: ${formatPercent(lastWithholdingRate ?? 0)}.`}
              />
              <CopyResultButton
                getText={() => formatSalaryCopySummary(result, lastWithholdingRate ?? 0)}
              />
              <SecondaryResultGrid
                items={[
                  { label: 'Estimated gross monthly salary', value: formatCurrency(result.monthlyGross) },
                  { label: 'Estimated gross selected pay period', value: formatCurrency(result.selectedPayPeriodGross) },
                  { label: 'Estimated gross weekly equivalent', value: formatCurrency(result.weeklyGross) },
                  { label: 'Estimated gross biweekly equivalent', value: formatCurrency(result.biweeklyGross) },
                  { label: 'Estimated take-home selected pay period', value: formatCurrency(result.selectedPayPeriodTakeHome) },
                  { label: 'Effective hourly equivalent', value: formatCurrency(result.hourlyEquivalent) },
                ]}
              />
              <InfoNotice tone="info" title="Estimate note">
                Gross salary and estimated take-home pay are shown separately. Take-home values use a flat deduction simplification for planning only.
              </InfoNotice>
            </div>
          ) : (
            <EmptyResultState
              title="No result yet"
              description="Enter salary details and select Calculate to see estimated gross and take-home income across common pay periods."
            />
          )}
        </ResultsPanel>
      }
      info={
        <div className="content-stack">
          <CalculationAssumptions
            items={[
              { label: 'Gross versus take-home', value: 'Gross pay is calculated from the annual salary. Take-home uses one flat deduction estimate.' },
              { label: 'Work schedule', value: 'Hours per week and weeks worked per year determine the effective hourly equivalent.' },
              { label: 'Pay periods', value: 'Monthly, semimonthly, biweekly, and weekly pay period equivalents assume evenly distributed pay.' },
              { label: 'Overtime exclusion', value: 'Overtime, bonuses, commissions, and employer-specific payroll adjustments are not modeled.' },
            ]}
          />
          <InfoBlock
            formula="Gross pay per paycheck = annual salary ÷ pay periods. Effective hourly equivalent = annual salary ÷ (hours per week × weeks worked per year)."
            explanation="Gross salary and estimated take-home pay are shown separately. Any take-home figure is a flat-rate planning estimate only and is not a substitute for payroll or tax calculations."
            example={{
              title: 'Worked example',
              description:
                '$90,000 paid semimonthly equals $3,750 gross per paycheck. With a flat 24% deduction estimate, that same paycheck is about $2,850 after estimated deductions.',
            }}
            faqs={salaryFaqs}
            related={[
              { label: 'Hourly-to-Annual Income Calculator', to: '/calculators/hourly-to-annual-income' },
              { label: 'Budget Planner', to: '/calculators/budget-planner' },
              { label: 'Retirement Calculator', to: '/calculators/retirement' },
            ]}
            disclaimer="Salary outputs are estimates only and should not replace employer payroll records or tax advice."
          />
        </div>
      }
    />
  );
}
