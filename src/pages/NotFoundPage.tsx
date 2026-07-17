import { Link } from 'react-router-dom';

import { PageHero } from '../components/PageHero';
import { pageMeta } from '../data/site';
import { useDocumentMeta } from '../utils/metadata';
import { buildWebPageStructuredData } from '../utils/structuredData';

export function NotFoundPage() {
  useDocumentMeta(
    pageMeta.notFound,
    buildWebPageStructuredData('Page Not Found', 'The requested page could not be found.', '/404'),
  );

  return (
    <div className="content-stack">
      <PageHero
        eyebrow="404"
        title="Page not found"
        description="The page you requested does not exist in this local calculator site."
      />
      <section className="card">
        <p>Use the calculator directory to return to a valid route.</p>
        <Link className="button" to="/calculators">
          Go to calculator directory
        </Link>
      </section>
    </div>
  );
}
