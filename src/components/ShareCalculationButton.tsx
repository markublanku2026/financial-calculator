export function ShareCalculationButton({
  onShare,
  disabled,
  message,
}: {
  onShare: () => Promise<boolean>;
  disabled?: boolean;
  message?: string;
}) {
  return (
    <div className="copy-action share-action">
      <button type="button" onClick={() => void onShare()} disabled={disabled}>
        Share calculation
      </button>
      <span className="copy-feedback" role="status" aria-live="polite">
        {message}
      </span>
      <p className="muted share-note">Anyone with this link can view the calculation values included in the URL.</p>
    </div>
  );
}
