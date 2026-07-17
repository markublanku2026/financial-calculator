import type { ReactNode } from 'react';

type StatItem = {
  label: string;
  value: string;
  tone?: 'default' | 'danger';
};

type StatGridProps = {
  items: StatItem[];
  footer?: ReactNode;
};

export function StatGrid({ items, footer }: StatGridProps) {
  return (
    <>
      <div className="stat-grid">
        {items.map((item) => (
          <div className={`stat-card ${item.tone === 'danger' ? 'stat-card-danger' : ''}`} key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
      {footer}
    </>
  );
}
