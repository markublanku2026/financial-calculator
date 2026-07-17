import { PageHero } from '../components/PageHero';
import { pageMeta } from '../data/site';
import { useDocumentMeta } from '../utils/metadata';
import { buildWebPageStructuredData } from '../utils/structuredData';

export function FinancialDisclaimerPage() {
  useDocumentMeta(
    pageMeta.disclaimer,
    buildWebPageStructuredData(
      'Financial Disclaimer',
      'Estimate-only financial disclaimer for the local-only financial calculator website.',
      '/financial-disclaimer',
    ),
  );

  return (
    <div className="content-stack">
      <PageHero
        eyebrow="Disclaimer"
        title="Financial Disclaimer"
        description="Every calculator on this site is for educational and planning estimates only."
      />
      <section className="card">
        <h2>Estimate-only outputs</h2>
        <p>
          Rates, withholding, insurance costs, lender terms, investment returns, credit-card billing methods, and payroll details can differ from the simplified assumptions used here.
        </p>
      </section>
      <section className="card">
        <h2>No professional advice</h2>
        <p>
          Nothing on this website is financial, tax, accounting, lending, investment, legal, or retirement advice. Use qualified professionals when accuracy is important to an actual transaction or filing.
        </p>
      </section>
      <section className="card">
        <h2>Verification responsibility</h2>
        <p>
          Confirm important decisions with official disclosures, account statements, tax-year rules, plan documents, lenders, and qualified professionals. Calculator outputs here are informational estimates, not guarantees or approvals.
        </p>
      </section>
    </div>
  );
}
