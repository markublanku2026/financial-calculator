import { futureIntegrations } from '../utils/env';

export function DonationPanel() {
  const showPreview = import.meta.env.DEV && import.meta.env.VITE_DONATION_PREVIEW === 'true';
  const donationUrl = futureIntegrations.paypalDonationLink;
  if (!donationUrl && !showPreview) {
    return null;
  }

  return (
    <section className="card">
      <h2>Optional support</h2>
      <p>Donations are optional and do not unlock additional calculator functionality.</p>
      {donationUrl ? (
        <a className="button" href={donationUrl} rel="noreferrer" target="_blank">
          Open donation page
        </a>
      ) : (
        <p className="muted">Development preview only. No live donation integration is active.</p>
      )}
    </section>
  );
}
