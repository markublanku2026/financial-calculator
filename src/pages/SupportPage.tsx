import { DonationPanel } from '../components/DonationPanel';
import { PageHero } from '../components/PageHero';
import { pageMeta } from '../data/site';
import { futureIntegrations } from '../utils/env';
import { useDocumentMeta } from '../utils/metadata';
import { buildWebPageStructuredData } from '../utils/structuredData';

export function SupportPage() {
  useDocumentMeta(
    pageMeta.support,
    buildWebPageStructuredData(
      'Support',
      'Current support scope and inactive future integration placeholders for the local-only calculator site.',
      '/support',
    ),
  );

  const placeholdersActive = Object.values(futureIntegrations).some(Boolean);

  return (
    <div className="content-stack">
      <PageHero
        eyebrow="Support"
        title="Support and feedback"
        description="This local-only build has no live support portal, no active donation flow unless explicitly configured later, and no active third-party service integration."
      />
      <section className="card">
        <h2>Current support scope</h2>
        <p>
          This project is designed to run locally first. There is no account system, no backend service, no live chat, no active advertising, and no active analytics in the current version.
        </p>
      </section>
      <section className="card">
        <h2>Donation status</h2>
        <p>
          Donations are currently inactive unless a future configuration explicitly enables them. No donation button should appear in ordinary unconfigured builds, and donating would not unlock extra calculator functionality.
        </p>
      </section>
      <section className="card">
        <h2>Future placeholder status</h2>
        <p>
          Future environment placeholders are currently {placeholdersActive ? 'present but inactive' : 'empty'}. The application is expected to work when all of them are blank.
        </p>
      </section>
      <DonationPanel />
    </div>
  );
}
