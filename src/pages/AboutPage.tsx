import { Link } from 'react-router-dom';

import { PageHero } from '../components/PageHero';
import { pageMeta } from '../data/site';
import { useDocumentMeta } from '../utils/metadata';
import { buildWebPageStructuredData } from '../utils/structuredData';

export function AboutPage() {
  useDocumentMeta(
    pageMeta.about,
    buildWebPageStructuredData(
      'About Financial Calculator Hub',
      'Learn how the local-only financial calculator site works, what it stores, and what it does not do.',
      '/about',
    ),
  );

  return (
    <div className="content-stack">
      <PageHero
        eyebrow="About"
        title="A local-first finance calculator website"
        description="This website is built for browser-based estimates, transparent assumptions, and responsive forms that work locally first."
      />
      <section className="card">
        <h2>What this site does</h2>
        <p>
          It helps with common planning tasks such as income conversion, debt payoff estimates, savings growth, mortgage modeling, monthly budgeting, and retirement projections.
        </p>
      </section>
      <section className="card">
        <h2>How it runs today</h2>
        <p>
          Calculations run in the browser. The current application has no account system, no backend, no database, and no active analytics, advertising, or donation integration.
        </p>
        <p>
          Only non-sensitive local preferences such as favorites, recent calculators, reduced-motion choice, schedule expansion choice, and currency display format are intended to be stored on the device.
        </p>
      </section>
      <section className="card">
        <h2>What this site does not do</h2>
        <p>
          It does not connect to financial institutions, collect account credentials, submit calculations to a backend service, or replace professional advice.
        </p>
        <p>
          For assumptions and limitations, review the <Link to="/financial-disclaimer">Financial Disclaimer</Link>.
        </p>
      </section>
    </div>
  );
}
