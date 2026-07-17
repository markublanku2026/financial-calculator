import { futureIntegrations } from '../utils/env';

export function AdSlot({ placement }: { placement: 'results' | 'content' | 'directory-bottom' }) {
  if (!futureIntegrations.googleAdsenseId) {
    return null;
  }

  return <div data-placement={placement} aria-hidden="true" />;
}
