import { useCallback, useState, type FormEvent } from 'react';

import { loanShareSchema } from '../data/shareSchemas';
import { CalculationAssumptions } from '../components/CalculationAssumptions';
import { CalculatorActions } from '../components/CalculatorActions';
import { ChartCard } from '../components/ChartCard';
import { CopyResultButton } from '../components/CopyResultButton';
import { EmptyResultState } from '../components/EmptyResultState';
import { ExpandableTableSection } from '../components/ExpandableTableSection';
import { FormField } from '../components/FormField';
import { InfoBlock } from '../components/InfoBlock';
import { InfoNotice } from '../components/InfoNotice';
import { PrimaryResult } from '../components/PrimaryResult';
import { ResultsPanel } from '../components/ResultsPanel';
import { SecondaryResultGrid } from '../components/SecondaryResultGrid';
import { SectionHeading } from '../components/SectionHeading';
import { ShareCalculationButton } from '../components/ShareCalculationButton';
import { SimpleBarChart } from '../components/SimpleBarChart';
import { useShareableCalculator } from '../hooks/useShareableCalculator';
import { CalculatorShell } from './CalculatorShell';
import { formatLoanCopySummary } from '../utils/copySummaries';
import { buildAmortizationSchedule, monthlyPayment } from '../utils/financial';
import { formatCurrency } from '../utils/format';
import { buildCalculatorStructuredData } from '../utils/structuredData';
import { hasErrors, type FieldErrors, validateNumberField } from '../utils/validation';

export type LoanFields = 'loanAmount' | 'interestRate' | 'loanYears';
export type LoanFormState = Record<LoanFields, string>;

const defaults: LoanFormState = {
  loanAmount: '25000',
  interestRate: '6.5',
  loanYears: '5',
};

const loanFaqs = [
  {
    question: 'Is the interest rate entered as a yearly percentage?',
    answer: 'Yes. Enter the annual percentage rate, and the calculator converts it to a monthly rate internally.',
  },
  {
    question: 'Why does the last balance end near zero instead of exactly zero?',
    answer:
      'Internal calculations keep full precision. Display values are rounded to cents, so the final shown balance may be a tiny amount before rounding to zero.',
  },
  {
    question: 'Does total loan cost include fees?',
    answer: 'No. It includes only principal and interest paid through the amortized payment schedule.',
  },
  {
    question: 'Can I use 0% interest?',
    answer: 'Yes. In that case the payment is simply principal divided by the number of months.',
  },
];

function validate(values: LoanFormState): { parsed?: ReturnType<typeof parse>; errors: FieldErrors<LoanFields> } {
  const errors: FieldErrors<LoanFields> = {};
  const parsed = parse(values, errors);
  return hasErrors(errors) ? { errors } : { parsed, errors };
}

function parse(values: LoanFormState, errors: FieldErrors<LoanFields>) {
  const loanAmount = validateNumberField(values.loanAmount, 'Loan amount', { min: 0, allowZero: false });
  const interestRate = validateNumberField(values.interestRate, 'Annual interest rate', { min: 0, max: 100 });
  const loanYears = validateNumberField(values.loanYears, 'Loan term in years', {
    min: 1,
    max: 50,
    allowZero: false,
    integer: true,
  });

  if (loanAmount.error) errors.loanAmount = loanAmount.error;
  if (interestRate.error) errors.interestRate = interestRate.error;
  if (loanYears.error) errors.loanYears = loanYears.error;

  return {
    loanAmount: loanAmount.value?.toString() ?? '0',
    interestRate: interestRate.value?.toString() ?? '0',
    loanYears: loanYears.value?.toString() ?? '0',
  };
}

function calculateLoanResult(input: LoanFormState) {
  const totalMonths = Number(input.loanYears) * 12;
  const payment = monthlyPayment(Number(input.loanAmount), Number(input.interestRate), totalMonths);
  const schedule = buildAmortizationSchedule(Number(input.loanAmount), Number(input.interestRate), totalMonths, payment);
  const totalPayments = schedule.reduce((sum, row) => sum + row.payment, 0);
  const totalInterest = schedule.reduce((sum, row) => sum + row.interest, 0);
  const totalPrincipal = schedule.reduce((sum, row) => sum + row.principal, 0);

  return { totalMonths, payment, schedule, totalPayments, totalInterest, totalPrincipal };
}

