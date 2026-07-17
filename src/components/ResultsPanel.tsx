import type { ReactNode } from 'react';

type ResultsPanelProps = {
  title: string;
  children: ReactNode;
};

export function ResultsPanel({ title, children }: ResultsPanelProps) {
  return (
    <section className="results-panel" aria-live="polite" aria-atomic="true">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
