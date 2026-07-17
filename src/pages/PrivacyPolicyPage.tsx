import { PageHero } from '../components/PageHero';
import { pageMeta } from '../data/site';
import { useDocumentMeta } from '../utils/metadata';
import { buildWebPageStructuredData } from '../utils/structuredData';

export function PrivacyPolicyPage() {
  useDocumentMeta(
    pageMeta.privacy,
    buildWebPageStructuredData(
      'Privacy Policy',
      'Local-only privacy policy describing browser-based calculations, non-sensitive local preferences, and inactive future integrations.',
      '/privacy-policy',
    ),
  );

  return (
    <div className="content-stack">
      <PageHero
        eyebrow="Privacy"
        title="Privacy Policy"
        description="This local-only version performs calculations in the browser and does not currently activate analytics, ads, donations, or backend services."
      />
      <section className="card">
        <h2>How calculations work</h2>
        <p>
          Calculator inputs are processed locally in your browser. This version of the application has no backend, no database, no authentication system, and no registration requirement.
        </p>
        <p>
          Financial inputs and calculated results are not intentionally transmitted anywhere by this application and are not saved by default.
        </p>
      </section>
      <section className="card">
        <h2>Local preferences</h2>
        <p>
          The only intended local storage is a non-sensitive preferences record used for display and convenience settings on this device.
        </p>
        <p>
          That preferences record may include currency display format, reduced-motion preference, schedule expansion preference, favorite calculator slugs, and recently used calculator slugs.
        </p>
      </section>
      <section className="card">
        <h2>What is not active</h2>
        <p>
          Google Analytics, Google AdSense, and PayPal-related placeholders may exist as environment variables for future development, but those services are not currently loaded, initialized, or contacted by this application.
        </p>
      </section>
      <section className="card">
        <h2>Personal data expectations</h2>
        <p>
          You do not need to create an account or submit personal financial data to use the calculators in this local-only build.
        </p>
        <p>
          No software can promise absolute privacy in every environment, but the current code is intended to keep calculations in the browser and limit local persistence to the non-sensitive preferences described above.
        </p>
      </section>
    </div>
  );
}
