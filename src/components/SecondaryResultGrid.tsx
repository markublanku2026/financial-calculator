export type SecondaryResultItem = { label: string; value: string; tone?: 'default' | 'danger' | 'success' | 'warning' };

export function SecondaryResultGrid({ items }: { items: SecondaryResultItem[] }) {
  return (
    <div className="secondary-result-grid">
      {items.map((item) => (
        <div className={`secondary-result-card secondary-result-card-${item.tone ?? 'default'}`} key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
