const patternClassNames = {
  solid: 'simple-bar-fill-solid',
  stripe: 'simple-bar-fill-stripe',
  dot: 'simple-bar-fill-dot',
} as const;

export function SimpleBarChart({
  data,
  ariaLabel,
}: {
  data: Array<{ label: string; value: number; displayValue: string; pattern?: 'solid' | 'stripe' | 'dot' }>;
  ariaLabel: string;
}) {
  const sanitized = data.filter((item) => Number.isFinite(item.value) && item.value >= 0);
  if (!sanitized.length) {
    return null;
  }

  const max = Math.max(...sanitized.map((item) => item.value), 1);

  return (
    <div className="simple-bar-chart" role="img" aria-label={ariaLabel}>
      {sanitized.map((item) => (
        <div className="simple-bar-row" key={item.label}>
          <span>{item.label}</span>
          <div className="simple-bar-track" aria-hidden="true">
            <div
              className={`simple-bar-fill ${patternClassNames[item.pattern ?? 'solid']}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <strong>{item.displayValue}</strong>
        </div>
      ))}
    </div>
  );
}
