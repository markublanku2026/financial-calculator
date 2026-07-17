export function CalculationAssumptions({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <section className="card assumptions-card">
      <h2>Calculation assumptions</h2>
      <dl className="assumptions-list">
        {items.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
