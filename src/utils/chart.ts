export type ChartPoint = {
  label: string;
  value: number;
};

function isFiniteChartPoint(point: ChartPoint) {
  return Number.isFinite(point.value);
}

export function dedupeAdjacentPoints(points: ChartPoint[]): ChartPoint[] {
  const sanitized = points.filter(isFiniteChartPoint);
  return sanitized.filter(
    (point, index) =>
      index === 0 || sanitized[index - 1].value !== point.value || sanitized[index - 1].label !== point.label,
  );
}

export function sampleChartSeries(points: ChartPoint[], maxPoints = 24): ChartPoint[] {
  const sanitized = dedupeAdjacentPoints(points);
  if (sanitized.length <= 1 || maxPoints <= 1) {
    return sanitized.slice(0, 1);
  }

  if (sanitized.length <= maxPoints) {
    return sanitized;
  }

  const sampled: ChartPoint[] = [sanitized[0]];
  const interiorSlots = Math.max(maxPoints - 2, 0);

  for (let index = 1; index <= interiorSlots; index += 1) {
    const sourceIndex = Math.round((index * (sanitized.length - 1)) / (interiorSlots + 1));
    sampled.push(sanitized[sourceIndex]);
  }

  sampled.push(sanitized[sanitized.length - 1]);
  return dedupeAdjacentPoints(sampled);
}
