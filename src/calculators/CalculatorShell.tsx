import { useEffect, type ReactNode } from 'react';

import { FavoriteButton } from '../components/FavoriteButton';
import { PageHero } from '../components/PageHero';
import { usePreferences } from '../context/PreferencesContext';
import { useDocumentMeta } from '../utils/metadata';

type CalculatorShellProps = {
  slug: string;
  title: string;
  description: string;
  metaDescription: string;
  path: string;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
  form: ReactNode;
  results: ReactNode;
  info: ReactNode;
};

export function CalculatorShell({
  slug,
  title,
  description,
  metaDescription,
  path,
  structuredData,
  form,
  results,
  info,
}: CalculatorShellProps) {
  useDocumentMeta({ title, description: metaDescription, path }, structuredData);
  const { addRecentCalculator } = usePreferences();

  useEffect(() => {
    addRecentCalculator(slug);
  }, [addRecentCalculator, slug]);

  return (
    <>
      <PageHero eyebrow="Financial calculator" title={title} description={description} />
      <div className="hero-actions">
        <FavoriteButton slug={slug} title={title} />
      </div>
      <div className="calculator-layout">
        <div className="content-stack">
          {form}
          {results}
        </div>
        <div className="content-stack">{info}</div>
      </div>
    </>
  );
}
