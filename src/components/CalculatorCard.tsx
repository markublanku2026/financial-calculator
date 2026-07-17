import { Link } from 'react-router-dom';

import { FavoriteButton } from './FavoriteButton';
import { HighlightedText } from './HighlightedText';

type CalculatorCardProps = {
  slug: string;
  title: string;
  description: string;
  category: string;
  route: string;
  query?: string;
};

export function CalculatorCard({ slug, title, description, category, route, query = '' }: CalculatorCardProps) {
  return (
    <article className="card calculator-card">
      <div className="calculator-card-header">
        <p className="eyebrow">{category}</p>
        <FavoriteButton slug={slug} title={title} />
      </div>
      <h2>
        <HighlightedText text={title} query={query} />
      </h2>
      <p>
        <HighlightedText text={description} query={query} />
      </p>
      <Link className="text-link" to={route}>
        Open calculator
      </Link>
    </article>
  );
}
