import type { CalculatorDefinition } from '../types/financial';

const aliasMap: Record<string, string[]> = {
  mortgage: ['home loan'],
  'hourly-to-annual-income': ['hourly pay', 'hourly-to-annual'],
  salary: ['annual pay'],
  'credit-card-payoff': ['debt payoff'],
  'savings-growth': ['compound interest'],
  'budget-planner': ['spending plan'],
  retirement: ['pension planning'],
};

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function tokenize(text: string) {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function getSearchTerms(calculator: CalculatorDefinition): string[] {
  return [
    calculator.title,
    calculator.category,
    calculator.description,
    ...calculator.keywords,
    ...(calculator.aliases ?? []),
    ...(aliasMap[calculator.slug] ?? []),
  ];
}

function getSearchBlob(calculator: CalculatorDefinition) {
  return getSearchTerms(calculator).join(' ').toLowerCase();
}

function getScore(calculator: CalculatorDefinition, query: string) {
  const normalized = normalize(query);
  const tokens = tokenize(query);
  if (!normalized) return 0;

  const title = calculator.title.toLowerCase();
  const description = calculator.description.toLowerCase();
  const category = calculator.category.toLowerCase();
  const aliases = [...(calculator.aliases ?? []), ...(aliasMap[calculator.slug] ?? [])].map((item) => item.toLowerCase());
  const keywords = calculator.keywords.map((item) => item.toLowerCase());
  const blob = getSearchBlob(calculator);

  let score = 0;

  if (title.includes(normalized)) score += 12;
  if (aliases.some((alias) => alias.includes(normalized))) score += 10;
  if (keywords.some((keyword) => keyword.includes(normalized))) score += 8;
  if (category.includes(normalized)) score += 6;
  if (description.includes(normalized)) score += 5;
  if (blob.includes(normalized)) score += 4;

  for (const token of tokens) {
    if (title.includes(token)) score += 4;
    if (aliases.some((alias) => alias.includes(token))) score += 4;
    if (keywords.some((keyword) => keyword.includes(token))) score += 3;
    if (category.includes(token)) score += 2;
    if (description.includes(token)) score += 2;
  }

  return score;
}

export function filterCalculators(calculators: CalculatorDefinition[], query: string): CalculatorDefinition[] {
  const normalized = normalize(query);
  if (!normalized) return calculators;

  return calculators
    .map((calculator) => ({ calculator, score: getScore(calculator, normalized) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.calculator.title.localeCompare(right.calculator.title))
    .map((item) => item.calculator);
}

export function recommendCalculators(
  calculators: CalculatorDefinition[],
  query: string,
  limit = 3,
): CalculatorDefinition[] {
  const tokens = tokenize(query);
  if (!tokens.length) {
    return calculators.slice(0, limit);
  }

  return calculators
    .map((calculator) => {
      const terms = tokenize(getSearchTerms(calculator).join(' '));
      const uniqueTerms = new Set(terms);
      const overlap = tokens.reduce((sum, token) => sum + (uniqueTerms.has(token) ? 1 : 0), 0);
      const partialMatches = terms.reduce((sum, term) => sum + (tokens.some((token) => term.includes(token) || token.includes(term)) ? 1 : 0), 0);
      return { calculator, score: overlap * 10 + partialMatches };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.calculator.title.localeCompare(right.calculator.title))
    .slice(0, limit)
    .map((item) => item.calculator);
}

export function getHighlightedText(text: string, query: string): Array<{ text: string; match: boolean }> {
  const tokens = Array.from(new Set(tokenize(query)));
  if (!tokens.length) return [{ text, match: false }];

  const regex = new RegExp(`(${tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'ig');
  return text
    .split(regex)
    .filter(Boolean)
    .map((part) => ({ text: part, match: tokens.includes(part.toLowerCase()) }));
}
