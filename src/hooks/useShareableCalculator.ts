import { useEffect, useMemo, useRef, useState } from 'react';

import type { ShareSchema } from '../types/share';
import { copyTextToClipboard } from '../utils/clipboard';
import { buildShareCalculationUrl, getShareLoadNotice, parseShareCalculation } from '../utils/shareCalculation';

export function useShareableCalculator<T extends Record<string, string>>({
  pathname,
  schema,
  submittedValues,
  applySharedValues,
  search,
  origin,
}: {
  pathname: string;
  schema: ShareSchema<T>;
  submittedValues: Partial<T> | null;
  applySharedValues: (values: Partial<T>) => void;
  search?: string;
  origin?: string;
}) {
  const [shareMessage, setShareMessage] = useState('');
  const [initialSearch] = useState(() => search ?? (typeof window !== 'undefined' ? window.location.search : ''));
  const [currentOrigin] = useState(() => origin ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost'));
  const hasAppliedSharedValues = useRef(false);

  const parsed = useMemo(() => parseShareCalculation(schema, initialSearch), [initialSearch, schema]);
  const shareNotice = useMemo(() => getShareLoadNotice(parsed), [parsed]);
  const shareUrl = useMemo(
    () => (submittedValues ? buildShareCalculationUrl(pathname, schema, submittedValues, currentOrigin) : ''),
    [currentOrigin, pathname, schema, submittedValues],
  );

  useEffect(() => {
    if (hasAppliedSharedValues.current || !parsed.loaded) {
      return;
    }

    applySharedValues(parsed.values);
    hasAppliedSharedValues.current = true;
  }, [applySharedValues, parsed.loaded, parsed.values]);

  useEffect(() => {
    if (!shareMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setShareMessage(''), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [shareMessage]);

  const share = async () => {
    if (!submittedValues) {
      return false;
    }

    const copied = await copyTextToClipboard(shareUrl);
    setShareMessage(copied ? 'Share link copied.' : 'Could not copy the share link.');
    return copied;
  };

  return {
    share,
    shareUrl,
    shareEnabled: Boolean(submittedValues),
    shareMessage,
    shareNotice,
  };
}
