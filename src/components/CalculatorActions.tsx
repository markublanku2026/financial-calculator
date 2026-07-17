import type { ReactNode } from 'react';

export function CalculatorActions({ children }: { children: ReactNode }) {
  return <div className="button-row calculator-actions">{children}</div>;
}
