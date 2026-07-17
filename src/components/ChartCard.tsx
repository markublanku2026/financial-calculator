import type { ReactNode } from 'react';

export function ChartCard({ title, summary, children }: { title: string; summary: ReactNode; children: ReactNode }) {
  return (
    <section className="card chart-card">
      <h3>{title}</h3>
      <div className="muted chart-summary">{summary}</div>
      <div className="chart-frame">{children}</div>
    </section>
  );
}
