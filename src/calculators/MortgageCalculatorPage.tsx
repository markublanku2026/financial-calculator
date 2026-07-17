import { useCallback, useMemo, useState, type FormEvent } from 'react';

import { mortgageShareSchema } from '../data/shareSchemas';
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
import { SimpleDonutChart } from '../components/SimpleDonutChart';
import { useShareableCalculator } from '../hooks/useShareableCalculator';
import { CalculatorShell } from './CalculatorShell';
import { formatMortgageCopySummary } from '../utils/copySummaries';
import { calculateMortgage } from '../utils/financial';
import { formatCurrency } from '../utils/format';
import { buildCalculatorStructuredData } from '../utils/structuredData';
import { hasErrors, type FieldErrors, validateNumberField } from '../utils/validation';

export type MortgageFields = 'homePrice' | 'downPayment' | 'interestRate' | 'loanTermYears' | 'annualPropertyTax' | 'annualInsurance' | 'hoaMonthly' | 'mortgageInsuranceMonthly';
export type MortgageFormState = Record<MortgageFields, string>;

const defaults: MortgageFormState = { homePrice: '425000', downPayment: '85000', interestRate: '6.75', loanTermYears: '30', annualPropertyTax: '4800', annualInsurance: '1800', hoaMonthly: '150', mortgageInsuranceMonthly: '0' };
const mortgageFaqs = [
  { question: 'What is included in the total estimated monthly payment?', answer: 'It includes principal and interest, monthly property tax, monthly homeowners insurance, HOA dues, and mortgage insurance if you enter it.' },
  { question: 'Does total loan cost include taxes and insurance?', answer: 'No. Total loan cost here means total principal plus total interest paid through the amortization schedule.' },
  { question: 'Why is the final balance near zero instead of exactly zero?', answer: 'Internal math keeps full precision and only rounds for display, so the final visible balance can be a tiny remainder before rounding to zero.' },
  { question: 'Can down payment be larger than the home price?', answer: 'No. That would imply no mortgage loan is needed, so the form blocks it as an invalid mortgage input.' },
];

function validate(values: MortgageFormState): { parsed?: MortgageFormState; errors: FieldErrors<MortgageFields> } {
  const errors: FieldErrors<MortgageFields> = {};
  const fields = {
    homePrice: validateNumberField(values.homePrice, 'Home price', { min: 0, allowZero: false }),
    downPayment: validateNumberField(values.downPayment, 'Down payment', { min: 0 }),
    interestRate: validateNumberField(values.interestRate, 'Interest rate', { min: 0, max: 100 }),
    loanTermYears: validateNumberField(values.loanTermYears, 'Loan term in years', { min: 1, max: 50, allowZero: false, integer: true }),
    annualPropertyTax: validateNumberField(values.annualPropertyTax, 'Annual property tax', { min: 0 }),
    annualInsurance: validateNumberField(values.annualInsurance, 'Annual homeowners insurance', { min: 0 }),
    hoaMonthly: validateNumberField(values.hoaMonthly, 'Monthly HOA fee', { min: 0 }),
    mortgageInsuranceMonthly: validateNumberField(values.mortgageInsuranceMonthly, 'Monthly mortgage insurance', { min: 0 }),
  };
  for (const [key, value] of Object.entries(fields)) if (value.error) errors[key as MortgageFields] = value.error;
  if (!fields.homePrice.error && !fields.downPayment.error && (fields.downPayment.value ?? 0) > (fields.homePrice.value ?? 0)) errors.downPayment = 'Down payment cannot be greater than the home price.';
  return hasErrors(errors) ? { errors } : { parsed: { homePrice: fields.homePrice.value?.toString() ?? '0', downPayment: fields.downPayment.value?.toString() ?? '0', interestRate: fields.interestRate.value?.toString() ?? '0', loanTermYears: fields.loanTermYears.value?.toString() ?? '0', annualPropertyTax: fields.annualPropertyTax.value?.toString() ?? '0', annualInsurance: fields.annualInsurance.value?.toString() ?? '0', hoaMonthly: fields.hoaMonthly.value?.toString() ?? '0', mortgageInsuranceMonthly: fields.mortgageInsuranceMonthly.value?.toString() ?? '0' }, errors };
}

function calculateResult(input: MortgageFormState) {
  return calculateMortgage({ homePrice: Number(input.homePrice), downPayment: Number(input.downPayment), annualRatePercent: Number(input.interestRate), loanTermYears: Number(input.loanTermYears), annualPropertyTax: Number(input.annualPropertyTax), annualInsurance: Number(input.annualInsurance), hoaMonthly: Number(input.hoaMonthly), mortgageInsuranceMonthly: Number(input.mortgageInsuranceMonthly) });
}

