export function PrimaryResult({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <section className="primary-result" aria-live="polite" aria-atomic="true">
      <p className="eyebrow">Primary result</p>
      <h2>{label}</h2>
      <p className="primary-result-value">{value}</p>
      {detail ? <p className="muted">{detail}</p> : null}
    </section>
  );
}
