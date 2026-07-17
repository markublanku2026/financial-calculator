import { useEffect, useState } from 'react';

import { copyTextToClipboard } from '../utils/clipboard';

export function CopyResultButton({ getText, label = 'Copy result' }: { getText: () => string; label?: string }) {
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setMessage(''), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [message]);

  return (
    <div className="copy-action">
      <button
        type="button"
        onClick={async () => {
          const copied = await copyTextToClipboard(getText());
          setMessage(copied ? 'Result copied.' : 'Copy failed on this device.');
        }}
      >
        {label}
      </button>
      <span className="copy-feedback" role="status" aria-live="polite">
        {message}
      </span>
    </div>
  );
}
