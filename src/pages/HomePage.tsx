import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';

import { CalculatorCard } from '../components/CalculatorCard';
import { EmptyResultState } from '../components/EmptyResultState';
import { PageHero } from '../components/PageHero';
import { SectionHeading } from '../components/SectionHeading';
import { usePreferences } from '../context/PreferencesContext';
import { calculatorDefinitions } from '../data/calculators';
import { pageMeta } from '../data/site';
import { useDocumentMeta } from '../utils/metadata';
import { filterCalculators, recommendCalculators } from '../utils/search';
import { buildWebPageStructuredData } from '../utils/structuredData';

export function HomePage() {
  useDocumentMeta(
    pageMeta.home,
    buildWebPageStructuredData(
      'Financial Calculator Hub',
      'Local-only financial calculators for income, debt, savings, budgeting, mortgages, and retirement planning.',
      '/',
      'WebSite',
    ),
  );
  const [query, setQuery] = useState('');
  const { preferences, clearRecentCalculators } = usePreferences();
  const filtered = useMemo(() => filterCalculators(calculatorDefinitions, query).slice(0, 4), [query]);
  const recommendations = useMemo(() => recommendCalculators(calculatorDefinitions, query), [query]);
  const recent = calculatorDefinitions.filter((calculator) => preferences.recentCalculators.includes(calculator.slug));
  const orderedRecent = preferences.recentCalculators
    .map((slug) => recent.find((item) => item.slug === slug))
    .filter(Boolean);

  return (
    <div className="content-stack">
      <PageHero
        eyebrow="Local-only financial tools"
        title="Plan with browser-based calculators that keep your numbers on your device"
        description="This site runs locally first, requires no registration, and does not currently activate analytics, advertising, donations, or external data transmission."
      />
      <div className="hero-actions">
        <Link className="button" to="/calculators">
          Browse calculators
        </Link>
        <Link className="button-secondary" to="/privacy-policy">
          Review privacy details
        </Link>
      </div>
      <section className="card search-bar">
        <SectionHeading
          title="Find a calculator"
          eyebrow="Discovery"
          aside={
            query ? (
              <button type="button" onClick={() => setQuery('')}>
                Reset search
              </button>
            ) : null
          }
        />
        <label htmlFor="home-search">Search by name, category, keyword, or common term</label>
        <input
          id="home-search"
          placeholder="Try: home loan, compound interest, hourly pay, debt payoff"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="directory-grid">
          {filtered.length ? (
            filtered.map((calculator) => (
              <CalculatorCard
                category={calculator.category}
                description={calculator.description}
                key={calculator.slug}
                query={query}
                route={calculator.route}
                slug={calculator.slug}
                title={calculator.title}
              />
            ))
          ) : (
            <EmptyResultState
              title="No calculator matches that search"
              description="Try a broader term like mortgage, savings, budget, or loan. Related calculators are shown below."
            />
          )}
        </div>
        {!filtered.length && recommendations.length ? (
          <div className="content-stack">
            <p className="muted">Recommended calculators</p>
            <div className="directory-grid">
              {recommendations.map((calculator) => (
                <CalculatorCard
                  category={calculator.category}
                  description={calculator.description}
                  key={calculator.slug}
                  query={query}
                  route={calculator.route}
                  slug={calculator.slug}
                  title={calculator.title}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>
      <section className="card">
        <SectionHeading
          title="Recently used calculators"
          eyebrow="Continue"
          aside={
            orderedRecent.length ? (
              <button type="button" onClick={clearRecentCalculators}>
                Clear recent history
              </button>
            ) : null
          }
        />
        {orderedRecent.length ? (
          <div className="directory-grid">
            {orderedRecent.map((calculator) =>
              calculator ? (
                <CalculatorCard
                  category={calculator.category}
                  description={calculator.description}
                  key={calculator.slug}
                  route={calculator.route}
                  slug={calculator.slug}
                  title={calculator.title}
                />
              ) : null,
            )}
          </div>
        ) : (
          <EmptyResultState
            title="No recent calculators yet"
            description="Open a calculator and it will appear here for quick return access on this device."
          />
        )}
      </section>
      <section className="card">
        <SectionHeading title="What the site covers" eyebrow="Categories" />
        <ul className="category-grid">
          <li className="subtle-card"><h3>Income</h3><p>Hourly and salary planning with gross and estimated take-home views.</p></li>
          <li className="subtle-card"><h3>Borrowing</h3><p>Loan and installment-payment analysis with amortization support.</p></li>
          <li className="subtle-card"><h3>Home</h3><p>Mortgage costs with tax, insurance, HOA, and loan reconciliation.</p></li>
          <li className="subtle-card"><h3>Saving</h3><p>Savings growth and retirement projections with contribution timing.</p></li>
          <li className="subtle-card"><h3>Debt</h3><p>Credit-card payoff timelines and interest tracking.</p></li>
          <li className="subtle-card"><h3>Planning</h3><p>Budgeting and cash-flow estimates without external account access.</p></li>
        </ul>
      </section>
    </div>
  );
}
