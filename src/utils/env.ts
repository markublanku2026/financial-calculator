export const futureIntegrations = {
  googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID ?? '',
  googleAdsenseId: import.meta.env.VITE_GOOGLE_ADSENSE_ID ?? '',
  paypalDonationLink: import.meta.env.VITE_PAYPAL_DONATION_LINK ?? '',
};

function resolveFallbackOrigin() {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }

  return 'https://example.invalid';
}

export const siteOrigin = import.meta.env.VITE_SITE_ORIGIN?.trim() || resolveFallbackOrigin();
export const donationPreviewEnabled = import.meta.env.DEV && import.meta.env.VITE_DONATION_PREVIEW === 'true';
export const e2eTestRouteEnabled = import.meta.env.VITE_E2E_TEST_ROUTE === 'true';