export function MortgageCalculatorPage() {
  const [values, setValues] = useState<MortgageFormState>(defaults);
  const [touched, setTouched] = useState<Partial<Record<MortgageFields, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<MortgageFields>>({});
  const [lastSubmittedValues, setLastSubmittedValues] = useState<MortgageFormState | null>(null);
  const [result, setResult] = useState<ReturnType<typeof calculateResult> | null>(null);
  const applySharedValues = useCallback((sharedValues: Partial<MortgageFormState>) => setValues((current) => ({ ...current, ...sharedValues })), []);
  const { share, shareEnabled, shareMessage, shareNotice } = useShareableCalculator({ pathname: '/calculators/mortgage', schema: mortgageShareSchema, submittedValues: lastSubmittedValues, applySharedValues });
  const chartData = useMemo(() => result ? [
    { label: 'Principal and interest', value: result.principalAndInterest, displayValue: formatCurrency(result.principalAndInterest) },
    { label: 'Property tax', value: result.propertyTax, displayValue: formatCurrency(result.propertyTax) },
    { label: 'Insurance', value: result.insurance, displayValue: formatCurrency(result.insurance) },
    ...(result.hoa > 0 ? [{ label: 'HOA', value: result.hoa, displayValue: formatCurrency(result.hoa) }] : []),
    ...(result.mortgageInsurance > 0 ? [{ label: 'Mortgage insurance', value: result.mortgageInsurance, displayValue: formatCurrency(result.mortgageInsurance) }] : []),
  ] : [], [result]);

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

  const description = 'Estimate mortgage principal and interest, taxes, insurance, HOA, mortgage insurance, and a reconciling amortization schedule.';
  return <CalculatorShell slug="mortgage" title="Mortgage Calculator" description={description} metaDescription="Calculate mortgage payment components, total interest, total loan cost, and a reconciling amortization schedule." path="/calculators/mortgage" structuredData={buildCalculatorStructuredData('Mortgage Calculator', description, '/calculators/mortgage', mortgageFaqs)}
    form={<section className="card"><SectionHeading title="Inputs" eyebrow="Calculator form" />{shareNotice ? <InfoNotice tone={shareNotice.tone} title={shareNotice.title}>{shareNotice.message}</InfoNotice> : null}<form className="calculator-form" noValidate onSubmit={handleSubmit}><FormField id="home-price" label="Home price" error={(touched.homePrice || submitted) ? errors.homePrice : undefined} prefix="$" step="0.01" type="number" value={values.homePrice} onBlur={() => setTouched((current) => ({ ...current, homePrice: true }))} onChange={(event) => setValues((current) => ({ ...current, homePrice: event.target.value }))} /><FormField id="down-payment" label="Down payment" error={(touched.downPayment || submitted) ? errors.downPayment : undefined} prefix="$" step="0.01" type="number" value={values.downPayment} onBlur={() => setTouched((current) => ({ ...current, downPayment: true }))} onChange={(event) => setValues((current) => ({ ...current, downPayment: event.target.value }))} /><FormField id="mortgage-rate" label="Interest rate" error={(touched.interestRate || submitted) ? errors.interestRate : undefined} suffix="%" step="0.01" type="number" value={values.interestRate} onBlur={() => setTouched((current) => ({ ...current, interestRate: true }))} onChange={(event) => setValues((current) => ({ ...current, interestRate: event.target.value }))} /><FormField id="loan-term-years" label="Loan term in years" error={(touched.loanTermYears || submitted) ? errors.loanTermYears : undefined} step="1" type="number" value={values.loanTermYears} onBlur={() => setTouched((current) => ({ ...current, loanTermYears: true }))} onChange={(event) => setValues((current) => ({ ...current, loanTermYears: event.target.value }))} /><FormField id="property-tax" label="Annual property tax" error={(touched.annualPropertyTax || submitted) ? errors.annualPropertyTax : undefined} prefix="$" step="0.01" type="number" value={values.annualPropertyTax} onBlur={() => setTouched((current) => ({ ...current, annualPropertyTax: true }))} onChange={(event) => setValues((current) => ({ ...current, annualPropertyTax: event.target.value }))} /><FormField id="homeowners-insurance" label="Annual homeowners insurance" error={(touched.annualInsurance || submitted) ? errors.annualInsurance : undefined} prefix="$" step="0.01" type="number" value={values.annualInsurance} onBlur={() => setTouched((current) => ({ ...current, annualInsurance: true }))} onChange={(event) => setValues((current) => ({ ...current, annualInsurance: event.target.value }))} /><FormField id="hoa" label="Monthly HOA fee" error={(touched.hoaMonthly || submitted) ? errors.hoaMonthly : undefined} prefix="$" step="0.01" type="number" value={values.hoaMonthly} onBlur={() => setTouched((current) => ({ ...current, hoaMonthly: true }))} onChange={(event) => setValues((current) => ({ ...current, hoaMonthly: event.target.value }))} /><FormField id="mortgage-insurance" label="Monthly mortgage insurance" error={(touched.mortgageInsuranceMonthly || submitted) ? errors.mortgageInsuranceMonthly : undefined} prefix="$" step="0.01" type="number" value={values.mortgageInsuranceMonthly} onBlur={() => setTouched((current) => ({ ...current, mortgageInsuranceMonthly: true }))} onChange={(event) => setValues((current) => ({ ...current, mortgageInsuranceMonthly: event.target.value }))} /><CalculatorActions><button type="submit">Calculate</button><button type="button" onClick={() => { setValues(defaults); setTouched({}); setSubmitted(false); setErrors({}); setLastSubmittedValues(null); setResult(null); }}>Start over</button></CalculatorActions></form></section>}
    results={<ResultsPanel title="Results">{result ? <div className="content-stack"><PrimaryResult label="Estimated total monthly housing payment" value={formatCurrency(result.totalMonthlyPayment)} detail="This estimate combines principal and interest with the entered recurring housing costs." /><SecondaryResultGrid items={[{ label: 'Principal and interest', value: formatCurrency(result.principalAndInterest) }, { label: 'Property tax', value: formatCurrency(result.propertyTax) }, { label: 'Insurance', value: formatCurrency(result.insurance) }, { label: 'HOA', value: formatCurrency(result.hoa) }, { label: 'Mortgage insurance', value: formatCurrency(result.mortgageInsurance) }, { label: 'Total interest', value: formatCurrency(result.totalInterest) }, { label: 'Total loan cost', value: formatCurrency(result.totalLoanCost) }]} /><div className="button-row result-actions"><CopyResultButton getText={() => formatMortgageCopySummary(result)} /><ShareCalculationButton disabled={!shareEnabled} message={shareMessage} onShare={share} /></div><ChartCard title="Monthly payment composition" summary={<p>Total estimated monthly housing payment: {formatCurrency(result.totalMonthlyPayment)}. Zero-value categories are excluded from the visual summary.</p>}><SimpleDonutChart ariaLabel="Mortgage payment composition showing principal and interest, property tax, insurance, HOA, and mortgage insurance" data={chartData} /></ChartCard><InfoNotice tone="info" title="Included costs">This monthly estimate includes only the mortgage payment components you entered here. Maintenance, utilities, and closing costs are excluded.</InfoNotice><ExpandableTableSection title="Amortization schedule" summaryTitle="Amortization summary" summaryHeaders={['Metric', 'Value']} summaryRows={[['Loan amount', formatCurrency(result.loanAmount)], ['Total principal and interest paid', formatCurrency(result.totalPrincipalAndInterestPaid)], ['Total interest', formatCurrency(result.totalInterest)], ['Final displayed balance', formatCurrency(result.schedule.at(-1)?.balance ?? 0)]]} detailTitle="Monthly amortization schedule" detailHeaders={['Payment', 'Amount', 'Principal', 'Interest', 'Balance']} detailRows={result.schedule.map((row) => [row.paymentNumber, formatCurrency(row.payment), formatCurrency(row.principal), formatCurrency(row.interest), formatCurrency(row.balance)])} /></div> : <EmptyResultState title="No result yet" description="Enter the home price, loan terms, and recurring housing costs, then select Calculate to see the estimated monthly payment." />}</ResultsPanel>}
    info={<div className="content-stack"><CalculationAssumptions items={[{ label: 'Rate structure', value: 'The calculator assumes a fixed-rate mortgage with monthly payments.' }, { label: 'Included costs', value: 'Principal and interest, property tax, homeowners insurance, HOA, and mortgage insurance are included when entered.' }, { label: 'Excluded costs', value: 'Maintenance, utilities, repairs, closing costs, and one-time fees are excluded.' }, { label: 'Rounding', value: 'The amortization schedule keeps full precision internally and rounds only for display.' }]} /><InfoBlock formula="Total estimated monthly payment = principal and interest + monthly property tax + monthly homeowners insurance + HOA + monthly mortgage insurance." explanation="Principal and interest come from the amortized loan formula. Taxes, insurance, HOA dues, and mortgage insurance are added separately so the labels match the values being shown." example={{ title: 'Worked example', description: 'A $425,000 home with $85,000 down at 6.75% over 30 years produces the core principal-and-interest payment, then adds entered tax, insurance, HOA, and mortgage-insurance costs for the total estimated monthly housing payment.' }} faqs={mortgageFaqs} related={[{ label: 'Loan Payment Calculator', to: '/calculators/loan-payment' }, { label: 'Budget Planner', to: '/calculators/budget-planner' }, { label: 'Credit Card Payoff Calculator', to: '/calculators/credit-card-payoff' }]} disclaimer="Mortgage outputs are estimates only and should be confirmed with official lender disclosures and escrow details." /></div>}
  />;
}
