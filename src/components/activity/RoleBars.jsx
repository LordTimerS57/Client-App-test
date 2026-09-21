export function RoleBars({ roles, total }) {
  const rows = [
    { key: 'etudiant', label: 'Étudiants', value: roles.etudiant },
    { key: 'prof', label: 'Professeurs', value: roles.prof },
    { key: 'admin', label: 'Administrateurs', value: roles.admin }
  ];
  return (
    <div className="stat-panel">
      {rows.map(row => {
        const pct = total ? Math.round((row.value / total) * 100) : 0;
        return (
          <div className="stat-bar-row" key={row.key}>
            <span>{row.label}</span>
            <div className="stat-bar-track">
              <div className={`stat-bar-fill ${row.key}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="stat-bar-value">{row.value} <small>({pct}%)</small></span>
          </div>
        );
      })}
    </div>
  );
}
