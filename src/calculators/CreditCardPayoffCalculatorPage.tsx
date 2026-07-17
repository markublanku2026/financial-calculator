import { useCallback, useMemo, useState, type FormEvent } from 'react';

import { creditCardShareSchema } from '../data/shareSchemas';
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
import { SimpleLineChart } from '../components/SimpleLineChart';
import { useShareableCalculator } from '../hooks/useShareableCalculator';
import { CalculatorShell } from './CalculatorShell';
import { formatCreditCardCopySummary } from '../utils/copySummaries';
import { sampleChartSeries } from '../utils/chart';
import { calculateCreditCardPaymentForTargetMonths, calculateCreditCardPayoffWithPayment } from '../utils/financial';
import { formatCurrency, formatYearsMonths } from '../utils/format';
import { buildCalculatorStructuredData } from '../utils/structuredData';
import { hasErrors, type FieldErrors, validateNumberField } from '../utils/validation';

export type CreditCardFields = 'balance' | 'annualRate' | 'mode' | 'monthlyPaymentAmount' | 'targetMonths';
export type CreditCardFormState = Record<CreditCardFields, string>;

const defaults: CreditCardFormState = { balance: '8000', annualRate: '19.99', mode: 'payment', monthlyPaymentAmount: '250', targetMonths: '36' };
const creditFaqs = [
  { question: 'What happens if my payment does not cover the monthly interest?', answer: 'The calculator flags that scenario because the balance will not decline meaningfully under this simplified monthly-interest model.' },
  { question: 'Does this model daily compounding exactly?', answer: 'No. It uses a monthly rate approximation for planning. Real card issuers often compound daily and may use different billing rules.' },
  { question: 'Can I choose a payoff deadline instead of a payment amount?', answer: 'Yes. In payoff-period mode the calculator computes the monthly payment needed to eliminate the balance within the selected number of months.' },
  { question: 'Why can total interest still be large with a decent payment?', answer: 'High APR debt can accumulate interest quickly, especially early in the payoff timeline when the balance is still large.' },
];

function validate(values: CreditCardFormState): { parsed?: CreditCardFormState; errors: FieldErrors<CreditCardFields> } {
  const errors: FieldErrors<CreditCardFields> = {};
  const balance = validateNumberField(values.balance, 'Current balance', { min: 0, allowZero: false });
  const annualRate = validateNumberField(values.annualRate, 'APR', { min: 0, max: 100 });
  const monthlyPaymentAmount = validateNumberField(values.monthlyPaymentAmount, 'Monthly payment', { min: 0, allowZero: false });
  const targetMonths = validateNumberField(values.targetMonths, 'Desired payoff period in months', { min: 1, max: 1200, allowZero: false, integer: true });
  if (balance.error) errors.balance = balance.error;
  if (annualRate.error) errors.annualRate = annualRate.error;
  if (values.mode === 'payment' && monthlyPaymentAmount.error) errors.monthlyPaymentAmount = monthlyPaymentAmount.error;
  if (values.mode === 'months' && targetMonths.error) errors.targetMonths = targetMonths.error;
  return hasErrors(errors) ? { errors } : { parsed: { balance: balance.value?.toString() ?? '0', annualRate: annualRate.value?.toString() ?? '0', mode: values.mode, monthlyPaymentAmount: monthlyPaymentAmount.value?.toString() ?? '0', targetMonths: targetMonths.value?.toString() ?? '0' }, errors };
}

function calculateResult(input: CreditCardFormState) {
  const paymentToUse = input.mode === 'payment' ? Number(input.monthlyPaymentAmount) : calculateCreditCardPaymentForTargetMonths(Number(input.balance), Number(input.annualRate), Number(input.targetMonths));
  return { paymentToUse, payoff: calculateCreditCardPayoffWithPayment(Number(input.balance), Number(input.annualRate), paymentToUse), mode: input.mode, targetMonths: Number(input.targetMonths), balance: Number(input.balance) };
}