export function LoanPaymentCalculatorPage() {
  const [values, setValues] = useState<LoanFormState>(defaults);
  const [touched, setTouched] = useState<Partial<Record<LoanFields, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<LoanFields>>({});
  const [lastSubmittedValues, setLastSubmittedValues] = useState<LoanFormState | null>(null);
  const [result, setResult] = useState<ReturnType<typeof calculateLoanResult> | null>(null);

  const applySharedValues = useCallback((sharedValues: Partial<LoanFormState>) => {
    setValues((current) => ({ ...current, ...sharedValues }));
  }, []);

  const { share, shareEnabled, shareMessage, shareNotice } = useShareableCalculator({
    pathname: '/calculators/loan-payment',
    schema: loanShareSchema,
    submittedValues: lastSubmittedValues,
    applySharedValues,
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const next = validate(values);
    setErrors(next.errors);
    if (!hasErrors(next.errors) && next.parsed) {
      setLastSubmittedValues(next.parsed);
      setResult(calculateLoanResult(next.parsed));
    }
  };

  const description = 'Estimate monthly loan payments, total interest, and a full amortization schedule that reconciles to the summary totals.';

  return (
    <CalculatorShell
      slug="loan-payment"
      title="Loan Payment Calculator"
      description={description}
      metaDescription="Calculate monthly loan payments, total interest, total payments, and a reconciling amortization schedule."
      path="/calculators/loan-payment"
      structuredData={buildCalculatorStructuredData('Loan Payment Calculator', description, '/calculators/loan-payment', loanFaqs)}
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
              id="loan-amount"
              label="Loan amount"
              error={(touched.loanAmount || submitted) ? errors.loanAmount : undefined}
              prefix="$"
              step="0.01"
              type="number"
              value={values.loanAmount}
              onBlur={() => setTouched((current) => ({ ...current, loanAmount: true }))}
              onChange={(event) => setValues((current) => ({ ...current, loanAmount: event.target.value }))}
            />
            <FormField
              id="loan-interest"
              label="Annual interest rate"
              error={(touched.interestRate || submitted) ? errors.interestRate : undefined}
              suffix="%"
              step="0.01"
              type="number"
              value={values.interestRate}
              onBlur={() => setTouched((current) => ({ ...current, interestRate: true }))}
              onChange={(event) => setValues((current) => ({ ...current, interestRate: event.target.value }))}
            />
            <FormField
              id="loan-years"
              label="Loan term in years"
              error={(touched.loanYears || submitted) ? errors.loanYears : undefined}
              step="1"
              type="number"
              value={values.loanYears}
              onBlur={() => setTouched((current) => ({ ...current, loanYears: true }))}
              onChange={(event) => setValues((current) => ({ ...current, loanYears: event.target.value }))}
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
                label="Estimated monthly payment"
                value={formatCurrency(result.payment)}
                detail={`Fixed-rate estimate across ${result.totalMonths} monthly payments.`}
              />
              <SecondaryResultGrid
                items={[
                  { label: 'Total payments', value: formatCurrency(result.totalPayments) },
                  { label: 'Total interest', value: formatCurrency(result.totalInterest) },
                  { label: 'Total principal repaid', value: formatCurrency(result.totalPrincipal) },
                  { label: 'Loan payoff term', value: `${result.totalMonths} months` },
                  { label: 'Final displayed balance', value: formatCurrency(result.schedule.at(-1)?.balance ?? 0) },
                ]}
              />
              <div className="button-row result-actions">
                <CopyResultButton getText={() => formatLoanCopySummary(result)} />
                <ShareCalculationButton disabled={!shareEnabled} message={shareMessage} onShare={share} />
              </div>
              <ChartCard
                title="Principal versus interest"
                summary={
                  <p>
                    Total principal repaid: {formatCurrency(result.totalPrincipal)}. Total interest paid: {formatCurrency(result.totalInterest)}. Total paid: {formatCurrency(result.totalPayments)}.
                  </p>
                }
              >
                <SimpleBarChart
                  ariaLabel="Loan summary comparing total principal repaid with total interest paid"
                  data={[
                    { label: 'Principal repaid', value: result.totalPrincipal, displayValue: formatCurrency(result.totalPrincipal), pattern: 'solid' },
                    { label: 'Interest paid', value: result.totalInterest, displayValue: formatCurrency(result.totalInterest), pattern: 'stripe' },
                  ]}
                />
              </ChartCard>
              <InfoNotice tone="info" title="Schedule note">
                The amortization schedule keeps full precision internally and should reconcile to the total principal and total interest shown above.
              </InfoNotice>
              <ExpandableTableSection
                title="Amortization schedule"
                summaryTitle="Amortization summary"
                summaryHeaders={['Metric', 'Value']}
                summaryRows={[
                  ['Total paid', formatCurrency(result.totalPayments)],
                  ['Total principal repaid', formatCurrency(result.totalPrincipal)],
                  ['Total interest', formatCurrency(result.totalInterest)],
                  ['Final displayed balance', formatCurrency(result.schedule.at(-1)?.balance ?? 0)],
                ]}
                detailTitle="Monthly amortization schedule"
                detailHeaders={['Payment', 'Amount', 'Principal', 'Interest', 'Balance']}
                detailRows={result.schedule.map((row) => [
                  row.paymentNumber,
                  formatCurrency(row.payment),
                  formatCurrency(row.principal),
                  formatCurrency(row.interest),
                  formatCurrency(row.balance),
                ])}
              />
            </div>
          ) : (
            <EmptyResultState
              title="No result yet"
              description="Enter your loan details and select Calculate to see the estimated monthly payment and amortization schedule."
            />
          )}
        </ResultsPanel>
      }
      info={
        <div className="content-stack">
          <CalculationAssumptions
            items={[
              { label: 'Interest model', value: 'The calculator assumes a fixed interest rate with monthly compounding.' },
              { label: 'Payment timing', value: 'Payments are treated as monthly end-of-period payments.' },
              { label: 'Fees excluded', value: 'Fees, taxes, insurance, and lender-specific charges are excluded unless entered elsewhere.' },
              { label: 'Rounding', value: 'The schedule keeps full precision internally and rounds only for display.' },
            ]}
          />
          <InfoBlock
            formula="Monthly payment = P × r ÷ (1 - (1 + r)^-n), where P is principal, r is the monthly rate, and n is the number of monthly payments."
            explanation="The schedule keeps full precision internally and only rounds for display. Total interest is the sum of every monthly interest charge in the schedule."
            example={{
              title: 'Worked example',
              description:
                'A $25,000 loan at 6.5% for 5 years produces a payment of about $489.15 per month, for roughly $29,349 in total payments and about $4,349 in interest.',
            }}
            faqs={loanFaqs}
            related={[
              { label: 'Mortgage Calculator', to: '/calculators/mortgage' },
              { label: 'Credit Card Payoff Calculator', to: '/calculators/credit-card-payoff' },
              { label: 'Budget Planner', to: '/calculators/budget-planner' },
            ]}
            disclaimer="Loan outputs are estimates only. Actual lender disclosures, fees, and payment schedules may differ."
          />
        </div>
      }
    />
  );
}
