export function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`stat-card ${accent ? 'accent' : ''}`}>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}