export function CreditCardPayoffCalculatorPage() {
  const [values, setValues] = useState<CreditCardFormState>(defaults);
  const [touched, setTouched] = useState<Partial<Record<CreditCardFields, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<CreditCardFields>>({});
  const [lastSubmittedValues, setLastSubmittedValues] = useState<CreditCardFormState | null>(null);
  const [result, setResult] = useState<ReturnType<typeof calculateResult> | null>(null);
  const applySharedValues = useCallback((sharedValues: Partial<CreditCardFormState>) => setValues((current) => ({ ...current, ...sharedValues })), []);
  const { share, shareEnabled, shareMessage, shareNotice } = useShareableCalculator({ pathname: '/calculators/credit-card-payoff', schema: creditCardShareSchema, submittedValues: lastSubmittedValues, applySharedValues });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    const next = validate(values);
    const nextErrors = { ...next.errors };
    if (!hasErrors(next.errors) && next.parsed) {
      const calculated = calculateResult(next.parsed);
      if (next.parsed.mode === 'payment' && calculated.payoff.paymentTooLow) {
        nextErrors.monthlyPaymentAmount = 'Payment must be higher than the first month of interest to reduce the balance.';
      }
      setErrors(nextErrors);
      if (!hasErrors(nextErrors)) {
        setLastSubmittedValues(next.parsed);
        setResult(calculated);
      } else if (calculated.payoff.paymentTooLow) {
        setLastSubmittedValues(null);
        setResult(null);
      }
      return;
    }
    setErrors(nextErrors);
  };

  const chartPoints = useMemo(() => {
    if (!result || result.payoff.paymentTooLow || !lastSubmittedValues) return [];
    return sampleChartSeries([{ label: 'Start', value: Number(lastSubmittedValues.balance) }, ...result.payoff.schedule.map((row) => ({ label: `Month ${row.paymentNumber}`, value: row.balance }))], 18);
  }, [lastSubmittedValues, result]);

  const description = 'Estimate credit-card payoff time with either a fixed payment or a target payoff period, and flag impossible payment scenarios clearly.';
  return <CalculatorShell slug="credit-card-payoff" title="Credit Card Payoff Calculator" description={description} metaDescription="Calculate credit-card payoff time, total interest, and required payment with safeguards for impossible payment scenarios." path="/calculators/credit-card-payoff" structuredData={buildCalculatorStructuredData('Credit Card Payoff Calculator', description, '/calculators/credit-card-payoff', creditFaqs)}
    form={<section className="card"><SectionHeading title="Inputs" eyebrow="Calculator form" />{shareNotice ? <InfoNotice tone={shareNotice.tone} title={shareNotice.title}>{shareNotice.message}</InfoNotice> : null}<form className="calculator-form" noValidate onSubmit={handleSubmit}><FormField id="cc-balance" label="Current balance" error={(touched.balance || submitted) ? errors.balance : undefined} prefix="$" step="0.01" type="number" value={values.balance} onBlur={() => setTouched((current) => ({ ...current, balance: true }))} onChange={(event) => setValues((current) => ({ ...current, balance: event.target.value }))} /><FormField id="cc-apr" label="APR" error={(touched.annualRate || submitted) ? errors.annualRate : undefined} suffix="%" step="0.01" type="number" value={values.annualRate} onBlur={() => setTouched((current) => ({ ...current, annualRate: true }))} onChange={(event) => setValues((current) => ({ ...current, annualRate: event.target.value }))} /><FormField id="cc-mode" label="Payoff mode"><select value={values.mode} onChange={(event) => setValues((current) => ({ ...current, mode: event.target.value }))}><option value="payment">Use a fixed monthly payment</option><option value="months">Use a desired payoff period</option></select></FormField>{values.mode === 'payment' ? <FormField id="cc-payment" label="Monthly payment" error={(touched.monthlyPaymentAmount || submitted) ? errors.monthlyPaymentAmount : undefined} prefix="$" step="0.01" type="number" value={values.monthlyPaymentAmount} onBlur={() => setTouched((current) => ({ ...current, monthlyPaymentAmount: true }))} onChange={(event) => setValues((current) => ({ ...current, monthlyPaymentAmount: event.target.value }))} /> : <FormField id="cc-target-months" label="Desired payoff period in months" error={(touched.targetMonths || submitted) ? errors.targetMonths : undefined} step="1" type="number" value={values.targetMonths} onBlur={() => setTouched((current) => ({ ...current, targetMonths: true }))} onChange={(event) => setValues((current) => ({ ...current, targetMonths: event.target.value }))} />}<CalculatorActions><button type="submit">Calculate</button><button type="button" onClick={() => { setValues(defaults); setTouched({}); setSubmitted(false); setErrors({}); setLastSubmittedValues(null); setResult(null); }}>Start over</button></CalculatorActions></form></section>}
    results={<ResultsPanel title="Results">{result && lastSubmittedValues ? <div className="content-stack"><PrimaryResult label="Estimated payoff time" value={formatYearsMonths(result.payoff.months)} detail={result.mode === 'months' ? `Required payment to reach the selected payoff period: ${formatCurrency(result.paymentToUse)}.` : undefined} /><SecondaryResultGrid items={[{ label: 'Monthly payment used', value: formatCurrency(result.paymentToUse) }, { label: 'Total interest', value: formatCurrency(result.payoff.totalInterest) }, { label: 'Total amount paid', value: formatCurrency(result.payoff.totalPaid) }, { label: 'Final displayed balance', value: formatCurrency(result.payoff.schedule.at(-1)?.balance ?? 0) }]} /><div className="button-row result-actions"><CopyResultButton getText={() => formatCreditCardCopySummary(result)} /><ShareCalculationButton disabled={!shareEnabled} message={shareMessage} onShare={share} /></div>{!result.payoff.paymentTooLow ? <ChartCard title="Balance decline" summary={<p>Starting balance: {formatCurrency(result.balance)}. Ending balance: {formatCurrency(result.payoff.schedule.at(-1)?.balance ?? 0)}. Payoff duration: {formatYearsMonths(result.payoff.months)}.</p>}><SimpleLineChart ariaLabel="Credit-card balance decline over the payoff period" points={chartPoints} /></ChartCard> : null}<InfoNotice tone="info" title="Estimate note">This payoff estimate uses a monthly APR approximation and assumes no new purchases, fees, or rate changes.</InfoNotice><ExpandableTableSection title="Payoff schedule" summaryTitle="Payoff summary" summaryHeaders={['Metric', 'Value']} summaryRows={[['Estimated payoff time', formatYearsMonths(result.payoff.months)], ['Monthly payment used', formatCurrency(result.paymentToUse)], ['Total interest', formatCurrency(result.payoff.totalInterest)], ['Total amount paid', formatCurrency(result.payoff.totalPaid)]]} detailTitle="Monthly payoff schedule" detailHeaders={['Month', 'Payment', 'Principal', 'Interest', 'Balance']} detailRows={result.payoff.schedule.map((row) => [row.paymentNumber, formatCurrency(row.payment), formatCurrency(row.principal), formatCurrency(row.interest), formatCurrency(row.balance)])} /></div> : <EmptyResultState title="No result yet" description="Enter the balance, APR, and payment approach, then select Calculate to see the estimated payoff timeline." />}</ResultsPanel>}
    info={<div className="content-stack"><CalculationAssumptions items={[{ label: 'APR approximation', value: 'APR is converted to a monthly rate for planning purposes rather than issuer-specific daily compounding.' }, { label: 'Payment assumption', value: 'The calculator assumes a fixed payment amount unless you choose a target payoff period.' }, { label: 'No new charges', value: 'The schedule assumes no new purchases, annual fees, late fees, or penalty rates.' }, { label: 'Rate stability', value: 'The APR is assumed to stay constant across the payoff period.' }]} /><InfoBlock formula="When a fixed payment is entered, each month applies interest first and the remaining amount reduces principal. In payoff-period mode, the calculator solves for the payment needed to amortize the balance over the chosen number of months." explanation="This is a monthly-interest estimate, not a statement-level replica of any specific card issuer. Payments that fail to cover interest are blocked to avoid misleading results." example={{ title: 'Worked example', description: 'An $8,000 balance at 19.99% APR with a $250 monthly payment takes several years to eliminate and produces a total paid amount noticeably above the original balance because of interest.' }} faqs={creditFaqs} related={[{ label: 'Loan Payment Calculator', to: '/calculators/loan-payment' }, { label: 'Budget Planner', to: '/calculators/budget-planner' }, { label: 'Mortgage Calculator', to: '/calculators/mortgage' }]} disclaimer="Credit-card payoff results are estimate-only and do not replace issuer disclosures or account statements." /></div>}
  />;
}
