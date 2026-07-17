import { useId } from 'react';
import type { ReactNode } from 'react';

import { usePreferences } from '../context/PreferencesContext';
import { InfoNotice } from './InfoNotice';
import { ResponsiveTable } from './ResponsiveTable';

export function ExpandableTableSection({
  title,
  summaryTitle,
  summaryRows,
  summaryHeaders,
  detailTitle,
  detailHeaders,
  detailRows,
  initialLimit = 12,
  limitNotice,
}: {
  title: string;
  summaryTitle: string;
  summaryHeaders: string[];
  summaryRows: Array<Array<ReactNode>>;
  detailTitle: string;
  detailHeaders: string[];
  detailRows: Array<Array<ReactNode>>;
  initialLimit?: number;
  limitNotice?: string;
}) {
  const { preferences, setSchedulesExpanded } = usePreferences();
  const expanded = preferences.schedulesExpanded;
  const sectionId = useId();
  const visibleRows = expanded ? detailRows : detailRows.slice(0, initialLimit);
  const hasMoreRows = detailRows.length > initialLimit;

  return (
    <div className="content-stack">
      <ResponsiveTable title={summaryTitle} headers={summaryHeaders} rows={summaryRows} />
      <section className="content-stack" id={sectionId}>
        <ResponsiveTable
          title={expanded ? detailTitle : `${detailTitle} (first ${Math.min(initialLimit, detailRows.length)} rows)`}
          headers={detailHeaders}
          rows={visibleRows}
        />
        {hasMoreRows ? (
          <div className="table-toggle-row">
            <button
              type="button"
              aria-controls={sectionId}
              aria-expanded={expanded}
              onClick={() => setSchedulesExpanded(!expanded)}
            >
              {expanded ? 'Show fewer rows' : `Show full ${title.toLowerCase()}`}
            </button>
            <p className="muted">
              {expanded
                ? `Showing all ${detailRows.length} rows.`
                : `Showing the first ${initialLimit} of ${detailRows.length} rows.`}
            </p>
          </div>
        ) : null}
        {limitNotice ? <InfoNotice tone="info" title="Display note">{limitNotice}</InfoNotice> : null}
      </section>
    </div>
  );
}
