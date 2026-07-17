export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`;
}

export function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function formatYearsMonths(months: number): string {
  if (months <= 0) {
    return '0 months';
  }

  const wholeYears = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (wholeYears === 0) {
    return `${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`;
  }

  if (remainingMonths === 0) {
    return `${wholeYears} year${wholeYears === 1 ? '' : 's'}`;
  }

  return `${wholeYears} year${wholeYears === 1 ? '' : 's'} ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`;
}
