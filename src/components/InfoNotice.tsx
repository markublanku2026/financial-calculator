import type { ReactNode } from 'react';

export function InfoNotice({ tone = 'info', title, children }: { tone?: 'info' | 'success' | 'warning' | 'error'; title?: string; children: ReactNode }) {
  return (
    <section className={`notice notice-${tone}`} aria-live={tone === 'success' ? 'polite' : undefined}>
      {title ? <strong>{title}</strong> : null}
      <div>{children}</div>
    </section>
  );
}
