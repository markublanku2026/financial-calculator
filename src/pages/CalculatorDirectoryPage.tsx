import { useMemo, useState } from 'react';

import { AdSlot } from '../components/AdSlot';
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

export function CalculatorDirectoryPage() {
  useDocumentMeta(
    pageMeta.directory,
    buildWebPageStructuredData(
      'Calculator Directory',
      'Search and browse the local-only financial calculator directory by category and keyword.',
      '/calculators',
      'CollectionPage',
    ),
  );
  const [query, setQuery] = useState('');
  const { preferences, clearFavorites } = usePreferences();
  const filtered = useMemo(() => filterCalculators(calculatorDefinitions, query), [query]);
  const recommendations = useMemo(() => recommendCalculators(calculatorDefinitions, query), [query]);
  const groupedCategories = ['Income', 'Borrowing', 'Home', 'Saving', 'Debt', 'Planning'] as const;
  const favorites = useMemo(
    () => filterCalculators(
      calculatorDefinitions.filter((calculator) => preferences.favorites.includes(calculator.slug)),
      query,
    ),
    [preferences.favorites, query],
  );

  return (
    <div className="content-stack">
      <PageHero
        eyebrow="Directory"
        title="Search the calculator library"
        description="Browse calculators by category, alias, or planning task and save favorites for quick access on this device."
      />
      <section className="card search-bar">
        <SectionHeading
          title="Find a calculator"
          eyebrow="Search"
          aside={
            query ? (
              <button type="button" onClick={() => setQuery('')}>
                Reset search
              </button>
            ) : null
          }
        />
        <label htmlFor="calculator-search">Search calculators</label>
        <input
          id="calculator-search"
          type="search"
          placeholder="Try: home loan, debt payoff, spending plan, compound interest"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <p className="muted">{filtered.length} calculator(s) match your search.</p>
      </section>
      <section className="card">
        <SectionHeading
          title="Favorites"
          eyebrow="Saved"
          aside={favorites.length ? <button type="button" onClick={clearFavorites}>Clear favorites</button> : null}
        />
        {favorites.length ? (
          <div className="directory-grid">
            {favorites.map((calculator) => (
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
        ) : (
          <EmptyResultState
            title="No favorites yet"
            description="Use the favorite control on any calculator card or calculator page to keep it here."
          />
        )}
      </section>
      <section>
        <SectionHeading title="Categories" eyebrow="Browse" />
        <ul className="category-grid">
          {groupedCategories.map((category) => (
            <li className="subtle-card" key={category}>
              <h3>{category}</h3>
              <p>{calculatorDefinitions.filter((item) => item.category === category).length} tool(s) in this category.</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <SectionHeading title="All calculators" eyebrow="Library" />
        {filtered.length ? (
          <div className="directory-grid">
            {filtered.map((calculator) => (
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
        ) : (
          <div className="card content-stack">
            <EmptyResultState
              title="No exact matches"
              description="Try a broader term or open one of the recommended calculators below."
            />
            {recommendations.length ? (
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
            ) : null}
          </div>
        )}
      </section>
      <AdSlot placement="directory-bottom" />
    </div>
  );
}
