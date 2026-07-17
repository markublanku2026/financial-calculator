const palette = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)'];

export function SimpleDonutChart({
  data,
  ariaLabel,
}: {
  data: Array<{ label: string; value: number; displayValue: string }>;
  ariaLabel: string;
}) {
  const sanitized = data.filter((item) => Number.isFinite(item.value) && item.value > 0);
  if (!sanitized.length) {
    return null;
  }

  const total = sanitized.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const segments = sanitized.map((item, index) => {
    const fraction = item.value / total;
    const start = cursor;
    cursor += fraction;
    return {
      ...item,
      percent: fraction * 100,
      dash: `${fraction * 100} ${100 - fraction * 100}`,
      offset: -start * 100,
      color: palette[index % palette.length],
    };
  });

  return (
    <div className="donut-chart-wrap">
      <svg className="donut-chart" viewBox="0 0 42 42" role="img" aria-label={ariaLabel}>
        <circle
          cx="21"
          cy="21"
          r="15.915"
          fill="none"
          stroke="var(--surface-muted)"
          strokeWidth="5"
          aria-hidden="true"
        />
        {segments.map((segment) => (
          <circle
            key={segment.label}
            cx="21"
            cy="21"
            r="15.915"
            fill="none"
            pathLength="100"
            stroke={segment.color}
            strokeDasharray={segment.dash}
            strokeDashoffset={segment.offset}
            strokeWidth="5"
            aria-hidden="true"
          />
        ))}
      </svg>
      <ul className="chart-legend">
        {segments.map((segment) => (
          <li key={segment.label}>
            <span className="legend-swatch" style={{ background: segment.color }} />
            <span>{segment.label}</span>
            <strong>{segment.displayValue}</strong>
            <span className="muted">{segment.percent.toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
