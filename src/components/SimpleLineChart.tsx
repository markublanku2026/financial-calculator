import type { ChartPoint } from '../utils/chart';

export function SimpleLineChart({
  points,
  ariaLabel,
}: {
  points: ChartPoint[];
  ariaLabel: string;
}) {
  const sanitized = points.filter((point) => Number.isFinite(point.value));
  if (!sanitized.length) {
    return null;
  }

  const width = 100;
  const height = 44;
  const paddingX = 6;
  const paddingY = 4;
  const values = sanitized.map((point) => point.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const path = sanitized
    .map((point, index) => {
      const x = paddingX + (index * (width - paddingX * 2)) / Math.max(sanitized.length - 1, 1);
      const y = height - paddingY - ((point.value - min) / range) * (height - paddingY * 2);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const tickPoints = sanitized.filter(
    (_, index) => index === 0 || index === sanitized.length - 1 || index === Math.floor(sanitized.length / 2),
  );

  return (
    <div className="line-chart-card">
      <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={ariaLabel}>
        <line
          x1={paddingX}
          x2={width - paddingX}
          y1={height - paddingY}
          y2={height - paddingY}
          stroke="var(--border)"
          strokeWidth="1"
          aria-hidden="true"
        />
        <path
          d={path}
          fill="none"
          stroke="var(--action-primary)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          aria-hidden="true"
        />
      </svg>
      <ul className="chart-axis-labels">
        {tickPoints.map((point) => (
          <li key={`${point.label}-${point.value}`}>{point.label}</li>
        ))}
      </ul>
    </div>
  );
}
